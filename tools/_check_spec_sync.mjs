// CI 檢查：改到程式碼的 PR，一定要同步 Google 雲端硬碟的規格書。
//
// - spec-sync.json 的 spec_version 要比基準版本大（規格書內容有改）；或
// - 版本不變，但 PR 說明或任一個 commit 訊息有一行以「規格書不受影響：」開頭並寫出原因。
// 原因不寫進 spec-sync.json：每個 PR 都改同一行，同時開著的 PR 合併一個，其他就全部衝突。
// 只改文件、測試或產生的檔案（README、AGENTS.md、CLAUDE.md、.claude/、tools/tests/、履歷 PDF、英文鍵清單）不用同步。
//
// 用法：node tools/_check_spec_sync.mjs <基準 ref>（PR 用 origin/main，推到 main 用 HEAD^1）
// PR 說明由環境變數 PR_BODY 傳入。
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SPEC_FILE = 'spec-sync.json';
export const SKIP_PREFIX = '規格書不受影響：';
// 也接受 agent-hub PR 說明的寫法「規格書：不受影響：」，前面可以有清單符號或粗體
const SKIP_LINE = /^[\s>*_\-]*規格書\s*[：:]?\s*不受影響\s*[：:]\s*(.*)$/;
const NOT_CODE = [
  /^README\.md$/, /^AGENTS\.md$/, /^CLAUDE\.md$/, /^\.claude\//, /^tools\/tests\//, /^spec-sync\.json$/, /^\.gitattributes$/,
  // Build CV PDFs 和 _extract_en.py 產生的檔案
  /^assets\/pdf\//, /^tools\/_en_keys\.json$/,
];

export function isCode(file) {
  return !NOT_CODE.some((pattern) => pattern.test(file));
}

export function parseVersion(value) {
  const match = String(value || '').match(/^(\d+)\.(\d+)$/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function newer(a, b) {
  return a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
}

// 從 PR 說明或 commit 訊息找「規格書不受影響：原因」，回傳原因（沒有就是 null）
export function findSkipReason(texts) {
  for (const text of texts) {
    for (const line of String(text || '').split(/\r?\n/)) {
      const match = line.match(SKIP_LINE);
      const reason = match && match[1].replace(/^[*_\s]+|[*_\s]+$/g, '');
      if (reason) return reason;
    }
  }
  return null;
}

// changed：這次改到的檔案；base／head：基準和目前的 spec-sync.json 內容（基準沒有這個檔案時是 null）
// notes：PR 說明和這次的 commit 訊息
export function checkSpecSync({ changed, base, head, notes = [] }) {
  const code = changed.filter(isCode);
  if (!code.length) return { ok: true, message: '只改了文件或測試，不需要同步規格書。' };
  if (!head) return { ok: false, message: `改了程式碼，但找不到 ${SPEC_FILE}。` };

  const headVersion = parseVersion(head.spec_version);
  if (!headVersion) return { ok: false, message: `${SPEC_FILE} 的 spec_version 格式要像 1.6，現在是 ${JSON.stringify(head.spec_version)}。` };
  if (!base) return { ok: true, message: `第一次加入 ${SPEC_FILE}，規格書版本 ${head.spec_version}。` };

  const baseVersion = parseVersion(base.spec_version) || [0, 0];
  if (newer(headVersion, baseVersion)) {
    return { ok: true, message: `規格書版本 ${base.spec_version} → ${head.spec_version}。` };
  }
  if (!newer(baseVersion, headVersion)) {
    const reason = findSkipReason(notes);
    if (reason) return { ok: true, message: `規格書版本維持 ${head.spec_version}。${SKIP_PREFIX}${reason}` };
  }

  const list = code.slice(0, 10).join('、') + (code.length > 10 ? ` 等 ${code.length} 個檔案` : '');
  return {
    ok: false,
    message: `改了程式碼（${list}），但規格書版本沒有比 ${base.spec_version} 大。請同步 Google 雲端硬碟的規格書，再把 ${SPEC_FILE} 的 spec_version 改成規格書的新版本號；規格書不受影響時，在 PR 說明（或 commit 訊息）寫一行「${SKIP_PREFIX}原因」。`,
  };
}

function git(...args) {
  // 錯誤訊息不印出：基準版本還沒有 spec-sync.json 時 git show 會失敗，這是正常情況
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function readJsonAt(ref) {
  try {
    return JSON.parse(git('show', `${ref}:${SPEC_FILE}`));
  } catch {
    return null;
  }
}

function main() {
  const baseRef = process.argv[2] || 'origin/main';
  const onPush = baseRef === 'HEAD^1';
  // 推到 main 的是合併 PR 的 commit 時，PR 的檢查已經擋過（原因寫在 PR 說明，這裡讀不到）
  if (onPush && /^Merge pull request #\d+/.test(git('log', '-1', '--format=%s')) && git('log', '-1', '--format=%P').trim().split(/\s+/).length > 1) {
    console.log('合併 PR 的 commit：PR 的 spec-sync 檢查已經擋過。');
    return;
  }
  const range = onPush ? ['HEAD^1', 'HEAD'] : [`${baseRef}...HEAD`];
  const changed = git('diff', '--name-only', ...range).split('\n').map((line) => line.trim()).filter(Boolean);
  let head = null;
  try {
    head = JSON.parse(readFileSync(SPEC_FILE, 'utf8'));
  } catch {
    head = null;
  }
  const messages = git('log', '--format=%B%x00', onPush ? 'HEAD^1..HEAD' : `${baseRef}..HEAD`).split('\0');
  const notes = [process.env.PR_BODY || '', ...messages];
  const result = checkSpecSync({ changed, base: readJsonAt(onPush ? 'HEAD^1' : baseRef), head, notes });
  console.log(result.message);
  if (!result.ok) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
