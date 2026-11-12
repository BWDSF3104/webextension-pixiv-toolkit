# MV3改修方針1-6の実装

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: 方針2/3/4/5/6とrule2実施済み・sandbox EPUBとGIF workerは実測合格(e732fe7,25c2c7c)。残: ffmpeg MP4はKI-20261112-01の0.12.xブリッジ移行（別タスク）、EPUB実DLとCS内GIF workerとファイル名の実機確認

## 意図 / 背景

監査タスク `2026-11-10-mv3-chrome-basic-function-audit` の改修方針1-6について、実装済みかの確認と、未実施分の「本当に実装すべきか」の検討を含む実装（ユーザー指示 2026-11-12）。

## 調査結果 / 変更内容

### 方針ごとの実施済み状況（2026-11-12 調査）

- **方針5**（WebRequestService 削除）: **実施済み**。commit 75947cb（cleanup-dead-code-and-observe）で削除。
- **方針6**（permission・未使用モジュール整理）: **大半実施済み**。ScriptInjector/Notification/Queue/pouchdb 等は削除済み。残は manifest の `downloads.shelf`（Chrome 117 deprecated・参照ゼロ）と `web_accessible_resources` の存在しない `lib/ffmpeg/ffmpeg-core.wasm` 参照 → 今回掃除。
- **方針2**（onDeterminingFilename）: 未実施。**listener 削除で解決**と判断。listener の動作は `downloads.download({url, filename})` に渡済みの filename を map 経由で再 suggest するだけで、listener なしなら download() の filename がそのまま有効（既定 conflictAction は uniquify で同等）。SW 再起動で map が失れてファイル名が Chrome 自動名になる既知症状も、map ごと削除で消える。上流 HISTORY v6.4.2 も「Remove the listener for event onDeterminingFilename」。storage 永続化は不要と判断。
- **方針1**（DNR rule）: 未実施。**rule 1 の修正はしない**と判断 — `resourceType` が不正キーのため実質 full match になり、実測（11-10）で image 含む pximg リクエストに Referer が適用されダウンロードが動いている。正しい `resourceTypes` に直すと列挙漏れの型で現状動いている経路を壊すリスク > 効果。rule 2 は `initiatorDomains` 不正で登録されず実害ゼロの dead rule → 削除。
- **方針3**（blob worker → 同封 worker）: 未実施。ugoira GIF 変換（`ContentPageDownloadManager.js:73` で GifGenerator は LIVE）が MV3 content script CSP で blob worker を作れず失敗する可能性が高いが**未実測**。gif.js の `workerScript` 指定でも gif.js 内部が XHR→blob 経路のため、同封 worker 化には GifGenerator 側の配線変更が必要。→ ユーザー判断依頼（GIF変換を使うか）。
- **方針4**（handlebars/epub）: content script 列からは js-epub-maker を除去済み（7ad7fef）。残る epub 経路は download manager（`downloads.html:12-13` が handlebars-latest.js + js-epub-maker.js を読む）。extension page CSP（`script-src 'self' 'wasm-unsafe-eval'`）で `new Function` 不可のため epub 生成は不可（コード確定・未実測）。修正は sandbox ページ隔離で中規模。→ ユーザー判断依頼（EPUB を使うか）。
- **関連（監査項目8、方針外）**: ugoira MP4 変換は `ffmpeg-core.js`/`ffmpeg-core.wasm` が同封されず、`downloads.html:7` の参照が 404、既定 corePath は unpkg（remote code で MV3 禁止）→ MP4 変換不可。npm の @ffmpeg/core を同封すれば直るが +約25MB。→ ユーザー判断依頼。

### 今回実装（2026-11-12）

- `DownloadService.js`: `onDeterminingFilename` listener・`cachedDownloadIdFilenameMap`・`cacheDownloadIdFilename` を削除（方針2。download() の filename がそのまま有効。conflictAction は既定 uniquify で同等）
- `net_request_rules_1.json`: rule 2 を削除（不正 `initiatorDomains` で未登録の dead rule、挙動不変）。rule 1 は現状 working（実質 full match で Referer 適用済み）のため無変更
- `manifest.json`: `downloads.shelf` 削除、`web_accessible_resources`（存在しない `ffmpeg-core.wasm` のみ）削除
- `downloads.html`: 存在しない `lib/ffmpeg/ffmpeg-core.js` 参照削除（handlebars/epub 参照は方針4 判断待ちで残置）
- 未実施（判断依頼）: 方針3（GIF worker 同封化）、方針4（EPUB sandbox）、監査項目8（ffmpeg core 同封）

### ユーザー判断後の実装（2026-11-12、3件とも「使う→修正」選択）

- **方針3 GIF**: `workerScript` が直接 `new Worker(url)` される gif.js 0.1.6 の仕様を利用し、blob 生成の `GifGeneratorWorker.js` を削除、`src/statics/lib/gifjs/gif.worker.js`（gif.js@0.1.6 dist 由来）を `browser.runtime.getURL()` で参照。manifest WAR に登録
- **方針4 EPUB**: sandbox ページ隔離を実装。`src/statics/sandbox/epub.html` + `epub-bridge.js`（postMessage IPC、`makeEpub()` → arrayBuffer 返却）。`NovelDownloadTask.makeEpubBook` を iframe + IPC 経由へ書き換え。表紙は本体側で fetch→dataURL 化。manifest に `sandbox.pages` 追加、`downloads.html` の handlebars/js-epub-maker 参照削除
  - **上流バグ修正**: 上流は `downloadEpub()`（ブラウザDL発火・undefined 返し）を呼んでおり EPUB は CSP 以前に壊れていた。正しくは `makeEpub()`。リネーム関連の未定義変数 `saveUrl` 参照バグも書き換えで解消
- **監査項目8 ffmpeg MP4**: 「core 同封」では直せないことが判明（`@ffmpeg/core@0.11.0` は pthread ビルド=SharedArrayBuffer 必須、MV3 拡張ページは cross-origin isolated 不可。0.11.6 ローダーは blob importScripts/blob worker で CSP ブロック）。→ issue `KI-20261112-01` へ記録、0.12.x 自作ブリッジ移行は別タスク。decision `2026-11-12-epub-sandbox-and-ffmpeg-deferred.md`

### ffmpeg 退役とジェネレータ配線（2026-11-12、ユーザー指示「webm/gif/apng 配線して mp4/ffmpeg は退役」）

- `UgoiraDownloadTask`: コンストラクタで `convertType`(gif/webm/apng)→ジェネレータ解決（未対応は `RuntimeError('NOT_SUPPORT_CONVERT_TYPE')`）。`runFFmpeg`・ffmpeg 分岐・abortProcess の ffmpeg 停止を削除。`onFinish` は generator 経路のみ（complete/error 処理追加）
- `ApngGenerator`: worker-loader（blob worker=CSP 不可）廃止、`APNG.encode` 直接呼び出しへ。`APngGenerator.worker.js` 削除。`GifGenerator`: `$extension.browserItems` → `GlobalSettings().ugoiraQuanlity`
- `downloads.html`: `gif.js`/`whammy.js` script 追加、`ffmpeg.min.js` 参照削除
- UI/設定削除: CS の mp4/custom ボタンと進捗系、`UgoiraOptions.vue` の ffmpeg CLI テキスト、`UgoiraConverterOption.vue`・`ContentPageDownloadManager.js`（参照ゼロ）・`src/statics/lib/ffmpeg/`、`default.js` の ugoiraConvertTool/ugoiraCustomFFmpegCommand/ugoiraFFmpeg*CliArgs、`ThirdParty.vue` の ffmpeg.wasm クレジット、`IllustAdapter` の fixedFFmpegCliArgs
- ビルド削除: `webpack.background.config.js` の ffmpeg・pouchdb（参照ゼロ）コピー規則と `FFmpeg` external、`webpack.base.config.js` の worker-loader 規則
- `jest.config.json`: `modulePathIgnorePatterns: ["<rootDir>/dist/"]` 追加（dist 内 `UPNG.js/package.json` の haste 重複で `upng-js` 解決が `dupMap.get is not a function` となっていた）
- decision `2026-11-12-ffmpeg-retirement-and-generator-wiring.md`（`2026-11-12-epub-sandbox-and-ffmpeg-deferred.md` の ffmpeg 保留決定を supersede）。`KI-20261112-01`・`KI-20261110-06` は解決として archive へ

## Verification

- `yarn test`: 7 suites / 37 tests passed（複数回）
- `yarn build`（chrome）: exit 0、`yarn build:firefox`: exit 0（sandbox 追加後 Done in 9.26s）
- `net_request_rules_1.json`: `ConvertFrom-Json` 妥当（rules=1, id=1）
- `rg cachedDownloadIdFilename|listenOnDeterminingFilename src/`: 残参照ゼロ
- Chrome 実機（chrome-devtools MCP・id `nccfhdinjmbjnlgnmmgglmenmaacgagf`・`reload_extension` 後）:
  - `sandbox/epub.html`: console error ゼロ（js-epub-maker の underscore.string fallback debug のみ）、`EpubMaker`/`JSZip`/`Handlebars` 定義、`new Function` = allowed（sandbox CSP 免除確認）
  - sandbox self-test: postMessage IPC で EPUB 生成 → **3648 bytes・先頭 50 4B 03 04（ZIP local header）= 有効 epub**。jszip-utils 不足と `makeEpub()` 修正はこの実測で発見・修正
  - `lib/gifjs/gif.worker.js`: extension page から `new Worker(getURL(...))` が起動し応答を返す（CSP 通過確認）
### ffmpeg 退役後（2026-11-12）

- `yarn test`: 7 suites passed（`modulePathIgnorePatterns` 追加後。追加前は dist 内 haste 重複で `renameRules.spec` が failed to run）
- `yarn build`（chrome・Done in 13.46s）/ `yarn build:firefox`（Done in 14.04s）: ERROR in / Module not found ゼロ
- `rg -in ffmpeg src/ config/ test/`: 残りは IllustAdapter の退役コメント、`_locales`（未使用文言・残置）、HISTORY（歴史記述）のみ
- Chrome 実機（reload 後 downloads.html）: console error ゼロ、`GIF`=function（gif.js global）、`Whammy`=object、`lib/gifjs/gif.worker.js` の拡張 URL 解決 OK、`JSZip`=function。APNG/UPNG は webpack バンドル経由（global 不要）
- **未確認**: ugoira webm/gif/apng の実データ変換 e2e（pixiv ログイン操作が必要。ジェネレータ本体は CS 側で動作実績、options 側は global 読込とビルドまで確認）、ダウンロードファイル名の Chrome 実機表示、content script isolated world からの GIF worker 起動（MCP 評価が main world のため実測不可、同拡張ファイル参照なので同一と推定）、EPUB の download manager 経由の実 DL

## 完了時 Memory Bank 操作

- [x] `current-task.tsv` の参照行を削除（task_manager end）
- [x] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（KI-20261112-01、KI-20261110-06）
- [x] `backlog.md` の完了項目を削除（該当なし）
