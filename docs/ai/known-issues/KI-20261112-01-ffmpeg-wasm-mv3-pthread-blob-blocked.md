# ugoira MP4 変換が ffmpeg.wasm 0.11.x の pthread/blob で MV3 拡張ページで動かない

**Date**: 2026-11-12

## 症状

download manager（options page）からの ugoira MP4 変換（`UgoiraDownloadTask.runFFmpeg`）が `ffmpeg.load()` で失敗する。拡張ファイルの `ffmpeg-core.js` が元々未同封だった（11-10 監査 項目8）。

## 原因（2026-11-12 確定・コード読み）

同封だけでは直らない。`@ffmpeg/ffmpeg@0.11.6` + `@ffmpeg/core@0.11.0`（package.json 依存）の構成が MV3 と二重に非互換:

1. **core が pthread ビルド** — `@ffmpeg/core@0.11.0` の dist に `SharedArrayBuffer`/`registerPthreadPtr` が含まれる（pthread worker が共有メモリにスタックを置く）。MV3 拡張ページは COOP/COEP ヘッダーを設定できず cross-origin isolated でないため `SharedArrayBuffer` が使えず、pthread worker が起動しない。
2. **ローダーが blob 経由** — 0.11.6 の `getCreateFFmpegCore` は core.js/wasm/worker を fetch して blob URL にし、`importScripts(blob)` と `locateFile→blob worker` で読む。MV3 拡張ページの CSP（`script-src 'self' 'wasm-unsafe-eval'`）は `blob:` を許さない。

## 影響

MP4 変換のみ不可。webm（whammy・worker 不要）と APNG はこの経路を使わない。

## 修正に必要なこと（判断: 今回合流せず・別枠）

0.12.x 系（単一スレッド core、SAB 不要）への移行が必要。ただし 0.12.10 UMD は blob worker、ESM は `import.meta.url` で webpack 4 が未対応のため、**自作 worker ブリッジ（同封 worker から `importScripts('ffmpeg-core.js')` + `locateFile` で拡張 URL）**か別ページ隔離が必要になる。中規模改修 + ugoira 実機検証（ログイン環境）が前提。
