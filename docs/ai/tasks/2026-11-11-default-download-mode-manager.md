# 既定モードをダウンロードマネージャ（downloadMode=2）へ

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: default.js:256 を 2へ→yarn test/build→新インストール相当でA/Bボタン表示確認→decision記録

## 意図 / 背景

A/B 分割ボタン（ボタン分割項目の実装）は `App.vue`＝`downloadMode === 2` のときだけ描画され、既定（1=レガ）では他 PC で設定変更なしに使えない。作り込んだ機能を即使えるよう、既定を 2（ダウンロードマネージャ）へ変更する。

## 調査結果 / 変更内容

- 変更: `src/config/default.js:256` `downloadMode: 1` → `2`（1行）。新ロジックなし（描画条件 `UIApplication.js:83` は既存）。
- 効果範囲: 新インストール／新規プロファイルのみ。既存プロファイルは保存値が残る（`Updater.mergeSettings` は未定義キーのみ既定値で埋める `src/modules/Util/Updater.js:14-23`）。
- options page のフォールバック `|| 1`（`DownloadOptions.vue:196`、`DownloadMode.vue:56`）は merge 後 undefined で発火しないため変更しない。
- decision: `docs/ai/decisions/2026-11-11-default-download-mode-manager.md`

## Verification

- `yarn test`（2026-11-11）: 2 suites / 11 tests passed（Time 3.987s。既存 spec。既定値変更の new spec は不要＝分岐なし）。
- `yarn build`（chrome, 2026-11-11）: 成功 exit=0（webpack 4.46.0、既存の asset size 警告のみ）。
- 未確認: 新インストール相当の画面確認（A/B ボタン描画）は未実施（ブラウザ未起動）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
