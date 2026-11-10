# 最新Chrome（MV3）で基本機能が動かない原因の調査と改修

**Status**: 進行中
**Date**: 2026-11-10
**Next Action**: MCP実行確認完了・login済み。download実測・改修方針確定

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

## 実行時確認（自動化）

- `--load-extension` はこの Chrome ビルド（157.0.8103.38）で無視される。最小構成の MV3 拡張（`docs/ai/tmp/testext/`）でも service worker ターゲットが出なかった → 本プロジェクトの manifest 起因ではない。
- 自動化は Chrome DevTools MCP の拡張ツールで行う。Kilo のグローバル設定 `C:\Users\fujim\.config\kilo\kilo.jsonc` の `mcp` に追加済み（再起動後に有効）:

  ```jsonc
  "chrome-devtools": {
    "type": "local",
    "command": ["npx", "-y", "chrome-devtools-mcp@latest", "--categoryExtensions",
                "--experimentalIncludeAllPages",
                "--filesystemRoot=S:/Documents/Kilo_Commons/webextension-pixiv-toolkit"],
    "enabled": true,
    "timeout": 120000
  }
  ```

- 確認済み（公式ドキュメント）: ツールは `install_extension` / `list_extensions` / `reload_extension` / `trigger_extension_action` / `uninstall_extension`。`--categoryExtensions` は既定で無効。ファイルアクセスは roots か `--filesystemRoot`（alias `--workspace`）内のパス only。
- 注意（ユーザー提供情報の補正）: `--categoryExtensions` は **pipe connection のみ**サポート。`--autoConnect` / `--browserUrl` で既存 Chrome に接続する経路では拡張ツールが使えない → MCP が起動する Chrome が対象になる。ログイン状態は既定の永続プロファイル（`~/.cache/chrome-devtools-mcp/chrome-profile`）に維持されるので `--isolated` は付けない。
- `--experimentalIncludeAllPages` を入れた理由: service worker / extension page を対象に入れてコンソールと評価を見ため。これがないと page コンテキストしか見えない。
- 実行計画（再起動後）: `list_extensions` → `install_extension`（`dist/chrome`）→ pixiv へ移動（そのプロファイルで一度ログイン）→ `#__ptk-app` の有無とコンソールの例外 → ダウンロード実行 → `getMatchedRules` / ルール2の登録エラー確認。
- 補完: service worker 内の `typeof chrome.webRequest` 等は `docs/ai/tmp/mv3_probe.js`（CDP）で見る。MCP が pipe で起動したインスタンスには接続できないため、これは別途 `--remote-debugging-port` で起動した Chrome 用のスクリプトとして残す。

#### 実行結果（2026-11-10, Chrome DevTools MCP）

- 資格情報の保管場所はプロジェクト内 `.env`（gitignored）。`git check-ignore -v .env` → `.gitignore:10:.env`。`docs/ai/tmp/` は archive で消えるため使用しない。旧 `docs/ai/tmp/pixiv_credentials.local.md` と temp の一時コピーは Recycle Bin へ削除済み。変数名は `PIXIV_EMAIL` / `PIXIV_PASSWORD`。
- DevTools MCP の persistent profile でログイン完了（profile `ぶるめ`）。`accounts.pixiv.net/security-setting/reminder` を通過し、`https://www.pixiv.net/` で login session 確認。`git check-ignore -v docs/ai/tmp/pixiv_credentials.local.md` → `.gitignore:9:/docs/ai/tmp/`。
- `dist/chrome` を DevTools MCP の `install_extension` で読み込めた（extension id `nccfhdinjmbjnlgnmmgglmenmaacgagf`）。service worker `background/background.js` が起動し、`chrome.declarativeNetRequest` / `chrome.storage` / `chrome.downloads` / `chrome.runtime` は object。`chrome.webRequest` は undefined。`chrome.downloads.onDeterminingFilename` listener は object として確認できた。
- `chrome.storage.local.get(null)` は成功。`self.oninstall` は service worker の install listener（`function`）で、`onBooted()` は SW install 時だけ走るという既存の設計確認は保つ。listener の同期登録、cache/port 喪失、ファイル名実測は未実施。
- `https://www.pixiv.net/` では content script の `Invalid page. url: https://www.pixiv.net/`（`src/content_scripts/modules/PageFilter.js:37`）がコンソールに出た。これは homepage が UI の対象 URL でないため。
- `https://www.pixiv.net/artworks/113960211` で `#__ptk-app` は false。同 content script world の console に `Uncaught ReferenceError: Handlebars is not defined`。`dist/chrome/lib/js-epub-maker/js-epub-maker.js:1371` 付近が load 時に `Handlebars.registerHelper(...)` を使うため、content script 列に `lib/handlebars-latest.js` が無い現時点で UI 生成前に落ちる。
- options page (`chrome-extension://nccfhdinjmbjnlgnmmgglmenmaacgagf/options_page/index.html`) と popup (`chrome-extension://nccfhdinjmbjnlgnmmgglmenmaacgagf/popup_page/index.html`) は読み込み成功。options page は `Vue` function、`#app` true、console error なし。ただし `FFmpeg` は undefined。`dist/chrome/options_page/index.html` が `lib/ffmpeg/ffmpeg.min.js` を script として読み込まないため、`UgoiraDownloadTask.js` の global `FFmpeg` 参照で Ugoira 変換が失敗する可能性が高い（未 download 実測）。
- DNR: `ruleset_1` enabled。`testMatchOutcome({url:"https://i.pximg.net/img-master/img/2023/12/05/00/27/25/113960211_p0_master1200.jpg", type:"image", initiator:"https://www.pixiv.net"})` で rule 1 matched。これは `net_request_rules_1.json` が `resourceType`（不正なキー）を使っているため、有効な `resourceTypes` が省略されて full match になっている。実際の image request の request header は `referer: https://www.pixiv.net`（DNR の set 値と同じ）で、現状は image へ効いている。`rule 2` は `testMatchOutcome({url:"https://www.fanbox.cc/", type:"main_frame", initiator:"https://www.pixiv.net"})` で `matchedRules: []`。`initiatorDomains: ["options_page/downloads.html"]` の不正値は runtime でも match しない。
- `getMatchedRules()` は filter 属性が `minTimeStamp` / `tabId` only（公式 docs）で resourceType 別 filter は不可。本タスクでは `testMatchOutcome` を使う。
- content script isolated world の CSP/`blob:` worker 可否は MCP の `evaluate_script` が main world で走るため実行時確認できていない。options page で `new Function` / blob worker test が通ったことは、isolated content script の CSP 判定ではない。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
