# 適用済み修正の確認と残項目の検証・実施検討

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: 検証完了・unit29/build/実機ロード確認済み。実装した残りは項目16と掃除のみ。次タスク候補: 項目2b(base64→ArrayBuffer化・要実DL確認)、項目17(実効同時1・要レート制限検討)、項目8(manifest lazy-load)、デッドコード一括除去(参照経路消去確認)。実DLでの目視確認は未実施。

## 意図 / 背景

`2026-11-12-apply-approved-audit-fixes` で適用した修正の検証（実行時＋unit）と、同タスクで保留した残項目（2b/5/6/7/8/10/12/14/15/16相当）の再検証・実施検討。条件は Chrome 動作を最優先・非破壊。

## 調査結果 / 変更内容

検証で項目分類が更新された。最重要の発見は、当初「非効率」と見た項目の多くが **未import/未配線のデッドコードでランタイム負荷ゼロ** であること、そして検証中に **新しい実バグ（項目16）** を検出し修正したことです。

### A. 今回追加修正（生きているコード・unitで検証）

- 項目16（新規発見）: `Net/Downloader.js` のエラー経路が未宣言変数 `errorMessage` を参照し、**ファイル1件の失敗で ReferenceError を投げて後続ダウンロードが停止**しうる（background は `{error: error.message}`＝文字列を送るのに `error` を使った名残で `errorMessage` を参照していた）。`error` を使うよう修正し `test/Downloader.spec.js` で再現→修正を担保。
- 項目1の補強: `test/Downloader.spec.js` で `removeDownloadFromCollection` の破壊的削除と、失敗port除去→次ファイル開始の台帳整合性を検証（回帰防止）。
- 項目3の補強: `test/HistoryRepo.spec.js` で `getItem` が uid 索引（`where('uid').equals().first()`）で引くこと、`saveItem` が既存uid時は `update` を使い `add` しないことを検証。

### B. 掃除適用（生きているコード・挙動不変のデバッグログ除去）

- 項目10: `Application.onInstalled` の本番 `console.log(arguments)` 除去＋引数 shadow（`previousVersion` 再宣言）解消（`storedVersion` に改名、挙動は従来どおり settings.version 比較）。ビルドは元々通っていたため shadow は致命的ではなかったが意図が不明瞭だった。
- 項目12: `Bootstrap.bindEvents` の `console.log(event, arguments)` 除去（arrow内 `arguments` は bindEvents のものを参照しており誤りでもあった）。`update6_0_0.js` の settings 出力ログ2本除去。`AbstractPortService.boradcast`（つづり）は呼び出し元ゼロ＝デッドのため改名せず放置。

### C. デッドコード確認（未import/未配線 → バンドル非収録・ランタイム負荷ゼロ。掃除は任意で今回見送り）

静的grepで、これらは入口（background/options/content/popup）から到達できず import もされていないことを確認:
- `modules/Queue.js`（項目14: 呼び出し元ゼロ。`setProcessors` の parseInt/完了毎 filter は発火しない）
- `core/browser/ScriptInjector.js`・`modules/Util/ScriptInjector.js`（項目15・`tabs.executeScript` 廃止で呼出なし）
- `core/browser/Notification.js`・`NotificationStack.js`（項目15・permission 未宣言で呼出なし）
- `repositories/AssetCache.js`・`options_page/modules/AssetCacheService.js`（項目5: AssetCacheService を読み込む箇所なし。よって O(N²) は発現しない）
- `modules/Ports/IllustHistoryPort/*`・`modules/Ports/DownloadRecordPort/*`（項目7: services 登録なし・`connect(name)` の照合先にならず、PortName の connect 発火箇所なし）
- `background/services/WebRequestService.js`（`Application.onBooted` でコメントアウト済み。MV3監査 KI-20261110-06 の既知範囲）
→ いずれも削除するとソースは軽くなるが、ビルド成果物への影響・動作への便益はゼロ。既存データの扱い（illust_histories 等）に絡むため、削除は別途タスクで「参照経路の消去確認」を条件に実施。

### D. 生きているが実施見送り（実施検討結論と理由）

- 項目2b（`background/services/DownloadFileService.js` の base64往復）: 効果は最大の残りだが、稼働DL経路の port メッセージ形式変更（dataURL→ArrayBuffer、受けた `Downloader` の blob復元）。MV3 port の構造化クローンは ArrayBuffer をサポートしているはずだが、**実行時DLで往復を確認しないと Chrome を壊すリスク**を取れない。結論: 実装方針は決まっているが、ログイン済み Pixiv で実DL確認ができる環境で実施（今回は未実施）。
- 項目17（新規観察・`Downloader.downloadNext`）: 起動時に1件しか開始せず完了毎に1件補充するため、既定 `downloadTasksWhenDownloadingImages=3` でも**実効の同時DLは1**。設定が無効になっている。ただし並列度を上げると pximg のレート制限/403 の可能性があり「Chrome非破壊」の観点で安易変更不可。高層に `maxProcessDownloadTasks=3`・`multipleDownloadsGapTime=150` があり意図的可能性も。結論: レート制限を踏まえた実測検討。現状は変更せず記録。
- 項目4の残（`AbstractRepo.searchItems` の全件JS総当り）: nullガードでクラッシュは解消済み。総当り自体は Dexie 索引（title 部分一致は索引不可）設計の見直しで、件数上限10000内有効範囲。結論: 見送り（効果薄い・要設計）。
- 項目8（manifest lazy-load・`src/statics/manifest.json:64-76`）: epub/ugoira用 vendor（js-epub-maker/gif.js/whammy/jszip）を全 pixiv/fanbox/comic ページへ常時注入しているのは実測の不要コスト。ただし content script の初期ロード順・`app.js` 起動と global 依存の関係で、on-demand 化は bootstrap 再設計＋実機確認が必要。結論: 見送り（要別枠設計）。
- 項目6（PouchDB側 `console.log(err)` 握り潰し）: `DownloadRecord.checkLimitationAndRemove` の remove 失敗等は生きているが、握り潰し自体は best-effort 削除。`TrackedError` への配線は挙動変更で、効果薄。結論: 見送り。
- 項目9（Firefox `onDeterminingFilename`）: Chrome では正常（今回の実機で Downloads 画面・SW 正常起動）。Firefox は低優先のユーザー方針で保留。

## Verification

- `yarn test`: **6 suites / 29 tests passed**（新規 `Downloader.spec.js` 3件・`HistoryRepo.spec.js` 2件・`Request.spec.js` 3件。Time 数秒）。うち `Downloader.spec.js` のエラー経路テストは、修正前のコードで `ReferenceError: errorMessage is not defined` を再現し（項目16の実バグ確定）、修正後を通ることを確認済み。
- `yarn build`（Chrome・production）: **exit 0**（Time 10.4s。ERROR/Module not found なし）。`dist/chrome` 再生成。
- Chrome 実機（chrome-devtools MCP・extension id `nccfhdinjmbjnlgnmmgglmenmaacgagf`）: 再ビルド後 `install_extension` → `reload_extension`。`options_page/downloads.html#/` が **console error/warn ゼロ**でロード、Service Worker `sw-6` が起動し `chrome.runtime.getManifest().version`=6.4.3・`declarativeNetRequest`/`runtime` が object（評価で確認）。→ Request/Downloader/履歴系/config/Application/Bootstrap の変更がロード・boot を壊していないことを確認。
- **実DL未実施**: pixiv ログインと複数枚/漫画の操作が必要で、この場では完了できていない。とくに項目17（実効同時1）・項目2b・項目11（漫画フォルダ名）・項目3（履歴重複が実データで止まるか）はブラウザ操作の目視確認が要る。`chrome-devtools` は最後に開いている page を閉じられない制約があり、page 15（about:blank）と拡張 service worker は開いたまま（MCPにブラウザ終了操作なし）。次回以降の手動/スクリプト後始末が必要。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
