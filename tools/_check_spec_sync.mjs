// CI 檢查：改到程式碼的 PR，一定要一起更新 spec-sync.json（也就是有同步 Google 雲端硬碟的規格書）。
//
// - spec_version 要比基準版本大（規格書內容有改）；或
// - spec_version 不變，但 last_change 以「規格書不受影響：」開頭並寫出原因。
// 只改文件、測試或產生的檔案（README、AGENTS.md、CLAUDE.md、.claude/、tools/tests/、履歷 PDF、英文鍵清單）不用更新。
//
// 用法：node tools/_check_spec_sync.mjs <基準 ref>（PR 用 origin/main，推到 main 用 HEAD^1）
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SPEC_FILE = 'spec-sync.json';
export const SKIP_PREFIX = '規格書不受影響：';
const NOT_CODE = [
  /^README\.md$/, /^AGENTS\.md$/, /^CLAUDE\.md$/, /^\.claude\//, /^tools\/tests\//, /^spec-sync\.json$/,
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

// changed：這次改到的檔案；base／head：基準和目前的 spec-sync.json 內容（基準沒有這個檔案時是 null）
export function checkSpecSync({ changed, base, head }) {
  const code = changed.filter(isCode);
  if (!code.length) return { ok: true, message: '只改了文件或測試，不需要同步規格書。' };
  if (!head) return { ok: false, message: `改了程式碼，但找不到 ${SPEC_FILE}。` };

  const headVersion = parseVersion(head.spec_version);
  if (!headVersion) return { ok: false, message: `${SPEC_FILE} 的 spec_version 格式要像 1.6，現在是 ${JSON.stringify(head.spec_version)}。` };
  if (!base) return { ok: true, message: `第一次加入 ${SPEC_FILE}，規格書版本 ${head.spec_version}。` };

  const list = code.slice(0, 10).join('、') + (code.length > 10 ? ` 等 ${code.length} 個檔案` : '');
  if (!changed.includes(SPEC_FILE)) {
    return {
      ok: false,
      message: `改了程式碼（${list}），但沒有更新 ${SPEC_FILE}。請同步 Google 雲端硬碟的規格書，再把 spec_version 改成規格書的新版本號；規格書不受影響時，last_change 以「${SKIP_PREFIX}」開頭寫原因。`,
    };
  }

  const baseVersion = parseVersion(base.spec_version) || [0, 0];
  if (newer(headVersion, baseVersion)) {
    return { ok: true, message: `規格書版本 ${base.spec_version} → ${head.spec_version}：${head.last_change || ''}` };
  }
  if (head.spec_version === base.spec_version && String(head.last_change || '').startsWith(SKIP_PREFIX)
      && String(head.last_change).length > SKIP_PREFIX.length && head.last_change !== base.last_change) {
    return { ok: true, message: `規格書版本維持 ${head.spec_version}。${head.last_change}` };
  }
  return {
    ok: false,
    message: `${SPEC_FILE} 有改，但 spec_version 沒有比 ${base.spec_version} 大；規格書不受影響時，last_change 要以「${SKIP_PREFIX}」開頭寫這次的原因。`,
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
  const range = baseRef === 'HEAD^1' ? ['HEAD^1', 'HEAD'] : [`${baseRef}...HEAD`];
  const changed = git('diff', '--name-only', ...range).split('\n').map((line) => line.trim()).filter(Boolean);
  let head = null;
  try {
    head = JSON.parse(readFileSync(SPEC_FILE, 'utf8'));
  } catch {
    head = null;
  }
  const result = checkSpecSync({ changed, base: readJsonAt(baseRef === 'HEAD^1' ? 'HEAD^1' : baseRef), head });
  console.log(result.message);
  if (!result.ok) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
