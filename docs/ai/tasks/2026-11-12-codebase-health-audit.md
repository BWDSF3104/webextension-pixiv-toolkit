# 拡張機能の改善点・不安定点・非効率点の調査

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: 調査・報告完了。実装は指示を受けてから個別タスク化。高severity候補は項目1（Downloader同時数管理）と項目2（DLのメモリ/base64往復）

## 意図 / 背景

上流由来のコード全体を対象に、改善・不安定・非効率の候補を静的調査で洗い出す。
既知のMV3破損（`2026-11-10-mv3-chrome-basic-function-audit` / KI-20261110-06）は再列挙しない。
本タスクは調査のみ。実装はユーザーの開始指示後に着手。実行時確認は未実施（静的解析のみ）。

## 調査結果 / 変更内容

静的解析のみ。各項目の severity は「利用者への影響 × 発現概率」の主観。実行時再現は未実施（Verification 参照）。

### 高（機能に直結）

1. **Downloader のダウンロード同時数管理が破損** — `src/modules/Net/Downloader.js:74`
   `removeDownloadFromCollection` が `this.downloadFilePorts = this.downloadFilePorts.splice(i, 1)` と代入している。`Array.prototype.splice` の返り値は「削除した要素の配列」で「残り」ではないため、完了毎に `downloadFilePorts` が `[完了直後のport]` に置換され、他 port の参照を失う（port は orphan 化・`disconnect` されずリーク気味）。
   派生して `:129` の `downloadFilePorts.length < processors`（既定 processors=3）が常に狂い、同時数が過剰になったり、processors=1 環境では1枚目完了後に次が開始されず多重ダウンロードが停止しうる。デフォルトの3枚同時経路（Ugoira・Manga・MultiplePages・PixivComic）で状態が不定。
   修正案は1行: `const i = this.downloadFilePorts.indexOf(download); if (i > -1) this.downloadFilePorts.splice(i, 1);`。`finish` の判定は `downloadFiles` の shift 完走なので、ファイル自体は出ても内部カウンタが壊れている。

2. **ダウンロードのメモリ/CPU効率が極端に悪い** — `src/modules/Net/Request.js:49-81` / `Download.js:31` / `background/services/DownloadFileService.js:61-68` / `Downloader.js:178-216`
   取得毎に `response.body` をチャンク単位で `value.forEach(char => this.responseData.push(char))` して素配列に全バイトを詰めている（数MB画像で数百万回の push → GC 圧）。さらに `DownloadFileService` が `FileReader.readAsDataURL` で base64 化（+33%）→ `postMessage` → 受けた `Downloader` が `fetch(dataURL)` → `response.blob()` で blob を復元。
   1ファイルに対し「チャンク蓄積 → Uint8Array → Blob → base64文字列 → 構造化クローズ → dataURL fetch → blob」と複数回コピー。構造化クローンでは ArrayBuffer を直接送れるので base64 往復は不要。CSP 的に `blob:` worker が不可な MV3 の制約は理解できるが、base64 往復は設計選択。
   ついで `:75` の `dispatch('onprogress')` はチャンク毎。大きなファイルで UI 更新が頻発。`response.ok`（HTTPステータス）をどこも見ず、403/404 本文を正常データとして蓄積しうる（pximg hotlink と相性悪い）。

### 中

3. **履歴の重複登録** — `src/modules/Db/Repository/AbstractRepo.js:43-45` / `HistoryRepo.js:66`
   `getItem(equals)` は `this.table.get(equals)` を呼ぶが、Dexie の `get()` は主キーしか引けない。`HistoryRepo.saveItem` は `getItem({ uid })` で既存照会するため常に `undefined` → 毎回 `addItem` され、`uid` 重複排除が効かず `histories` に重複行が溜まる（または無効キーで query が reject して保存失敗）。正しくは `table.where('uid').equals(uid).first()`。
4. **履歴検索が全件JSスキャン & null落ち** — `AbstractRepo.js:69-80`
   `searchItems` は `table.reverse().filter(...)` で上限 maxHistoryItems（既定 10000）を毎回JSで総当り。かつ `item.title.indexOf(query)` を無ガードで参照（`userName` はガード済み、`title` は未ガード）→ title 欠損レコードで TypeError。検索は毎回発火する（History.vue）。
5. **AssetCache が書込毎に全件読込** — `src/repositories/AssetCache.js:22-40,43`
   `putAsset` が毎回 `checkLimitationAndRemove()`（fire-and-forget）を呼び、`db.allDocs()`（全 doc id 取得）→ 条件により `db.find` ソート全スキャン。書き込みN件で O(N²)。しかも削除処理は await されず失敗が silent。
6. **DB側のエラー握り潰し** — `repositories/DownloadRecord.js:58` / `AssetCache.js:34` / `IllustHistory.js:116-126`（コメント化）
   PouchDB の changes feed / remove 失敗を `console.log(err)` のみで握り潰し。失敗しても後続が成功扱いで進む（記録不整合が静かに溜まる）。`TrackedError` 機構があるのに履歴/DL記録系では使われていない。
7. **履歴の二重永続化（アーキテクチャ）** — PouchDB `IllustHistory`（`repositories/IllustHistory.js`・`modules/Ports/IllustHistoryPort/BackgroundPort.js`）と Dexie `histories`（`modules/Db/Db.js`・`HistoryRepo.js`）の2系統が履歴を持つのを併存。どちらが正でどちらがレガシーかの整理が必要（要調査）。
8. **content script の重たい vendor を全ページ注入** — `src/statics/manifest.json:64-76`
   `vue.min.js`/`vue-i18n.min.js`/`locales.js`/`jszip`/`gif.js`/`whammy.js`/`js-epub-maker*` を `www.pixiv.net/*`・`*.fanbox.cc/*`・`comic.pixiv.net/*` の全ページへ同期注入。epub 生成や ugoira GIF 用ライブラリは特定操作時のみ必要で、普段の閲覧でも毎回ロードされる。on-demand 化余地。

### 低（掃除・見つけにくい不具合）

9. **Chrome専用APIを無ガードで購読** — `background/services/DownloadService.js:34`
   `browser.downloads.onDeterminingFilename` は Chrome のみ。Firefox では未定義で `addListener` が throw、`getService('Download')`（`Application.js:93`）→ SW boot が壊れる可能性。Firefox ビルドでの実挙動は未確認。
10. **`onInstalled` のパラメータ shadowing とデバッグ残し** — `Application.js:125-128`
    引数 destructuring の `previousVersion` を本体で `let previousVersion` 再宣言、かつ `console.log(arguments)` が本番 SW に残る。引数経由の更新分岐は dead。
11. **rename rule のタイプミス** — `config/default.js:221` `mangaRenameRule: '{id}_{title}}'`（`}` が1個多い）→ 産出ファイル名に余分な `}` が付きうる。実害は NameFormatter の unmatched `}` 挙動次第。
12. **本番 console.log** — `update6_0_0.js:89-90`（settings を出力しうる）、`AbstractPortService.js` の `boradcast`（つづり）、`Bootstrap.js:19` の `console.log(event, arguments)`（arrow 内の `arguments` は bindEvents のもの）。
13. **Retryer の sync 時 void 返却** — `Manager/Retryer.js:16-34` `runProcess` は `process()` が Promise でないとき暗黙 `undefined` を返し、呼び出し側の `.then` 想定と不整合。
14. **Queue の O(N²)** — `modules/Queue.js:95` 完了毎に `stack.filter(...)`。大枚数で無駄。`setProcessors` 前の `parseInt` 失敗で `NaN` 化しうる（`:95` の `fail` 判定と相まって onDone 不发火の余地）。
15. **未使用/宣言外・死蔵** — `ScriptInjector`（`tabs.executeScript` 廃止済み・呼び出し箇所なし）、`Notification`（permission 未宣言）、`AbstractRepo.getItem` の誤用、`Downloader.js:232-330` の ~90行コメントアウト、`config/default.js` の多数 deprecated キー。`AbstractPortService.appendPort` の `throw new Runtime(...)` は message handler 内 throw → SW を巻き込みうる（`Runtime` が Error 派生か要確認）。

## Verification

- 手法: 静的解析のみ（grep + 読み合わせ）。実行時再現は未実施。実行時確認は Chrome DevTools MCP が必要で、各項目の再現手順は本タスク未定義。
- 根拠の file:line は各項目に記載。うち項目1（splice）・3（getItem）・8（manifest）・11（type）はコード読解だけで確度高。項目2（base64往復）・9（Firefox onDeterminingFilename）・10（shadowing の parse 可否）は実行時/ビルド確認で断定が要る。
- `yarn build` / `yarn test` は本調査では未実行（コード変更なし）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
