# 監査記録の訂正とlegacy label/type適用（記録とコード不一致）

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: task file記録訂正→fork label key en/zh_CN追加とAppLegacy Downloadへtype=download適用→yarn test/build→画面確認→コミット

## 意図 / 背景

監査項目（2026-11-10-mv3-chrome-basic-function-audit）の実施報告は「fork label実装（`fork_legacy_download_label`/`fork_ugoira_zip_label`、`type="download"`）合格」とするが、実コードにlabel keyも型適用も存在しない（記録とコードの不一致）。実コードを確認した結果: `AppLegacy.vue:14-24` は `tl('_download')` のまま・型なし＝既定青、`_locales/en/messages.json` 最終コミットは 17c0f1c（button分割keyのみ）。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目4（優先4）
承認範囲: `docs/ai/tasks/2026-11-10-mv3-chrome-basic-function-audit.md` の記録訂正、en/zh_CN ロケールへの fork label key追加、`AppLegacy.vue` の `Download` buttonへ `type="download"`＋label適用。button表示のみ。

## Verification

- 記録訂正: 実施報告の該当記述を「記録と実コード不一致（実施なし）。訂正＝label key追加と型適用を実施」へ更新。
- `yarn test` / `yarn build` 通過。
- 画面確認: legacy mode（`downloadMode=1`、確認用にテストプロファイルで設定し確認後復元）。before/afterを `I:\マイドライブ\kilo\2026-11-11-legacy-label-record-and-apply\` へ保存（playwright-confirmation-rule、chrome-devtools MCP、残存識別条件は要約参照）。項目終了時にpage閉じる。
- 画面確認不可なら未検証扱い（合格しない）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
