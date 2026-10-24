// Claude Code 的 PreToolUse hook：擋下直接推到 main 的 git push，請代理人改開 PR。
// 網頁上的鉛筆編輯和 Build CV PDFs 還會直接提交 main，所以不開分支保護，改在這裡先擋一層；漏掉的由
// .github/workflows/direct-push-alert.yml 開 issue 提醒。
//
// 讀 stdin 的 JSON（tool_input.command、cwd），要擋時 exit 2 並把原因寫到 stderr。
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PROTECTED = 'main';

function tokenize(segment) {
  return (segment.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((token) => token.replace(/^["']|["']$/g, ''));
}

// 一個 refspec 是否會更新遠端的 main（main、HEAD:main、+main、refs/heads/main、:main 刪除也算）
export function targetsProtected(refspec) {
  const dest = refspec.replace(/^\+/, '').split(':').pop();
  return dest === PROTECTED || dest === `refs/heads/${PROTECTED}`;
}

// 回傳擋下的原因；不用擋時回傳 null。currentBranch：目前分支，用來判斷沒寫 refspec 的 git push
export function checkCommand(command, currentBranch) {
  const segments = String(command || '').split(/&&|\|\||[;|\n]/);
  for (const segment of segments) {
    const tokens = tokenize(segment);
    const gitAt = tokens.findIndex((token) => /(^|[\\/])git(\.exe)?$/i.test(token));
    if (gitAt === -1) continue;
    const pushAt = tokens.indexOf('push', gitAt + 1);
    if (pushAt === -1) continue;
    const args = tokens.slice(pushAt + 1);
    if (args.some((arg) => arg === '--all' || arg === '--mirror')) {
      return `「${segment.trim()}」會一次推送所有分支（包含 ${PROTECTED}）。`;
    }
    const positional = args.filter((arg) => !arg.startsWith('-'));
    const refspecs = positional.slice(1);
    if (refspecs.some(targetsProtected)) {
      return `「${segment.trim()}」會直接更新遠端的 ${PROTECTED}。`;
    }
    if (!refspecs.length && currentBranch === PROTECTED) {
      return `目前在 ${PROTECTED} 分支，「${segment.trim()}」會直接推到 ${PROTECTED}。`;
    }
  }
  return null;
}

function currentBranchOf(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return;
  }
  const command = input.tool_input && input.tool_input.command;
  if (!command || !/\bpush\b/.test(command)) return;
  const reason = checkCommand(command, currentBranchOf(input.cwd));
  if (!reason) return;
  process.stderr.write(
    `${reason}這個 repo 推到 ${PROTECTED} 會直接發布到網站，而且會跳過 Site checks 和規格書同步檢查。` +
      `請改成：開新分支 → 推送分支 → gh pr create → 等 Site checks（checks、spec-sync）通過 → gh pr merge。`,
  );
  process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
