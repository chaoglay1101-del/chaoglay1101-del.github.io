// 每次推到 main，在 Google 雲端硬碟「Yu-Chen Chao 個人網站規格書」第 10 節的版本紀錄加一列（時間、Commit、內容）。
//
// 由 .github/workflows/spec-version-log.yml 執行；只用 Node 內建功能，不用安裝套件。
// 需要：GOOGLE_SERVICE_ACCOUNT（服務帳號金鑰 JSON，GitHub Secret）、SPEC_DOC_ID（文件 ID）。
// 沒設定金鑰時直接略過、不算失敗。同一個 commit 已經在表裡（例如代理人已經手動加過）就不再加。
//
// 本機試跑（只印出要加的內容，不連 Google）：node tools/_spec_version_log.mjs --dry-run
import { createSign } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const HEADER = ['時間', 'Commit', '內容'];
const DOCS_API = 'https://docs.googleapis.com/v1/documents';

/* ---------------- 讀文件結構（純函式，方便測試） ---------------- */

export function cellText(cell) {
  return (cell.content || [])
    .flatMap((block) => (block.paragraph ? block.paragraph.elements || [] : []))
    .map((el) => (el.textRun ? el.textRun.content : ''))
    .join('')
    .trim();
}

// 版本紀錄表：表頭是「時間｜Commit｜內容」的表格，取文件裡最後一個
export function findVersionTable(doc) {
  const tables = (doc.body?.content || []).filter((el) => el.table);
  const matches = tables.filter((el) => {
    const header = el.table.tableRows?.[0]?.tableCells || [];
    return header.length === HEADER.length && header.every((cell, i) => cellText(cell) === HEADER[i]);
  });
  return matches.at(-1) || null;
}

export function hasCommit(tableEl, shortSha) {
  return tableEl.table.tableRows.slice(1).some((row) => cellText(row.tableCells[1]) === shortSha);
}

export function insertRowRequest(tableEl) {
  return {
    insertTableRow: {
      tableCellLocation: {
        tableStartLocation: { index: tableEl.startIndex },
        rowIndex: tableEl.table.tableRows.length - 1,
        columnIndex: 0,
      },
      insertBelow: true,
    },
  };
}

// 新列的每一格都是空段落；從最後一格往前插入，前面格子的位置才不會跑掉
export function fillRowRequests(tableEl, values) {
  const row = tableEl.table.tableRows.at(-1);
  return row.tableCells
    .map((cell, i) => ({ index: cell.content[0].startIndex, text: values[i] || '' }))
    .filter((item) => item.text)
    .sort((a, b) => b.index - a.index)
    .map(({ index, text }) => ({ insertText: { location: { index }, text } }));
}

/* ---------------- 從 git 整理這次的紀錄 ---------------- */

// 台北／新加坡時間（UTC+8），格式和表裡一致：10/24 20:58
export function formatTime(iso) {
  const d = new Date(Date.parse(iso) + 8 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCMonth() + 1}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

// 合併 PR 的 commit 用 PR 標題當內容，並註明 PR 編號
export function describeCommit(subject, body) {
  const merge = subject.match(/^Merge pull request #(\d+)/);
  if (merge) {
    const title = (body || '').split('\n').map((line) => line.trim()).find(Boolean);
    return title ? `${title}（PR #${merge[1]}）` : subject;
  }
  return subject;
}

// 內容後面附上這個 commit 對應的規格書版本（spec-sync.json），兩邊可以互相查
export function withSpecVersion(description, specVersion) {
  return specVersion ? `${description}（規格書 v${specVersion}）` : description;
}

export function readCommit(ref = 'HEAD') {
  // 舊的 commit 沒有 spec-sync.json，git show 會失敗：不印錯誤訊息，內容就不附版本號
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const [sha, date, subject] = git('log', '-1', '--format=%H%n%cI%n%s', ref).split('\n');
  const body = git('log', '-1', '--format=%b', ref);
  let specVersion = '';
  try {
    specVersion = String(JSON.parse(git('show', `${ref}:spec-sync.json`)).spec_version || '');
  } catch {
    specVersion = '';
  }
  return {
    shortSha: sha.slice(0, 7),
    values: [formatTime(date), sha.slice(0, 7), withSpecVersion(describeCommit(subject, body), specVersion)],
  };
}

/* ---------------- Google 服務帳號登入與 Docs API ---------------- */

const b64url = (data) => Buffer.from(data).toString('base64url');

// 服務帳號換 access token 用的 JWT（RS256），只能寫 Google 文件
export function buildAssertion(key, now = Math.floor(Date.now() / 1000)) {
  const claims = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/documents',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 600,
  };
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}`;
  return `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url')}`;
}

async function accessToken(serviceAccount) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildAssertion(JSON.parse(serviceAccount)),
    }),
  });
  if (!res.ok) throw new Error(`Google 登入失敗（${res.status}）：${await res.text()}`);
  return (await res.json()).access_token;
}

async function docsCall(token, path, init = {}) {
  const res = await fetch(`${DOCS_API}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Docs API ${res.status}：${await res.text()}`);
  return res.json();
}

// 每次寫入都帶上剛讀到的 revisionId：文件在中間被別人改過就整批拒絕，不會寫到錯的位置
async function batchUpdate(token, docId, revisionId, requests) {
  return docsCall(token, `${docId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests, writeControl: { requiredRevisionId: revisionId } }),
  });
}

export async function appendVersionRow({ serviceAccount, docId, commit }) {
  const token = await accessToken(serviceAccount);
  let doc = await docsCall(token, docId);
  let table = findVersionTable(doc);
  if (!table) throw new Error('文件裡找不到表頭是「時間｜Commit｜內容」的版本紀錄表');
  if (hasCommit(table, commit.shortSha)) return { added: false, reason: `${commit.shortSha} 已經在版本紀錄裡` };

  await batchUpdate(token, docId, doc.revisionId, [insertRowRequest(table)]);
  doc = await docsCall(token, docId);
  table = findVersionTable(doc);
  await batchUpdate(token, docId, doc.revisionId, fillRowRequests(table, commit.values));
  return { added: true };
}

/* ---------------- 執行 ---------------- */

async function main() {
  const commit = readCommit(process.env.GITHUB_SHA || 'HEAD');
  if (process.argv.includes('--dry-run')) {
    console.log('要加進版本紀錄的一列：', commit.values.join('｜'));
    return;
  }
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;
  const docId = process.env.SPEC_DOC_ID;
  if (!serviceAccount || !docId) {
    console.log('沒有設定 GOOGLE_SERVICE_ACCOUNT 或 SPEC_DOC_ID，略過規格書版本紀錄。');
    return;
  }
  const result = await appendVersionRow({ serviceAccount, docId, commit });
  console.log(result.added ? `已在規格書版本紀錄加上：${commit.values.join('｜')}` : `略過：${result.reason}`);
}

// 被測試 import 時不執行，只有直接用 node 跑這個檔案才執行
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
