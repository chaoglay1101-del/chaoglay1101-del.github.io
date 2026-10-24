// 規格書同步檢查（CI 用）。執行：npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSpecSync, isCode, parseVersion } from '../_check_spec_sync.mjs';

const base = { spec_version: '1.5', last_change: '新增 AGENTS.md' };

test('只改文件或測試時不用同步', () => {
  for (const file of ['README.md', 'AGENTS.md', 'CLAUDE.md', '.claude/skills/sync-spec/SKILL.md', 'tools/tests/a.test.js', 'assets/pdf/Chao_YuChen_CV_EN.pdf', 'tools/_en_keys.json']) {
    assert.equal(isCode(file), false, file);
  }
  for (const file of ['index.html', 'assets/js/main.js', 'assets/js/i18n.js', 'tools/_verify_html.py', '.github/workflows/checks.yml', 'robots.txt']) {
    assert.equal(isCode(file), true, file);
  }
  assert.equal(checkSpecSync({ changed: ['README.md', 'tools/tests/x.test.js'], base, head: base }).ok, true);
});

test('改了程式碼卻沒更新 spec-sync.json 就失敗', () => {
  const result = checkSpecSync({ changed: ['worker/index.js'], base, head: base });
  assert.equal(result.ok, false);
  assert.match(result.message, /worker\/index\.js/);
});

test('版本號往上加就通過，不能倒退或不變', () => {
  const ok = checkSpecSync({ changed: ['worker/index.js', 'spec-sync.json'], base, head: { spec_version: '1.6', last_change: 'x' } });
  assert.equal(ok.ok, true);
  assert.equal(checkSpecSync({ changed: ['src/a.astro', 'spec-sync.json'], base, head: { spec_version: '2.0' } }).ok, true);
  assert.equal(checkSpecSync({ changed: ['src/a.astro', 'spec-sync.json'], base, head: { spec_version: '1.4' } }).ok, false);
  assert.equal(checkSpecSync({ changed: ['src/a.astro', 'spec-sync.json'], base, head: { spec_version: '1.5', last_change: '改了文字' } }).ok, false);
  assert.equal(checkSpecSync({ changed: ['src/a.astro', 'spec-sync.json'], base: { spec_version: '1.9' }, head: { spec_version: '1.10' } }).ok, true);
});

test('規格書不受影響時，版本不變但要寫新的原因', () => {
  const skip = { spec_version: '1.5', last_change: '規格書不受影響：只修正首頁錯字' };
  assert.equal(checkSpecSync({ changed: ['src/pages/index.astro', 'spec-sync.json'], base, head: skip }).ok, true);
  assert.equal(checkSpecSync({ changed: ['src/pages/index.astro', 'spec-sync.json'], base, head: { spec_version: '1.5', last_change: '規格書不受影響：' } }).ok, false);
  assert.equal(checkSpecSync({ changed: ['src/pages/index.astro', 'spec-sync.json'], base: skip, head: skip }).ok, false);
});

test('版本號格式與第一次加入', () => {
  assert.deepEqual(parseVersion('1.12'), [1, 12]);
  assert.equal(parseVersion('v1.5'), null);
  assert.equal(checkSpecSync({ changed: ['worker/index.js', 'spec-sync.json'], base, head: { spec_version: 'v1.6' } }).ok, false);
  assert.equal(checkSpecSync({ changed: ['worker/index.js', 'spec-sync.json'], base: null, head: { spec_version: '1.6' } }).ok, true);
  assert.equal(checkSpecSync({ changed: ['worker/index.js'], base: null, head: null }).ok, false);
});
