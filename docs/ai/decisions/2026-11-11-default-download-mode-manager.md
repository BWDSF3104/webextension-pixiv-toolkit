# 既定 downloadMode を 2（ダウンロードマネージャ）へ

**Date**: 2026-11-11
**Status**: 確定（ユーザー指示「作り込んだ機能が即使えるように変更して」）

## 決定

- `src/config/default.js:256` の `downloadMode` を 1 → 2（fork 既定）。
- 効果は新インストール／新規プロファイルのみ。既存プロファイルは保存済みの値が残る（`Updater.mergeSettings` は未定義キーだけ既定値で埋める: `src/modules/Util/Updater.js:14-23`）。
- A/B 分割ボタンは `App.vue` のみ描画（`UIApplication.js:83`）。既定を 2 にすることで他 PC で設定変更なし即使用。

## 補足

- options page のフォールバック `|| 1`（`DownloadOptions.vue:196`、`DownloadMode.vue:56`）は merge 後に発火しない（undefined のみ）ため変更しない。
- 既定 `downloadSaveMode: 0`（zip）はそのまま。A/B はクリック単位の override（既存決定 `2026-11-10-download-button-split-design.md`）。

supersedes: なし（既定モードに関する既存決定はない。2026-11-10 監査の「確認のため downloadMode=2 へ一時変更」は実装詳細で決定ではない）。
