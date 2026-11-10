# アーキテクチャ

## System Overview

Manifest V3 の Chrome/Firefox 拡張（`package.json` v6.4.2）。ダウンロード処理は content script ではなく独立した options page（ダウンロードマネージャ）で実行する（上流 v6.0.0 の breaking change）。content script は解析結果をポート経由でマネージャへ送る。

## Components

| 要素 | 場所 | 内容 |
|---|---|---|
| content script | `src/content_scripts/`（components / modules / styles） | pixiv・Pixiv Comic・Fanbox への注入と操作パネル。解析は `src/modules/Parser/{Pixiv,PixivComic,Fanbox}` |
| background | `src/background/`（modules / services / updates） | service worker。拡張イベント・更新 |
| options page | `src/options_page/`（components / router / services / mixins） | ダウンロードマネージャ UI。Vue 2.6 + Vuetify 1 + vue-router 3 |
| popup page | `src/popup_page/` | ポップアップ UI。Vue 2 |
| core | `src/core/browser` | chrome / firefox の拡張 API 差異の吸収 |
| modules | `src/modules/` | Browser・Db・Extension・Manager・Net・PageResource・Parser・Ports・Util・Workers。ほかに Event・Queue（`processors` による同時数制御、既定 1）・Logger・GlobalSettings・I18n・Locales・TrackedError・ScheduledTask |

ロケールは `src/statics/_locales/`（en / zh_CN）。

## Storage

- PouchDB（`src/repositories/`: IllustHistory・DownloadRecord・AssetCache）
- Dexie（`src/modules/Db/Repository/`: HistoryRepo・TrackedErrorRepo。`src/statics/lib/dexie` はページ側ロード用）

## Media conversion

- `ffmpeg.wasm`（ugoira 変換。カスタムコマンドの規約は `docs/help.md`）
- `UPNG.js`（apng）、`jszip`
- `src/statics/lib` の `gifjs` / `whammy.js` は上流 readme で削除扱いながら、manifest の content_scripts `js` に登録され、`src/content_scripts/modules/Legacy/UgoiraGenerator/{GifGenerator,WebmGenerator}`（グローバル `GIF` / `Whammy`）から参照されている

## Data Flow

1. content script がページを解析しリソース情報を取得
2. Ports 経由で options page のマネージャへ送信
3. Manager が Net で取得・変換（ffmpeg.wasm）し、ブラウザ download API で保存
4. 履歴・ダウンロード記録は repositories（PouchDB）と Db（Dexie）へ記録

## Technical Decisions

- Manifest V3 制約により `eval` / `Function` を使えない → `handlebars` 依存の `js-epub-maker` は現状動作不可。コード上は `options_page/downloads.html` が handlebars / js-epub-maker を読み、`NovelDownloadTask.makeEpubBook()` が `EpubMaker` を呼ぶため、実行時に失敗する（known-issues KI-20261110-01）
- ビルドは webpack 4 + Babel。platform ごとに `config/webpack.*.config.js` を分割し `PLATFORM_ENV` で切り替え、出力は `dist/chrome` / `dist/firefox`
- テストは jest 27 + babel-jest。`jest.config.json` の `testRegex` が `test/*.spec.js` を収集（`package.json` に `test` script はなく `npx jest` で実行）
- 上流フォークとして上流 `master` を upstream remote から取り込み、フォーク固有変更は `src/modules/` 単位で最小限に閉じる
