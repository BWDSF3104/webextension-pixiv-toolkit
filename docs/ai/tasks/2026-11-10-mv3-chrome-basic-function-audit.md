# 最新Chrome（MV3）で基本機能が動かない原因の調査と改修

**Status**: 進行中
**Date**: 2026-11-10
**Next Action**: Select & DL A/B button化・Pixiv Omina非表示は実装+画面確認合格（2026-11-10）。残件: P*/Legacy label表示化の実装開始指示待ち（decision 2026-11-10-ui-label-distinction-and-pixiv-omina-hidden.md）。MV3改修方針1-6は未着手

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
- 画面操作実測: Drive保存 `I:\マイドライブ\kilo\2026-11-10-mv3-chrome-basic-function-audit\ui-button-self-operation-confirmation-2026-11-10.txt`。before/after画像も同じフォルダ。browser tool pageはlast open pageのため閉じられず、記録時点でopenのまま。
- 実装（2026-11-10 実装開始指示）: `PageSelector.vue` dialog footer の `Download` → `downloadSelectedPages('folder')` / `downloadSelectedPages('perImage')` の2 button（ラベルは既存 `_download_to_folder` / `_download_per_image` 流用、ロケール追加なし）、`downloadSelectedPages(saveMode)` の emit に `saveMode` 追加。`App.vue` / `AppLegacy.vue` の `pageSelectorDownloadHandler` が `saveMode` を受け取り、AppLegacy は `download()` → `ContentPageDownloadManager.addTask` options へ透過（addTask は options 丸ごと adapter へ渡すため追加配線なし）。Pixiv Omina: `App.vue` / `AppLegacy.vue` の button 表示ブロック・`passToPixivOmina`・`.ptk__pixiv-omina__btn` style を削除、`src/config/default.js` の `showPixivOmina` → false。
- `yarn test`（2026-11-10 実装後）: 2 suites / 11 tests passed（Time 5.1s、既存spec維持）。dialog経由の saveMode 透過はunit対象外（引数受け渡しのみ・新規分岐なし）→ 画面実測は未実施。
- `yarn build`（chrome, 2026-11-10 実装後）: 成功（exit=0、WARNING は既存の asset size limit のみ、Time 7.5s / 6.2s）。
- 画面確認試験（2026-11-10 06:35-06:40、chrome-devtools MCP、拡張 `nccfhdinjmbjnlgnmmgglmenmaacgagf` を dist/chrome から install、viewport 932x871・dpr 2 同一条件、artwork 151753981、local copy は `kilo-safe-remove` でゴミ箱）: **合格**。Drive `I:\マイドライブ\kilo\2026-11-10-mv3-chrome-basic-function-audit\` の `op1-panel-before/after`、`op2-dialog-before/after`、`op3-select-before/after`、`op4-buttonA-before/after`、`op5-buttonB-before/after`、`op6-mode2-panel-before/after`、`op7-mode2-dialog-before/after`、`op8-mode2-buttonA-before/after`（各 -20261110.png）と `select-dl-button-ab-confirmation-2026-11-10.txt`。
  - dialog footer = `DL to folder` / `DL per image` の2 button（zip 追従の `Download` なし）✓
  - A click（2枚選択、legacy）→ `151753981_隊員Oさん\p0 (1).jpg`・`p1 (1).jpg`（06:37:32Z complete）= work folder 内ファイル単位 ✓
  - B click（同）→ `p0 (2).jpg`・`p1 (2).jpg`（06:38:04Z）= 直下ファイル単位 ✓
  - mode2（downloadMode 1→2 一時変更、確認後1へ復元）で p1のみ選択 → A click → `151753981_隊員Oさん\p1 (2).jpg`（06:39:29Z）= 選択反映 ✓
  - Pixiv Omina: legacy・mode2 の両 panel で button なし、`.ptk__pixiv-omina__btn` 要素なし（storage の showPixivOmina は true のまま → UIブロック削除が正）✓
  - op3 after は初回取得で Vue DOM 更新 lag により無変化 → 同一条件で再取得。op4 before は選択確定後へ修正。click の observable change ない項目は実測で確認（rule の前後1組例外を適用）。
  - ブラウザ: page 9（download manager）close 済み。page 8 は最後に開いている page のため close_page 不可（MCP制限）→ 識別条件（コマンドラインに `chrome-devtools-mcp\chrome-profile` を含む chrome.exe）の残存 26 件を終了し、残存 0 を確認（MCP にブラウザ終了操作がないためプロセス終了で対応）。
- 不具合→修正（2026-11-10 06:43 ユーザー指摘、実測で確認）: 選択画面 dialog footer の button が dialog 幅からはみ出し左右のラベルが clip（before 画像 `op2-dialog-after-20261110.png` で左「Select」・右「Clo」のみ表示）。原因 `Dialog.vue` の `.ptk__dialog-foot` が `flex-wrap` なしの `display:flex`、`justify-content:center`（button 6個 ≈640px > container 幅 50%=466px）。修正（ユーザー指示「両方」）: `.ptk__dialog-foot` に `flex-wrap: wrap;` + `row-gap: 6px;`、`.ptk__dialog-container` の `width` 50%→60%。
  - 確認（同一条件 932x871・dpr 2、同一 page 151753981、viewport screenshot）: dialog width 550px、footer height 100px（2行）、`scrollWidth (550) <= width` = overflow false、全 button が wrapper 範囲内（1行目 Select All/Unselect All/Select Invert/DL to folder、2行目 DL per image/Close）。after 画像 `dialog-overflow-after-20261110.png`、txt `dialog-foot-overflow-confirmation-2026-11-10.txt` を Drive へ保存、local copy ゴミ箱。page 10 は last page のため close 不可 → 条件一致 chrome.exe 24 件終了、残存 0 確認。
  - 検証: `yarn test` 2 suites / 11 tests passed、`yarn build` exit=0（CSS のみ。`Dialog.vue` は PageSelector だけで使用）。
- 固定改行（2026-11-10 06:52 ユーザー指示「DL to Folderから固定改行にする」、実装開始指示あり）: footer の折返しが窓幅依存（flex-wrap 自然折返し）だったため、`PageSelector.vue` の foot を2行 wrapper（`.ptk__dialog-foot-row`）へ分割 — 行1 = Select All / Unselect All / Select Invert / DL to folder、行2 = DL per image / Close。`Dialog.vue` は `.ptk__dialog-foot` を `flex-direction: column`（row-gap 6px 維持）し、row は `flex-wrap: wrap` を維持（狭い窓では行内折返し、clip なし）。
  - 実測（chrome-devtools MCP、artwork 151753981、viewport screenshot）: 932x871・dpr 2 → dialog 550px、row1 y=488（4 button）、row2 y=526（DL per image / Close）。500x700・dpr 2（幅を変えた証明）→ dialog 291px、row1 が行内折返しで y=386（Select All/Unselect All）・y=418（Select Invert/DL to folder）、row2 y=456（DL per image/Close）= 境界（DL to folder→DL per image）は幅に依存せず保つ、clip なし。
  - 保存: `I:\マイドライブ\kilo\2026-11-10-mv3-chrome-basic-function-audit\` の `fixedbreak-932x871-20261110.png`、`fixedbreak-narrow-500x700-20261110.png`、`fixed-linebreak-confirmation-2026-11-10.txt`。local copy ゴミ箱。page 11 は last page のため close 不可 → 条件一致 chrome.exe 26 件終了、残存 0 再確認。before 比較は修正前の狭い窓画像がないため DOM 実測＋コード差分で示す（932x871 の修正前画像 `dialog-overflow-after-20261110.png` は偶然4+2）。
  - `yarn test` 11 passed、`yarn build` exit=0。
  - 訂正（2026-11-10 07:01 ユーザー指摘「DL to folder が1行目になっている」）: 上の行グループは DL to folder を1行目の末尾に置いていた。指示の「DL to Folder から固定改行」= DL to folder が2行目の先頭へ訂正（行1 = Select All / Unselect All / Select Invert、行2 = DL to folder / DL per image / Close）。実測 932x871・dpr 2: row1 y=488（3 button）、row2 y=526（DL to folder / DL per image / Close）。500x700・dpr 2（幅を変えて固定境界確認）: row1 行内折返し y=370・402、row2 行内折返し y=440（DL to folder, DL per image）・472（Close）→ 境界（Select Invert → DL to folder）は幅依存せず保つ、clip なし。保存: `fixedbreak-corrected-932x871-20261110.png`、`fixedbreak-corrected-narrow-500x700-20261110.png`、`fixed-linebreak-correction-confirmation-2026-11-10.txt`。page 12 は last page のため close 不可 → 条件一致 chrome.exe 21 件終了、残存 0 確認。local copy ゴミ箱。`yarn test` 11 passed、`yarn build` exit=0。
- button 色確認（2026-11-10、932x871・dpr 2、artwork 151753981、同一条件）: computed background 実測 = 選択系 `rgb(11,116,196)`、download `rgb(10,125,70)`、close `rgb(91,107,120)`、`Select & DL` `rgb(11,116,196)`。before `fixedbreak-corrected-932x871-20261110.png`（既定青）→ after `button-colors-after-932x871-20261110.png`、txt `button-colors-confirmation-2026-11-10.txt` を Drive へ保存、local copy ゴミ箱。page 13 は last page のため close 不可 → 条件一致 chrome.exe 21 件終了、残存 0 確認。downloadMode は 2 へ一時変更後1へ復元。`yarn test` 11 passed、`yarn build` exit=0。

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
- `https://www.pixiv.net/artworks/113960211` と `https://www.pixiv.net/artworks/151883880` の content script console に `Uncaught ReferenceError: Handlebars is not defined`。`dist/chrome/lib/js-epub-maker/js-epub-maker.js:1371` 付近が load 時に `Handlebars.registerHelper(...)` を使うため、content script 列に `lib/handlebars-latest.js` が無く `Handlebars` は undefined。ただし `document.getElementById('__ptk-app')` が false でも content script UI は存在する。Vue が `el: '#__ptk-app'` を component root へ置換するため、login 後の artwork `151883880` では `ptk__container` に `P*` / `Download` / `Pixiv Omina` / `Legacy` / `Mode` が表示されている。UI 生成前に落ちるという記述は不正確。
- options page (`chrome-extension://nccfhdinjmbjnlgnmmgglmenmaacgagf/options_page/index.html`) と popup (`chrome-extension://nccfhdinjmbjnlgnmmgglmenmaacgagf/popup_page/index.html`) は読み込み成功。options page は `Vue` function、`#app` true、console error なし。ただし `FFmpeg` は undefined。`dist/chrome/options_page/index.html` が `lib/ffmpeg/ffmpeg.min.js` を script として読み込まないため、`UgoiraDownloadTask.js` の global `FFmpeg` 参照で Ugoira 変換が失敗する可能性が高い（未 download 実測）。
- DNR: `ruleset_1` enabled。`testMatchOutcome({url:"https://i.pximg.net/img-master/img/2023/12/05/00/27/25/113960211_p0_master1200.jpg", type:"image", initiator:"https://www.pixiv.net"})` で rule 1 matched。これは `net_request_rules_1.json` が `resourceType`（不正なキー）を使っているため、有効な `resourceTypes` が省略されて full match になっている。実際の image request の request header は `referer: https://www.pixiv.net`（DNR の set 値と同じ）で、現状は image へ効いている。`rule 2` は `testMatchOutcome({url:"https://www.fanbox.cc/", type:"main_frame", initiator:"https://www.pixiv.net"})` で `matchedRules: []`。`initiatorDomains: ["options_page/downloads.html"]` の不正値は runtime でも match しない。
- `getMatchedRules()` は filter 属性が `minTimeStamp` / `tabId` only（公式 docs）で resourceType 別 filter は不可。本タスクでは `testMatchOutcome` を使う。
- content script isolated world の CSP/`blob:` worker 可否は MCP の `evaluate_script` が main world で走るため実行時確認できていない。options page で `new Function` / blob worker test が通ったことは、isolated content script の CSP 判定ではない。
- `https://www.pixiv.net/artworks/151883880` の content script UI ボタン確認: `Download` ボタンクリックで service worker の `chrome.downloads.search({})` に `D:\Downloads_Desktop\151883880_立冬.zip` の completed download が残った。UI でも `Download ✔` になった。`#ptk__new-handler` クリックで `ptk__container__body` の `--collapse` class が外れ、panel expand は動作。`P*` guide button (`ControlPanel.vue:8`) は `@click` がなく、guide P* 自体は action not wired。`Pixiv Omina` click は handler が走るが `Failed to launch 'pixiv-omina://create-download?...' because the scheme does not have a registered handler`。`Legacy` / `Mode` button (`AppLegacy.vue:41-44`) は `@click` handler がなく、runtime click で observable change なし。

#### Download成功の原因（2026-11-10）

- 実測で `Download` は成功した。これは MV3 不整合が修正されたからではない。
- 実際の経路: content script UI -> `ContentPageDownloadManager` -> `Downloader` -> port `DownloadFile` -> background `DownloadFileService` -> `fetch` -> blob -> zip -> `browser.downloads.download()`。
- `Downloader.js` の直接 `Download` 経路はコメントアウトされており、active pathは runtime port 経由。
- DNR rule 1 は `resourceType` が不正なため `resourceTypes` 条件が省略され、実質全 request typeにマッチした。これにより background fetch で pximg request に `Referer: https://www.pixiv.net` が適用された。
- `Handlebars is not defined` は EPUB生成側で問題。基本的な artwork zip download は handlebars を必要としないため、この error があっても `Download` は成功した。
- `DownloadService.cachedDownloadIdFilenameMap` と `onDeterminingFilename` listener は、この testでは service worker が boot 済みで生存していたため filename suggestion に使えた。ただし MV3 service worker 再起動で map が失われるリスクは残る。

#### UI表示方針（ユーザー決定）

- ラベルは labelと分かる見た目にする。現状 buttonと同じ見た目で区別できない `P*` guide labelと `Legacy` labelを label表示へ変更する。
- `Pixiv Omina` は不要。拡張UIから非表示にする。`AppLegacy.vue` と `App.vue` の button表示ブロックを削除する方針。
- decision file: `docs/ai/decisions/2026-11-10-ui-label-distinction-and-pixiv-omina-hidden.md`
- Select & DL（選択画面 dialog）は zip 追従ではなく、選択画面内にボタンA/Bの2パターンを置く（A=フォルダ展開 / B=画像別保存）。ラベルは既存 `_download_to_folder` / `_download_per_image` を流用。decision file: `docs/ai/decisions/2026-11-10-select-and-dl-button-ab-in-selection-dialog.md`
- 選択画面 footer の固定改行（DL to folder が2行目の先頭）は実装+確認済み。極端に狭い画面幅のレイアウトは今後気にしない（修整不要・スコープ外。`max-width`・メディアクエリ・行内折返しの追加制御は導入しない）。decision file: `docs/ai/decisions/2026-11-10-narrow-screen-layout-out-of-scope.md`
- button group 別色（選択系 `#0b74c4` / ダウンロード系 `#0a7d46` / クローズ `#5b6b78`、白文字で AA 4.5 以上）を `Button.vue` の既存 `type` prop へ3クラス追加して実装。適用確定分: dialog footer の3 group、`App.vue` panel の download button（A1）、`Select & DL`（選択系 action）。未確認（既定青のまま）: `AppLegacy.vue` の `Download`（A2）、ugoira 换算 button（A3）、`P*` guide・inline handler、`Legacy Mode`。decision file: `docs/ai/decisions/2026-11-10-button-group-colors.md`

#### 画面操作実測（2026-11-10）

- `Download ✔` button clickで service worker `chrome.downloads.search({})` に `D:\Downloads_Desktop\151883880_立冬 (1).zip` が `complete` で追加された。UI上の label textは click前後で `Download ✔` のまま。
- `#ptk__new-handler` clickで `.ptk__container__body` の classが `ptk__container__body--collapse` と `ptk__container__body` の間で切り替わった。handler arrow clickは panel toggleとして動作している。
- `Pixiv Omina` button clickで handlerは走るが、console error `Failed to launch 'pixiv-omina://create-download?url=...' because the scheme does not have a registered handler` が追加された。この環境では目的の動作は失敗。
- `Legacy Mode` button clickで class/text変化なし。handlerがないため操作としての状態変化は確認できなかった。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
