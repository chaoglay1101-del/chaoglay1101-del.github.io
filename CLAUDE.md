# Yu-Chen Chao 個人網站

這個 repo 就是 https://chaoglay1101-del.github.io/ ：GitHub Pages 直接發布 main，合併就上線。網站怎麼運作寫在 `README.md`；網站現在是怎樣、為什麼這樣做，寫在 Google 雲端硬碟的「Yu-Chen Chao 個人網站規格書」。這裡只放代理人必須遵守的規則。其他代理人（Codex、Gemini 等）讀 `AGENTS.md`，內容相同並附回報前的檢查清單；改規則時兩份一起改。

TechStarterWeb 工作室的 repo（Company-web、personal-site-template）和它們的 SOP 跟這個網站無關，不在這裡改。

## 改頁面或程式碼時，規格書要一起更新

只要這次的任務改了頁面、腳本、樣式、workflow 或 GitHub Pages 設定，在同一個任務裡、提交之前，照 `.claude/skills/sync-spec/SKILL.md` 更新規格書，不要留到之後。

- 規格書有改：同一個 PR 把 `spec-sync.json` 的 `spec_version` 改成規格書的新版本號。規格書不受影響時（例如只改一句文案）`spec-sync.json` 不用動，在 PR 說明（或 commit 訊息）寫一行「規格書不受影響：原因」。這次改了什麼寫在 PR 說明，不要寫進 `spec-sync.json`：每個 PR 都改同一行，同時開著的 PR 會互相衝突。Site checks 的 spec-sync 沒過就不能合併。
- 第 10 節的版本紀錄由 GitHub Action 自動加（`.github/workflows/spec-version-log.yml`，內容後面附「（規格書 v版本號）」），代理人只改內文。Action 還沒設定金鑰時，才由代理人手動加那一列。
- 人工直接改了網站之後，在 Claude Code 裡執行 `/sync-spec`，讓代理人補上內文。

## 多 AI 協作（2026-11-24 起）

分工照本人 agent-hub 的原則：**一個大腦，兩個不同公司的審查者**。Claude（本人的互動對話）整合意見、寫結論；Codex、Gemini 被找來討論時只提意見、不改檔；本人拍板。

- **什麼時候交討**：改版方向、頁面架構、對外定位這類會寫進規格書、不容易改回來的決定，開工前先交討。改錯字、調樣式、補檢查這類小事照常做，附來源連結就好。自我迭代執行器的卡不交討。
- **怎麼做**：照 agent-hub 的 `docs/evidence-debate-method.md`。先做證據包（每條編號 [E1]…、附出處、標等級，正反都找），再用 agent-hub 的 `scripts/ask-ai.mjs both --repo <這個 repo>` 把題目和證據包同時交給兩邊（唯讀）。結論分「已查證」和「推論」；題目裡寫了本人的立場時，提醒錨定風險。
- **存哪裡**：agent-hub 的 `docs/debates/<日期>-<主題>/`。這個 repo 公開，討論紀錄不放這裡。
- **合併前審查**：PR 由 agent-hub 自動請 Codex、Gemini 審查，結果在本人的彙報裡；只是意見，不擋合併。

## 開發

- 提交前跑 README「Validation」列的檢查，以及 `node --test "tools/tests/*.test.js"`。
- 不要直接推到 main：開分支、開 PR，Site checks（checks、spec-sync）通過才合併。`.claude/settings.json` 的 hook 會擋下推到 main 的 `git push`；其他情況直接推 main 時，`.github/workflows/direct-push-alert.yml` 會開 issue 提醒（Build CV PDFs 的機器人提交除外）。
- repo 裡每個檔案都公開。不放繳交文件、成績單、資料檔、工作筆記或金鑰；新的 Markdown 檔要加進 `tools/_check_public.py` 的 `MD_ALLOWED`。
- README 的內容規則（能力寫成價值、每個數字有來源、每個事實只放一處）和翻譯流程一律照做。
