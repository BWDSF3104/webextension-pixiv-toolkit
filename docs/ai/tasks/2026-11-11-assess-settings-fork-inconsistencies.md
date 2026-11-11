# assess実行グループ: fork設定画面の不整合4項目

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: 終了3/4（1・2・3合格）。執行順 4→5→6: 項目4（文言決定済・委譲実施へ）、項目5（作品画面確認・確認専用）、項目6（手順書 docs/help-fork.md）

## 意図 / 背景

ユーザーassess（2026-11-11 06:04）で、直前回答で検出したfork設定画面の不整合4項目の実装・検証を執行グループとして登録。優先順位: 項目1（ominaトグル）→項目3（フォールバック）→項目2（注記）→項目4（記録訂正+label/type）。

## 調査結果 / 変更内容

実行固有ID: `assess-settings-fork-inconsistencies`。基線: HEAD `576463f`、working tree clean（untracked `scratch/` のみ）。

共通コンテキスト要約（1回作成・各委譲で再利用）:
- 正典: global `C:\Users\fujim\.config\kilo\AGENTS.md`（回答日本語・commit prefix英語+説明日本語・1コマンド1行・インラインコード実行禁止→スクラッチ `docs/ai/tmp/`・`kilo-safe-remove`/`kilo-recycle-external`・`task_manager`（PATH）・commit前検証しタスクVerificationへ記録）
- プロジェクト `S:\Documents\Kilo_Commons\webextension-pixiv-toolkit\AGENTS.md`: `yarn test`（jest）、`yarn build`（chrome）、Node >=16.18、ロケール en/zh_CN 両方、fork変更は最小
- Playwright確認ルール: `S:\Documents\Kilo_Commons\Common_Operations\docs\ai\rules\playwright-confirmation-rule.md`（画面確認は chrome-devtools MCP へ読み替え、ユーザー指示 2026-11-10、Drive保存先 `I:\マイドライブ\kilo\`）
- ブラウザ残存識別条件（実確認済み）: コマンドラインに `C:\Users\fujim\.cache\chrome-devtools-mcp\chrome-profile` を含む chrome.exe（MCPサーバー本体の cmd/node は除く）。終了対象はこれに一致するブラウザ本体とMCPで開いたpageのみ（最後に開いているpageはclose不可のMCP制限）
- decision: `2026-11-10-ui-label-distinction-and-pixiv-omina-hidden.md`（Omina非表示）、`2026-11-10-button-group-colors.md`（3色・適用確定分のみ）、`2026-11-11-default-download-mode-manager.md`（既定2）、`2026-11-10-download-button-split-design.md`（click単位override）
- Git: 項目分単独コミット+push自己判断可。scratchはコミットしない。秘密コミット禁止

項目一覧（個別タスク）:
- 1 `2026-11-11-fix-omina-toggle-removal.md`（トグル削除）
- 2 `2026-11-11-settings-override-note.md`（3設定のdesc注記）
- 3 `2026-11-11-align-download-mode-fallback.md`（フォールバック4箇所）
- 4 `2026-11-11-legacy-label-record-and-apply.md`（監査記録訂正+fork label/type適用）

## Verification

（記入）

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
