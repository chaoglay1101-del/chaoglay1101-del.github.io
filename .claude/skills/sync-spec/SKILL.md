---
name: sync-spec
description: 把個人網站（chaoglay1101-del.github.io）的變更同步到 Google 雲端硬碟的「Yu-Chen Chao 個人網站規格書」。改完頁面或程式碼、提交之前使用；人工改完網站之後執行 /sync-spec 補上內文。
---

# 同步規格書

目標：規格書寫的內容和 main 上的網站一致。只改受影響的段落，在原檔案上改（連結不變），不要另開新文件，也不要整份重寫。

規格書：「Yu-Chen Chao 個人網站規格書」，Drive 檔案 ID `1ce9FORW4DWedktQm4Ji3p0cj_p5S_W-CAEd0Fv3Y1bY`。

## 步驟

1. **找出要同步的變更。** 用 Drive 讀規格書（`read_file_content`，`includeComments: true`），看第 10 節版本紀錄最後一列的 commit。用 `git log --oneline <那個 commit>..origin/main` 和 `git diff --stat` 列出之後的變更；這次任務還沒提交的改動也算。
2. **對照下表決定要改哪幾節。** 每一節只寫「現在是怎樣、怎麼做、怎樣算完成」，不要寫成開發日記。細節留在 README，規格書寫重點並指向 README 的章節。
3. **改文件。**
   - 有 Google Docs 連接器（`read_doc`／`update_doc`）時用它：先讀拿到 `revisionId`，每批寫入帶 `writeControl.requiredRevisionId`。
   - 沒有時，用瀏覽器打開文件，以「尋找及取代」（Ctrl+H）改文字：先確認「共 1 個」才按「全部取代」。要加新段落時，用「下一個」選到前一段的結尾，關掉對話框，按 End 再按 Enter 輸入。表格加列：點到最後一列最後一格的文字結尾，按 End 再按 Tab，會新增一列。
   - 版本號與日期（文件第二行「版本 x.y｜日期」）有改內文時加 0.1。
4. **第 10 節版本紀錄。** 由 GitHub Action 在推到 main 後自動加，內容後面附「（規格書 v版本號）」。只有在 Action 沒設定金鑰（README「Version management」）時，才手動加一列：時間（UTC+8，`10/24 20:58`）｜commit 短碼｜內容（規格書 v版本號）。
5. **驗證。** 再用 Drive `read_file_content` 讀一次，確認每一處都改到、沒有改錯地方。
6. **更新 `spec-sync.json`（和改動同一個 PR）。** `spec_version` 改成規格書第二行的新版本號，`last_change` 寫一句這次改了什麼。規格書不受影響時版本不變，`last_change` 以「規格書不受影響：」開頭寫原因。Site checks 的 spec-sync 會擋下沒更新的 PR。
7. **回報。** 用繁體中文列出改了哪幾節，附文件連結；沒改的也說明原因。

## 改動 → 規格書章節

| 改到的地方 | 規格書 |
|---|---|
| 讀者、頁面順序、導覽選單 | 1 |
| 新增或刪除頁面、`assets/` 的結構 | 2 |
| 文案規則（README「Content conventions」） | 3 |
| `assets/js/i18n.js`、`main.js` 的語言切換、翻譯腳本 | 4 |
| `story.js`、`flow.js`、`motion.css`、`cv-onepage.html`、`cv-print.css`、`cv-pdfs.yml`、外部連結 | 5 |
| `tools/_check_*.py`、`_verify_html.py`、`checks.yml` | 6 |
| `robots.txt`、`sitemap.xml`、`404.html`、分享卡、Pages 設定 | 7 |
| `CLAUDE.md`、`AGENTS.md`、hook、spec-sync、版本紀錄、直接推 main 提醒 | 8 |
| 做完待辦或發現新待辦 | 9 |

只改一句文案、修錯字、換 PDF 時，規格書通常不受影響：`spec-sync.json` 寫「規格書不受影響：原因」即可。

## 不要做的事

- 不刪除、不移到垃圾桶任何 Drive 檔案；不另存副本當成更新。
- 不把成績單、證件、金鑰或任何個資寫進規格書。
- 不確定某段該怎麼寫時，先問人，不要猜。
