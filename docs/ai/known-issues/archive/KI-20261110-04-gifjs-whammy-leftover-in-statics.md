# 上流 readme で削除扱いの gif.js / whammy が statics/lib に残っている

**Date**: 2026-11-10

## 症状
上流 readme の 6.0.0 breaking change #2 は「gif.js と whammy を削除、アニメ生成は ffmpeg.wasm」と説明。`src/statics/lib/` に `gifjs` と `whammy.js` が残存。

## 原因
上流のライブラリ削除が `src/statics/lib` 側で完全には取り除かれていない。

## 影響
拡張パッケージサイズが増える。アニメ生成経路がどちらなのか読み手が判断できない。

## 修正方針
実際に参照されているかを grep で確認してから、未参照なら削除（`kilo-safe-remove`）、参照されていれば architecture.md の記述を実コードへ合わせる。

## Status
調査中

**Resolved**: 2026-11-10（調査）— 未参照ではない。`src/statics/manifest.json` の content_scripts `js` に `lib/gifjs/gif.js`・`lib/whammy.js` が登録され、`src/content_scripts/modules/Legacy/UgoiraGenerator/GifGenerator.js:77`（`new GIF`）と `WebmGenerator.js:81`（`new Whammy.Video()`）から参照されている。上流 readme の「削除」記述が古い。削除は不要なので `docs/ai/architecture.md` を実コードへ合わせた。上記「原因」は誤り（単なる残存ではなく、Legacy 経路が現に参照している）。
