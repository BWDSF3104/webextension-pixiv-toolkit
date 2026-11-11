# レガシーモード廃止（常時A/B 2 button表示）

**Date**: 2026-11-11
**Status**: 確定（ユーザー裁定2026-11-11 08:16「レガシーモードはいらない。ややこしいだけ」）

## 決定

- legacy mode（`AppLegacy.vue`）を廃止。content UIは常時 `App`（A/B 2 button）を描画する。設定からのモード選択も削除（「いかなる設定でも2つのdownload mode表示が正常」＝「直すなら設定の方」の裁定）。
- 削除範囲: `AppLegacy.vue`、`DownloadMode.vue`、`DownloadOptions.vue` のdownload mode tile、`fork_legacy_download_label`/`fork_ugoira_zip_label`（en/zh_CN/ja）、`default.js` の `downloadMode` key。`UIApplication.js` のrender条件は常時Appへ。
- `Application.js` の storage.onChanged（downloadMode比較）は設定UI消失で発火不能のため変更しない（デッドだが無害）。

## supersedes

- `2026-11-11-default-download-mode-manager.md`（既定モードという概念自体が消滅。既存プロファイルの保存値も次回mergeで削除）
- `2026-11-11-fork-label-wording.md` の legacy label部分（key削除。`fork_ugoira_zip_label` も適用先消失で削除）
- `2026-11-10-select-and-dl-button-ab-in-selection-dialog.md` の AppLegacy配線部分（ファイル削除で消滅。dialog footer 2行契約は `App.vue` 側で維持）
- `2026-11-10-button-group-colors.md` のlegacy未確認部分（不要化）
- `2026-11-10-ui-label-distinction-and-pixiv-omina-hidden.md` のLegacy label部分（legacy mode廃止でLegacy label表示は無効化。P* label部分は有効のまま）

項目4の fork label実装（e7e7139）は本決定で取り消し（key削除）。項目4は記録訂正・実測事実として保持し、タスクは再開しない。
