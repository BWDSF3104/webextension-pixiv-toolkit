# 選択画面 button の group 別色

**Date**: 2026-11-10
**Status**: 確定（ユーザー承認: コントラスト重視）

## 色（白文字）

- 選択系 `#0b74c4`（4.5:1）
- ダウンロード系 `#0a7d46`（4.9:1）
- クローズ `#5b6b78`（4.8:1）

## 適用範囲（確定分）

- 選択画面 dialog footer: 選択系3（Select All / Unselect All / Select Invert）、download2（DL to folder / DL per image）、close1
- A1: `App.vue` panel の download button（`DL to folder` / `DL per image`）→ ダウンロード系
- `Select & DL`（dialog を開く button, `PageSelector.vue:40`）は選択系 action → 選択系色

## 適用外（未確認・現状のまま）

- A2: `AppLegacy.vue:14` の `Download`（legacy 非ugoira）— group はダウンロード系だが適用範囲として未確認
- A3: ugoira 换算 button（`App.vue` apng/gif/webm/mp4/custom、`AppLegacy.vue` gif/apng/webm）— 未確認
- `P*` guide・inline handler（`ControlPanel.vue`）、`Legacy Mode` label — action ではないため適用外

## 実装方法

- `Button.vue` の既存 `type` prop（`button--<type>`）へ `.button--select` / `.button--download` / `.button--close` を追加。新 mechanism なし。
- 完了表示は panel の border（`.ptk__container.success` = `#00dc68`）。download 系の緑と色味が近くなるが、判別は `✔` / progress text。`.button--success` は `type="success"` の使用箇所がなく現状 dead。
- `ptk-button` は content script の4ファイルのみ（options page・popup は Vuetifyなので対象外）。

## 確認（932x871・dpr 2、artwork 151753981）

- 実測 computed background: 選択系 `rgb(11,116,196)`、download `rgb(10,125,70)`、close `rgb(91,107,120)`、`Select & DL` `rgb(11,116,196)`
- before 画像: `fixedbreak-corrected-932x871-20261110.png`（すべて既定青）
- after 画像: `button-colors-after-932x871-20261110.png`
- `yarn test` 11 passed、`yarn build` exit=0
