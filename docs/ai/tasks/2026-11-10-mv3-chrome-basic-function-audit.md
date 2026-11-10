# 最新Chrome（MV3）で基本機能が動かない原因の調査と改修

**Status**: 進行中
**Date**: 2026-11-10
**Next Action**: 症状の特定（ユーザー）→ 改修範囲確定。実装開始指示後に着手

## 意図 / 背景

最新 Google Chrome で基本機能（ダウンロード・Ugoira 変換・ページ UI）が動かない原因の調査。
フォーク固有のコード変更はない（`git diff --stat upstream/master...HEAD` は `docs/`・`.gitignore`・`package.json` のみ）。
つまり上流の MV2 前提のコードが MV3 でどこで壊れるかという問題。

## 調査結果 / 変更内容

### MV3 で確定している不整合（コード + 公式ドキュメントで確認）

1. **blocking webRequest が MV3 で不可** — `src/background/services/WebRequestService.js:52,60,113,121`。
   MV3 では `webRequestBlocking` が policy install 拡張に限定される。加えて manifest に `webRequest` permission がないため `browser.webRequest` は `undefined` → `OnBeforeSendHeadersOptions` 参照で TypeError。
   このサービスは `Application.onBooted()`（`src/background/Application.js:97`）がコメントアウトされているので、`to:'ws', action:'webRequest:*'` で呼ばれたときだけ実行される（潜在的クラッシュ）。
   このサービスが担っていた Referer / Access-Control-Allow-Origin / COOP・COEP の上書きは MV3 で失われ、 declarativeNetRequest の 2 ルールだけが置き換えになっている。

2. **DNR rule 2 が不正** — `src/statics/net_request_rules_1.json:44` の `initiatorDomains: ["options_page/downloads.html"]` はドメイン（eTLD+1）でなければならない。無効値なのでルールが登録されない → ダウンロードマネージャ発 Fanbox リクエストの Referer が効かない。

3. **DNR rule 1 の resourceType に `image` / `media` がない**（`net_request_rules_1.json:19-24`）。
   `chrome.downloads.download()` で起こす pximg 取得は image/media 扱いになりやすく、Referer 上書きが適用されず pximg の hotlink 保護（Referer 必須）で 403 になる。ダウンロード失敗の主候補（未実測）。

4. **service worker の状態喪失** — `DownloadService.cachedDownloadIdFilenameMap`（`DownloadService.js:23`）と `AbstractPortService.ports`（`AbstractPortService.js:11`）は SW の再起動で失われる。
   `download()` に渡した filename を `onDeterminingFilename` 時点で参照できないと、listener は `downloadItem.filename`（Chrome 自動名）を suggest する。docs 上、listener が登録されていると `download()` の `filename` は無視される → ファイル名が化ける。進行中ダウンロードの port も失われ progress 通知が届かない。

5. **listener が async で登録されている** — `DownloadService` の listener は `onBeforeBoot()` 内で `await` の後に登録される（`Application.js:87-93`）。MV3 は top-level の同期登録を求める（migration checklist "Register listeners synchronously"）。登録前に届いたイベントを逃す。

6. **content script でも eval / new Function が禁じられている** — MV3 の isolated world CSP（`script-src 'self' 'wasm-unsafe-eval' …`）は `new Function` を許さない。handlebars の `Handlebars.compile`（`lib/js-epub-maker/js-epub-maker.js:1066`）がこれを使う → epub 生成不可（`KI-20261110-01`）。
   さらに `handlebars-latest.js` は `content_scripts.js` 列に無く `js-epub-maker.js` だけが列挙されている（`manifest.json`）ので、CSP 以前に content script 側で `Handlebars` が undefined（ReferenceError）。KI-01 の原因記述は不十分。

7. **content script の blob worker が CSP でブロックされる** — `src/content_scripts/modules/Legacy/UgoiraGenerator/GifGeneratorWorker.js:8` が `URL.createObjectURL(new Blob(...))` で worker URL を作り、gif.js が `new Worker(blobUrl)` を生成する（`GifGenerator.js:83`）。MV3 の isolated world CSP は `blob:` を許さない → GIF 変換の worker が起動しない。`config/webpack.content-scripts.config.js` に worker-loader ルールもない。

8. **ffmpeg 経路** — `src/statics/lib/ffmpeg/ffmpeg.min.js` の既定 `corePath` が `https://unpkg.com/@ffmpeg/core@…/dist/ffmpeg-core.js`（remote code、MV3 で禁止）。
   コードは `browser.runtime.getURL('lib/ffmpeg/ffmpeg-core.js')`（`App.vue:439`・`AppLegacy.vue:402`）を渡すが、そのファイルは同封されていない（`src/statics/lib/ffmpeg/` にあるのは `ffmpeg.min.js` だけ）。`web_accessible_resources` が参照する `lib/ffmpeg/ffmpeg-core.wasm` も存在しない。COOP/COEP 注入は 1. で失われている。

9. **`tabs.executeScript` は MV3 で削除**（`src/core/browser/ScriptInjector.js:44,48`、`src/modules/Util/ScriptInjector.js:45,49`）。`scripting` permission も未宣言。呼び出し箇所はないので実害は潜在のみ。

10. **`notifications` permission 未宣言** → `browser.notifications` が undefined（`src/core/browser/Notification.js:85`）。呼び出し箇所はない。

11. **`self.oninstall`**（`src/background/Bootstrap.js:49`）は拡張イベントではなく service worker の install イベント。`onBooted()` は SW インストール時だけ走る。

12. 古い・参照外: `downloads.shelf` permission（Chrome 117 で deprecated）、`pouchdb*.min.js` は dist にあるが参照なし。

### 確認できていない点

- 実際の症状（UI が出ない / ダウンロード 403 / 変換失敗）のうちどれがユーザー環境で起きているか未確定。
- 実行時確認は未実施: Playwright は `--disable-extensions` で起動するため、この拡張を読み込めなかった（`--load-extension` を付けても service worker が登録されなかった）。

### 悪意あるコードの確認

- **フォーク固有のコード変更なし**（`git diff --stat upstream/master...HEAD` → docs / .gitignore / package.json のみ）。
- アプリコードの通信先: pixiv.net / pximg.net / fanbox.cc / comic.pixiv.net の API と `raw.githubusercontent.com/leoding86/…/sponsors.json`（`src/options_page/components/SponsorsCard.vue:35`）。ChangeLog は `runtime.getURL`（同封ファイル）。解析・計測・ユーザーデータ送信はなし。`document.cookie` 読み取りなし、WebSocket なし。
- 難読化なし。minify だけの vendor lib（dexie 3.x / handlebars 5.0.0-alpha.1 / gif.js 0.1.6 / jszip / whammy / UPNG）。
  `src/statics/lib/jszip/jszip.js:4330` の `Function('return this')()` は core-js の global 検出（MV3 CSP でブロックされるが悪意はない）。dexie の `tinyurl.com` はエラーメッセージ内の文字列。
- 指摘価値: unpkg から `@ffmpeg/core` を取る設計は MV3 の remote-code ポリシー抵触（CWS 審査対象）。sponsors.json の远程取得はコード実行ではないので可。

## Verification

- `git fetch upstream` + `git diff --stat upstream/master...HEAD`: 29 files changed（コード差分なし・docs / .gitignore / package.json のみ）
- 実行時確認（Chrome への読み込み）: 未実施（Playwright が拡張を読み込めない）

## 改修方針（実装開始指示後に着手）

1. DNR rule 1 に `image` / `media` を追加、rule 2 の `initiatorDomains` を修正（または削除）
2. `onDeterminingFilename` を top-level で同期登録、filename を storage に永続化
3. content script の blob worker を同封ファイルの worker に変更
4. handlebars を precompile、または CSP で許される sandbox ページへ隔離
5. `WebRequestService` を削除し DNR で代替（CORS 系は responseHeaders ルール）
6. 未宣言 permission（`webRequest`・`notifications`）と未使用モジュール（ScriptInjector・Notification）の整理

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
