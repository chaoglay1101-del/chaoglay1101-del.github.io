# Yu-Chen Chao 個人網站

這個 repo 就是 https://chaoglay1101-del.github.io/ ：GitHub Pages 直接發布 main，合併就上線。網站怎麼運作寫在 `README.md`；網站現在是怎樣、為什麼這樣做，寫在 Google 雲端硬碟的「Yu-Chen Chao 個人網站規格書」。這裡只放代理人必須遵守的規則。其他代理人（Codex、Gemini 等）讀 `AGENTS.md`，內容相同並附回報前的檢查清單；改規則時兩份一起改。

TechStarterWeb 工作室的 repo（Company-web、personal-site-template）和它們的 SOP 跟這個網站無關，不在這裡改。

## 改頁面或程式碼時，規格書要一起更新

只要這次的任務改了頁面、腳本、樣式、workflow 或 GitHub Pages 設定，在同一個任務裡、提交之前，照 `.claude/skills/sync-spec/SKILL.md` 更新規格書，不要留到之後。

- 同一個 PR 要更新 `spec-sync.json`：`spec_version` 改成規格書的新版本號；規格書不受影響時（例如只改一句文案）版本不變，`last_change` 以「規格書不受影響：」開頭寫原因。Site checks 的 spec-sync 沒過就不能合併。
- 第 10 節的版本紀錄由 GitHub Action 自動加（`.github/workflows/spec-version-log.yml`，內容後面附「（規格書 v版本號）」），代理人只改內文。Action 還沒設定金鑰時，才由代理人手動加那一列。
- 人工直接改了網站之後，在 Claude Code 裡執行 `/sync-spec`，讓代理人補上內文。

## 開發

- 提交前跑 README「Validation」列的檢查，以及 `node --test "tools/tests/*.test.js"`。
- 不要直接推到 main：開分支、開 PR，Site checks（checks、spec-sync）通過才合併。`.claude/settings.json` 的 hook 會擋下推到 main 的 `git push`；其他情況直接推 main 時，`.github/workflows/direct-push-alert.yml` 會開 issue 提醒（Build CV PDFs 的機器人提交除外）。
- repo 裡每個檔案都公開。不放繳交文件、成績單、資料檔、工作筆記或金鑰；新的 Markdown 檔要加進 `tools/_check_public.py` 的 `MD_ALLOWED`。
- README 的內容規則（能力寫成價值、每個數字有來源、每個事實只放一處）和翻譯流程一律照做。
