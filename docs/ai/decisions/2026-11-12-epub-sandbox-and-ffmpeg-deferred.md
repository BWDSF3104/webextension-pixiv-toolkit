# 2026-11-12 EPUB 生成は sandbox ページ隔離、ffmpeg MP4 はブロック確定で見送り

## 背景

MV3 改修タスク（`2026-11-12-mv3-remediation`）。方針3（GIF worker 同封化）、方針4（EPUB）、監査項目8（MP4 ffmpeg）についてユーザーが「使う → 修正」を選択（2026-11-12）。

## 決定

### EPUB（方針4）: sandbox ページへ隔離 ✅ 実測成功

- manifest `"sandbox": {"pages": ["sandbox/epub.html"]}`。sandbox ページは CSP 免除で `new Function` が使える（実測: `unsafeEval: allowed`）。
- js-epub-maker + handlebars + jszip + jszip-utils を sandbox 側で読み込み、`postMessage` で book 定義（uuid/author/cover dataURL/title/sections）を受け取り、`makeEpub()` の blob.arrayBuffer を返す。
- 表紙は download manager 本体側で fetch して dataURL 化して渡す（sandbox からの CORS/Referer を回避）。
- **上流の既存バグ発見**: `NovelDownloadTask.makeEpubBook` が呼んでいた `downloadEpub()` はブラウザダウンロードを発火し `undefined` を返す API で、`makeEpub()` が正しい。EPUB は CSP 以前にこの呼び出し誤りで壊れていた。修正済み（sandbox 側 bridge で `makeEpub()` を使用）。

### GIF（方針3）: 同封 worker 化 ✅ 実測成功（extension page）

- gif.js 0.1.6 は `workerScript` に渡した URL へ `new Worker(url)` するだけなので、blob 生成の `GifGeneratorWorker.js` を削除し、`src/statics/lib/gifjs/gif.worker.js`（gif.js@0.1.6 dist と同一物）へ `browser.runtime.getURL()` を渡す形に変更。WAR に登録。
- 実測: extension page から `new Worker(getURL('lib/gifjs/gif.worker.js'))` が起動し応答を返す。content script isolated world からの同一経路は MCP 評価制約で未実測（記録）。

### ffmpeg MP4（監査項目8）: 「core 同封」では直せないことが確定し、今回合流せず ❌

- ユーザー選択は「@ffmpeg/core 同封して修正」だったが、調査で `@ffmpeg/core@0.11.0` は pthread ビルド（SharedArrayBuffer 必須）であり、MV3 拡張ページは cross-origin isolated になれないため起動不可。加えて 0.11.6 のローダーは core/worker を blob 経由で読むため CSP でもブロックされる。
- 詳細は issue `KI-20261112-01-ffmpeg-wasm-mv3-pthread-blob-blocked.md`。修正には 0.12.x 系への自作 worker ブリッジ移行（中規模 + ugoira 実機検証）が必要で、別途タスク化する。webm/APNG は影響なし。

## Supersede する決定

なし（監査タスクの改修方針1-6 のうち 3/4 を実装、項目8 は新規 issue に引き継ぎ）。
