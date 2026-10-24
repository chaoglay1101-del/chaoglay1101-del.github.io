// 規格書版本紀錄自動加列：只測產生的 Docs API 請求，不連 Google。執行：npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVerify, generateKeyPairSync } from 'node:crypto';
import {
  buildAssertion,
  cellText,
  describeCommit,
  fillRowRequests,
  findVersionTable,
  formatTime,
  hasCommit,
  insertRowRequest,
  withSpecVersion,
} from '../_spec_version_log.mjs';

// 模擬 Docs API 回傳的表格：每格一個段落，startIndex 依序遞增
function cell(text, start) {
  return {
    content: [{ startIndex: start, paragraph: { elements: text ? [{ textRun: { content: `${text}\n` } }] : [] } }],
  };
}

function table(startIndex, rows) {
  let index = startIndex + 1;
  return {
    startIndex,
    table: {
      tableRows: rows.map((texts) => ({
        tableCells: texts.map((text) => {
          const c = cell(text, (index += 1));
          index += text.length + 1;
          return c;
        }),
      })),
    },
  };
}

const settings = table(100, [['項目', '值'], ['GitHub repo', 'chaoglay1101-del/chaoglay1101-del.github.io']]);
const versions = table(500, [
  ['時間', 'Commit', '內容'],
  ['10/23 14:09', '6ead28c', '首頁改以服務為主'],
  ['10/24 20:58', '72ad89a', '新詢價寄通知信（Resend，PR #1）'],
]);
const doc = { revisionId: 'r1', body: { content: [{ paragraph: {} }, settings, { paragraph: {} }, versions] } };

test('找到表頭是「時間｜Commit｜內容」的版本紀錄表', () => {
  assert.equal(findVersionTable(doc), versions);
  assert.equal(findVersionTable({ body: { content: [settings] } }), null);
  assert.equal(cellText(versions.table.tableRows[1].tableCells[1]), '6ead28c');
});

test('已經記過的 commit 不再加', () => {
  assert.equal(hasCommit(versions, '72ad89a'), true);
  assert.equal(hasCommit(versions, 'abc1234'), false);
});

test('在最後一列下面插入新列', () => {
  assert.deepEqual(insertRowRequest(versions), {
    insertTableRow: {
      tableCellLocation: { tableStartLocation: { index: 500 }, rowIndex: 2, columnIndex: 0 },
      insertBelow: true,
    },
  });
});

test('填新列時從最後一格往前插入，位置才不會跑掉', () => {
  const withEmptyRow = table(500, [['時間', 'Commit', '內容'], ['', '', '']]);
  const cells = withEmptyRow.table.tableRows[1].tableCells.map((c) => c.content[0].startIndex);
  const requests = fillRowRequests(withEmptyRow, ['10/25 09:00', 'abc1234', '加上規格書自動同步']);
  assert.deepEqual(
    requests.map((r) => r.insertText.location.index),
    [...cells].sort((a, b) => b - a),
  );
  assert.equal(requests[0].insertText.text, '加上規格書自動同步');
});

test('時間換成 UTC+8，格式和表裡一致', () => {
  assert.equal(formatTime('2026-10-24T12:58:37Z'), '10/24 20:58');
  assert.equal(formatTime('2026-12-31T16:05:00Z'), '1/01 00:05');
});

test('服務帳號的 JWT 用私鑰簽名，只要求 Google 文件權限', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const key = { client_email: 'sync@demo.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
  const [header, payload, signature] = buildAssertion(key, 1000).split('.');
  const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString());
  assert.deepEqual(decode(header), { alg: 'RS256', typ: 'JWT' });
  assert.deepEqual(decode(payload), {
    iss: 'sync@demo.iam.gserviceaccount.com',
    scope: 'https://www.googleapis.com/auth/documents',
    aud: 'https://oauth2.googleapis.com/token',
    iat: 1000,
    exp: 1600,
  });
  const valid = createVerify('RSA-SHA256').update(`${header}.${payload}`).verify(publicKey, signature, 'base64url');
  assert.equal(valid, true);
});

test('合併 PR 的 commit 用 PR 標題當內容', () => {
  assert.equal(
    describeCommit('Merge pull request #1 from techstarterweb/inquiry-email-notify', '\n新詢價寄通知信（Resend）\n'),
    '新詢價寄通知信（Resend）（PR #1）',
  );
  assert.equal(describeCommit('Fix a typo', ''), 'Fix a typo');
});

test('內容附上對應的規格書版本', () => {
  assert.equal(withSpecVersion('新增 AGENTS.md（PR #3）', '1.6'), '新增 AGENTS.md（PR #3）（規格書 v1.6）');
  assert.equal(withSpecVersion('舊的 commit', ''), '舊的 commit');
});
