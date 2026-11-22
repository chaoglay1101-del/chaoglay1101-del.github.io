// 規格書同步檢查（CI 用）。執行：npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSpecSync, findSkipReason, isCode, parseVersion } from '../_check_spec_sync.mjs';

const base = { spec_version: '1.5' };

test('只改文件或測試時不用同步', () => {
  for (const file of ['README.md', 'AGENTS.md', 'CLAUDE.md', '.claude/skills/sync-spec/SKILL.md', 'tools/tests/a.test.js', 'assets/pdf/Chao_YuChen_CV_EN.pdf', 'tools/_en_keys.json', '.gitattributes']) {
    assert.equal(isCode(file), false, file);
  }
  for (const file of ['index.html', 'assets/js/main.js', 'assets/js/i18n.js', 'tools/_verify_html.py', '.github/workflows/checks.yml', 'robots.txt']) {
    assert.equal(isCode(file), true, file);
  }
  assert.equal(checkSpecSync({ changed: ['README.md', 'tools/tests/x.test.js'], base, head: base }).ok, true);
});

test('改了程式碼，版本沒加也沒寫原因就失敗', () => {
  const result = checkSpecSync({ changed: ['worker/index.js'], base, head: base });
  assert.equal(result.ok, false);
  assert.match(result.message, /worker\/index\.js/);
  assert.match(result.message, /PR 說明/);
});

test('版本號往上加就通過，不能倒退', () => {
  assert.equal(checkSpecSync({ changed: ['worker/index.js', 'spec-sync.json'], base, head: { spec_version: '1.6' } }).ok, true);
  assert.equal(checkSpecSync({ changed: ['src/a.astro', 'spec-sync.json'], base, head: { spec_version: '2.0' } }).ok, true);
  assert.equal(checkSpecSync({ changed: ['src/a.astro', 'spec-sync.json'], base, head: { spec_version: '1.4' } }).ok, false);
  assert.equal(checkSpecSync({ changed: ['src/a.astro', 'spec-sync.json'], base: { spec_version: '1.9' }, head: { spec_version: '1.10' } }).ok, true);
  // 版本倒退時，寫了原因也不行
  assert.equal(checkSpecSync({ changed: ['src/a.astro'], base, head: { spec_version: '1.4' }, notes: ['規格書不受影響：x'] }).ok, false);
});

test('規格書不受影響時，版本不變，原因寫在 PR 說明或 commit 訊息', () => {
  const ok = (notes) => checkSpecSync({ changed: ['index.html'], base, head: base, notes }).ok;
  assert.equal(ok(['## 目標\n\n規格書不受影響：只修正首頁錯字']), true);
  assert.equal(ok(['', '修正錯字\n\n規格書不受影響：只修正首頁錯字\n']), true);
  // agent-hub PR 說明的寫法
  assert.equal(ok(['規格書：不受影響：只改一句文案']), true);
  assert.equal(ok(['- **規格書不受影響：** 只改一句文案']), true);
  // 沒寫原因、或只在句子中間提到
  assert.equal(ok(['規格書不受影響：']), false);
  assert.equal(ok(['這次規格書不受影響：x']), false);
  assert.equal(ok([]), false);
});

test('findSkipReason 取出原因', () => {
  assert.equal(findSkipReason(['a\n規格書不受影響：只改文案\nb']), '只改文案');
  assert.equal(findSkipReason(['規格書：不受影響：測試']), '測試');
  assert.equal(findSkipReason(['規格書已更新到 v1.7']), null);
});

test('版本號格式與第一次加入', () => {
  assert.deepEqual(parseVersion('1.12'), [1, 12]);
  assert.equal(parseVersion('v1.5'), null);
  assert.equal(checkSpecSync({ changed: ['worker/index.js', 'spec-sync.json'], base, head: { spec_version: 'v1.6' } }).ok, false);
  assert.equal(checkSpecSync({ changed: ['worker/index.js', 'spec-sync.json'], base: null, head: { spec_version: '1.6' } }).ok, true);
  assert.equal(checkSpecSync({ changed: ['worker/index.js'], base: null, head: null }).ok, false);
});
