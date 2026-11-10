# UI label表示とPixiv Omina非表示

**Date**: 2026-11-10
**Status**: 確定

## 決定

- ラベルは action buttonではなく、labelとして見た目上区別する。
  - `P*` guide labelと `Legacy` labelは、buttonと同じ見た目のままにしない。
  - `Download` と panel handler は buttonとして扱う。
- `Pixiv Omina` は不要。拡張UIから非表示にする。

## 実装方針

- `src/content_scripts/components/Button.vue` に label用の見た目を追加する。
- `src/content_scripts/components/ControlPanel.vue` の guide `P*` を label表示にする。
- `src/content_scripts/components/AppLegacy.vue` の `Legacy` labelを button見た目を外して label表示にする。
- `src/content_scripts/components/AppLegacy.vue` と `src/content_scripts/components/App.vue` の `Pixiv Omina` button表示ブロックを削除する。
- `BrowserItemService.js` の `showPixivOmina` はデフォルト false にする。既存設定で true が残ってもUIは非表示にするため、UIブロック削除を正とする。

## 注意

- `Legacy` labelは `@click` handlerを持たない。label表示にすると、見た目の button機能がないことが明確になる。
- `P*` guide labelも本来 action wiredではない。panel open/closeは handler側が担う。
