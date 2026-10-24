// Claude Code 擋下直接推 main 的 hook。執行：npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { checkCommand, targetsProtected } from '../../.claude/hooks/block-main-push.mjs';

test('明確推到 main 的 refspec 都擋下', () => {
  for (const command of [
    'git push origin main',
    'git push -u origin main',
    'git push origin HEAD:main',
    'git push --force origin +main',
    'git push origin feature:refs/heads/main',
    'git push origin :main',
    'cd repo && git push origin main 2>&1',
    '"C:\\Program Files\\Git\\bin\\git.exe" push origin main',
    'git push --all origin',
  ]) {
    assert.ok(checkCommand(command, 'feature'), command);
  }
});

test('在 main 分支上沒寫 refspec 的 git push 也擋下', () => {
  assert.ok(checkCommand('git push', 'main'));
  assert.ok(checkCommand('git push origin', 'main'));
  assert.ok(checkCommand('git push -u origin', 'main'));
});

test('推功能分支、合併 PR 等正常操作不擋', () => {
  for (const command of [
    'git push -u origin spec-version-map',
    'git push origin feature:feature',
    'git push',
    'gh pr merge 4 --merge --delete-branch',
    'git pull --ff-only',
    'echo push main',
    'git log --oneline origin/main',
  ]) {
    assert.equal(checkCommand(command, 'feature'), null, command);
  }
  assert.equal(checkCommand('git push origin feature', 'main'), null);
  assert.equal(targetsProtected('maintenance'), false);
});

test('實際執行 hook：擋下時 exit 2，其他時候 exit 0', () => {
  const run = (command) => {
    try {
      execFileSync('node', ['.claude/hooks/block-main-push.mjs'], {
        input: JSON.stringify({ tool_input: { command } }),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return 0;
    } catch (err) {
      return err.status;
    }
  };
  assert.equal(run('git push origin main'), 2);
  assert.equal(run('git push origin some-branch'), 0);
  assert.equal(run('npm test'), 0);
});
