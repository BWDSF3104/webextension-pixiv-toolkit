# MV3 の eval 禁止で js-epub-maker（epub 生成）が動かない

**Date**: 2026-11-10

## 症状
Novel の epub 生成機能が動作しない。

## 原因
`src/statics/lib/js-epub-maker` は `handlebars` に依存し、handlebars は `eval` / `Function` を使う。Manifest V3 では拡張ページでこれらが使えない。

## 影響
epub 生成は現状不可。上流 readme の 6.0.0 breaking change #3 と同じ状態。

## 修正方針
上流が eval 不要の生成ライブラリを準備する予定とされている。フォーク側で先行実装する場合は `docs/ai/decisions/` に判断を記録してから着手。

## Status
保留（上流待ち）
