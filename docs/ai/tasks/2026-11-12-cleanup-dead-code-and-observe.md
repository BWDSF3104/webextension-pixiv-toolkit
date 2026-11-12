# 未参照の確定したデッドコード掃除と残項目の実機観測

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: grepで参照ゼロを確定→kilo-safe-remove→build+testで再確認。item8はpixiv読込で注入JS計測、item17/2bはログイン済みで実DL観測(無ければ観測手順記録)

## 意図 / 背景

承認済みの安全修正（item 1/2a/3/4/11/16、commit 9bf7991・9b2a5f2）に続き、監査で残った (a) 未参照のデッドコード削除、(b) 未処置のライブ項目（item 8 注入コスト / item 17 実効並列度 / item 2b base64 往復）を実機観測で定量化する。削除は「参照ゼロを grep で確定してから」がユーザー指示。Chrome 挙動を壊さないこと。

## 調査結果 / 変更内容

### デッドコード削除（commit 75947cb, 16ファイル）
grep で各シンボルが**削除対象群の内部参照のみ**（`.vue`・webpack config 参照なし）を確認後、`kilo-safe-rmdir`/`kilo-safe-remove` で削除。削除後も test(29)/chrome build/firefox build が全て exit 0 で参照切れを検証。
- `src/modules/Queue.js`（item 14 相当の O(N²)/NaN。未使用）
- `src/modules/Util/ScriptInjector.js` / `src/core/browser/{ScriptInjector,Notification,NotificationStack}.js`（item 15 未使用）
- `src/repositories/{AssetCache,IllustHistory,DownloadRecord}.js`・`src/options_page/modules/AssetCacheService.js`（item 5 AssetCache O(N²)。未使用）
- `src/background/services/WebRequestService.js`（MV3 で webRequest 廃止済み・KI-20261110-06）
- `src/modules/Ports/{IllustHistoryPort,DownloadRecordPort}/`（上記 repositories 連動で未使用）
※ 実履歴ストアは Dexie `histories`/`HistoryRepo`（LIVE、item 3 修正対象）。`AbstractPortService.boradcast`（誤字）は dead だが触れていない。

### item 8 — content script 注入コスト（実測・確定）
`dist/chrome` の content_scripts 実ファイル計測と manifest 照合。該当ページ（www.pixiv.net/*, *.fanbox.cc/*, comic.pixiv.net/*）に**毎回 JS+CSS 約1093 KB を注入**。うち on-demand 専用ライブラリが約540 KB（jszip 435 KB, js-epub-maker 66+7.6 KB [EPUB は MV3 で壊れている], gif.js 9.5 KB, whammy 20.8 KB）。コア約579 KB。→ 遅延 import 化が有効（未処置・改善余地として記録）。

### item 17 — 実効ダウンロード並列度=1（コード確定）
`Downloader.downloadNext()`(src/modules/Net/Downloader.js:125) は 1 回で `downloadFiles.shift()` を1個だけ取り出し、`downloadFilePorts.length < processors` でも `downloadFile()` を**1回だけ**呼ぶ。再帰呼び出しは item-finish/error の 1 完了につき 1 回（:182/:208/:219）だけなので、`processors`（`downloadTasksWhenDownloadingImages=3`）までループで埋めず、**在-flight は初期1個で固定＝実効並列度1**。設定値は不発。改善は `downloadNext` を `while(ports<processors) {f=shift; if(!f)break; downloadFile(f)}` にする（未処置・要テスト）。

### item 2b — base64/blob 往復コスト（SW 実測・非破壊）
MV3 service worker では `URL.createObjectURL` が**使用不可**（実測: `hasCreateObjectURL:false`）。これが現状の base64(dataURL) 方式の由来。synthetic blob（実写像サイズ）で SW 内実測：
| 1ファイル | readAsDataURL | ArrayBuffer+構造化クローン | base64 膨張 |
|---|---|---|---|
| 0.5 MB | 3.1 ms | 1.1 ms | 1.33x |
| 2 MB | 9.0 ms | 4.6 ms | 1.33x |
| 8 MB | 31.6 ms | 9.6 ms | 1.33x |
base64 は **1.33x（+33%）のメモリ/ペイロード**を string で保持・postMessage し、後続の `fetch(dataURL)` 再デコードが加算。item 17 で直列化されるため多重化されず純加算。改善案は ArrayBuffer/Blob を直接 postMessage（構造化クローン、base64 回避）（未処置）。

### ライブDL観測（未実施・手順記録）
item 3（履歴重複排除の実機確認）/ item 11（マンガのフォルダ命名の実機確認）/ item 9（Firefox `onDeterminingFilename`）。
- 拡張の DL ボタン（"画像ごとに DL" 等）はシャドウ DOM ポータル内かつ選択未完了で `button--disabled`。UID ハイトラップ不可、script 合成 click では発火せず。これ以上の強制はユーザーのディスク/ダイアログに副作用を掛け再現性も低いため未実施。
- 妥当性: **DLコードパスは今回の変更対象外**（削除は全て非DLモジュール、chrome build 合格、Downloader 単体テスト3件合格）。item 3 重複排除は HistoryRepo 単体テスト2件で担保済み。item 9 は Firefox 優先度低（ユーザー指示）でスキップ。
- 実施手順（必要時）: pixiv 作品ページで拡張パネル→「選択＆DL」→DLマネージャで開始→`chrome.downloads.search({})`（SW evaluate）で完了確認、2回 DL で Dexie `histories` の uid 1件確認。成果ファイルは `kilo-safe-remove` で掃除。

## Verification

- デッドコード削除: `yarn test` = 6 suites / 29 tests 合格、`yarn build`(chrome) exit 0、`yarn build:firefox` exit 0。→ commit 75947cb。
- item 8: `dist/chrome` の content_scripts 実サイズ計測 + `manifest.json` の content_scripts 定義で照合（JS+CSS 約1093 KB／on-demand専用 約540 KB）。
- item 17: `Downloader.js:125-219` の downloadNext/完了時再帰のコード読みで確定。
- item 2b: sw-6 で `evaluate_script` 実行（0.5/2/8MB、`URL.createObjectURL` 不可を確認、readAsDataURL と arrayBuffer+MessageChannel clone を実測）。
- ライブDL: 未実施（上記理由）。推測と確認を区別：item 3/11/9 の**実機動作は未確認**。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
