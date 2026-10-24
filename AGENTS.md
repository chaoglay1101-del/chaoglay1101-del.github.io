# 給所有 AI 代理的規則（Codex、Gemini、Copilot、Claude 等）

這個 repo 就是 Yu-Chen Chao 的個人網站（https://chaoglay1101-del.github.io/），GitHub Pages 直接發布 main。
Claude Code 另外會讀 `CLAUDE.md`；兩份規則相同，以這份的檢查清單為準。

## 一定要做：改完頁面或程式碼，就更新規格書

只要你改了頁面、腳本、樣式、workflow 或 GitHub Pages 設定，**在同一個任務裡**更新 Google 雲端硬碟的「Yu-Chen Chao 個人網站規格書」（`1ce9FORW4DWedktQm4Ji3p0cj_p5S_W-CAEd0Fv3Y1bY`，原檔上改，不要另存新檔）。不要留到之後，也不要只在回報裡說「建議更新規格書」。

### 步驟

1. 讀規格書全文。
2. 找出這次改動影響哪些章節：
   - 讀者、頁面順序、導覽 → 1
   - 新頁面、檔案、assets → 2
   - 文案規則 → 3
   - 翻譯流程、`i18n.js`、`tools/_*i18n*`、`_extract_en.py` → 4
   - 步驟故事、流動紋理、一頁式履歷、履歷 PDF、外部連結 → 5
   - 檢查腳本、`checks.yml` → 6
   - 發布、robots、sitemap、404、分享卡 → 7
   - 版本管理規則 → 8
   - 做完或新增的待辦 → 9
   完整對照表在 `.claude/skills/sync-spec/SKILL.md`。
3. 只改受影響的段落，寫「現在是怎樣、怎麼做、怎樣算完成」。不要整份重寫，不要刪掉無關的內容。
4. 文件第二行的「版本 x.y｜日期」：有改內文就加 0.1，日期改成今天。
5. 第 10 節「版本紀錄」：推到 main 後 GitHub Action 會自動加一列。**如果 GitHub 沒有設定 Secret `GOOGLE_SERVICE_ACCOUNT`（目前還沒設定），由你手動加一列**：時間（UTC+8，例如 `10/24 21:47`）｜commit 短碼｜一句話內容（規格書 v版本號）。同一個 commit 已經在表裡就不要重複加。
6. 改完後重新讀一次全文，確認每一處都改到、沒有改錯地方。
7. 更新 repo 根目錄的 `spec-sync.json`，和改動放在同一個 PR：`spec_version` 改成規格書的新版本號（要比原本大），`last_change` 寫一句這次改了什麼；規格書真的不受影響時版本不變，`last_change` 以「規格書不受影響：」開頭寫原因。不要為了讓檢查通過而只改這個檔案、不改規格書。

### 回報前逐項確認（每一項都要在回報裡寫出結果）

- [ ] 我改了哪些檔案或設定
- [ ] 規格書改了哪幾節（沒改的話寫原因）
- [ ] 版本號已經加 0.1，`spec-sync.json` 的 `spec_version` 和規格書一致
- [ ] 第 10 節版本紀錄有這次的 commit（自動或手動）
- [ ] 改完後有重新讀過規格書確認
- [ ] README「Validation」的檢查和 `node --test "tools/tests/*.test.js"` 都通過

做不到某一項（例如沒有編輯 Google 文件的權限），要在回報裡明確寫「規格書沒有更新」和原因，請人處理。不要假裝已經更新。

## 其他規則

- **不要直接推到 main。** 一律開新分支、推分支、開 PR，等 Site checks（checks、spec-sync）都通過再合併。直接推 main 會自動開 issue 提醒，Claude Code 也會直接擋下。
- repo 裡每個檔案都公開：不放繳交文件、成績單、資料檔、工作筆記、金鑰或個資。
- 照 README 的內容規則寫文案；英文改了，中文同一個 commit 一起改。
- 不刪除 Google 雲端硬碟的檔案；不輸入付款資料、密碼、驗證碼。
- 不確定時先問人，不要猜。回報用繁體中文。
