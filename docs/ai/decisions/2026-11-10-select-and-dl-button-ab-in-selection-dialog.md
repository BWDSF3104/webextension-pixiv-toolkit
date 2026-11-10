# Select & DL の選択画面にボタンA/B

**Date**: 2026-11-10
**Status**: 確定（ユーザー指示）

## 決定

- 選択画面（`PageSelector` の dialog）footer の `Download`（zip＝設定追従）button を廃止し、ボタンA/Bの2パターンをdialog内に置く。
  - A: フォルダ展開（work folder 内ファイル単位）→ `saveMode: 'folder'`
  - B: 画像別保存（ダウンロード直下ファイル単位）→ `saveMode: 'perImage'`
- ラベルは既存ロケール key `_download_to_folder` / `_download_per_image` を流用（新規文言なし。en / zh_CN 追加不要）。（2026-11-10 ユーザー承認: 文字「A/B」ではなく既存文言）
- 選択反映は既存の `selectedPageIndexes` をそのまま使う。`saveMode` を dialog の download payload に追加するだけ。
- `PageSelector` は `App.vue` と `AppLegacy.vue` で共有なので、両 `pageSelectorDownloadHandler` が `saveMode` を受け取る。
  - `App.vue` は `getDownloadArgs` の options へ（既存）。
  - `AppLegacy.vue` は `download()` → `ContentPageDownloadManager.addTask(resource, options)` の options へ透過（addTask は options を丸ごと adapter へ渡すため配線追加なし）。
- Ugoira は换算ボタン別（単一換算ファイル生成）なので saveMode 効果なし＝スコープ外（既存決定維持）。

## Pixiv Omina（変更なし・確認）

- 非表示。既存決定 `2026-11-10-ui-label-distinction-and-pixiv-omina-hidden.md` を維持: `App.vue` / `AppLegacy.vue` の button 表示ブロック削除、`src/config/default.js:203` の `showPixivOmina` を false。

## 実装範囲（最小）

- `src/content_scripts/components/PageSelector.vue:31` footer の1 button → 2 button、`downloadSelectedPages(saveMode)` の emit に `saveMode` 追加
- `src/content_scripts/components/App.vue:425`（handler が `saveMode` を受ける）＋ Pixiv Omina ブロック削除（`:46-49`、dead になる `passToPixivOmina` `:435`、`.ptk__pixiv-omina__btn` style）
- `src/content_scripts/components/AppLegacy.vue:384`（handler）＋ `download()` の `saveMode` 透過（`:366-368`）＋ Pixiv Omina ブロック削除（`:37-40`、`:394`）
- `src/config/default.js:203` → `false`
- 検証: `yarn test` / `yarn build`（saveMode override 判定の spec は既存 `test/MultiplePagesDownloadTask.spec.js` がカバー。dialog は引数受け渡しのみで新規分岐なし）
