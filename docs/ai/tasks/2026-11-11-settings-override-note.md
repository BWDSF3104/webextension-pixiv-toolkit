# 設定画面にA/Bクリックoverrideの注記追加

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: A/Bボタンで上書きされる3設定（downloadSaveMode/dontCreateWorkFolder/globalZipMultipleImages）のdesc注記1行をen/zh_CN追加→画面確認→コミット

## 意図 / 背景

forkのA/Bボタン（click単位override、decision 2026-11-10-download-button-split-design）は既定モードでA/Bクリックが常に `saveMode` を固定するため、設定の `downloadSaveMode`・`dontCreateWorkFolder`・`globalZipMultipleImages` はA/B使用経路では効かない（設定追従はlegacyのDownload等のみ）。設定UIがこの上書き関係を示さず誤解を招く。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目2（優先2）
承認範囲: 3設定のdesc注記1文を en/zh_CN ロケールへ追加（新規文言は両ロケール）＋既存desc表示机制での表示。挙動変更・項目非表示化は承認範囲外（非推奨）。

## Verification

- `yarn test` / `yarn build` 通過。
- 画面確認: 設定画面（Download設定）に注記が表示されること（en）。before/after を `I:\マイドライブ\kilo\2026-11-11-settings-override-note\` へ保存（playwright-confirmation-rule、chrome-devtools MCP、残存識別条件は要約参照）。項目終了時にpage閉じる。
- 画面確認不可なら未検証扱い（合格しない）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
