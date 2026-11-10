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
