# アーキテクチャ

## System Overview

Manifest V3 の Chrome/Firefox 拡張。ダウンロード処理は content script ではなく独立した options page（ダウンロードマネージャ）で実行する（上流 v6.0.0 の breaking change）。content script はページ解析結果をポート経由でマネージャへ送る。

## Components

### content_scripts
- **Purpose**: pixiv / comic / fanbox ページに注入し、操作パネルと解析を実行
- **Location**: `src/content_scripts/`（components / modules / styles）
- **Dependencies**: `src/modules/Parser`, `src/modules/PageResource`

### background (service worker)
- **Purpose**: 拡張イベント処理・更新・サービス
- **Location**: `src/background/`（modules / services / updates）

### options page（ダウンロードマネージャ）
- **Purpose**: ダウンロード・履歴・設定の UI。Vue 3 + router
- **Location**: `src/options_page/`（components / router / services / mixins）

### core / modules
- **Purpose**: ブラウザ API 差異の吸収（`src/core/browser`）、共通機能（Db・Net・Ports・Workers・Manager・Util）
- **Dependencies**: `dexie`（IndexedDB）、`ffmpeg.wasm`（アニメ生成）、`jszip`

## Data Flow

1. content script がページを解析しリソース情報を取得
2. Ports 経由で options page のマネージャへ送信
3. Manager が Net で取得・変換（ffmpeg.wasm）し、浏览器 download API で保存
4. 履歴は Db（dexie）へ記録

## Technical Decisions

- Manifest V3 制約により `eval` / `Function` を使えない → `handlebars` 依存の `js-epub-maker` は現状動作不可（上流 readme の break change）
- ビルドは webpack 4 + Babel。platform ごとに `config/webpack.*.config.js` を分割し `PLATFORM_ENV` で切り替える
- 上流フォークとして、上流 `main` を upstream remote から取り込み、フォーク固有変更は `src/modules/` 単位で最小限に閉じる
