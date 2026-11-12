# 承認済み静的調査項目のうちChrome非破壊の修正

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: 項目1/2a/3/4/11 実装完了・yarn test(24)/yarn build 合格。残件（別枠・要実行時確認）: 項目2b(base64往復削除)・3の実データ移行・5(AssetCache O(N²))・6(DBエラー握潰)・7(履歴二重系統)・8(manifest lazy-load)・10(onInstalled shadow)・12以降(掃除系)。Firefox関連は低優先で保留。

## 意図 / 背景

静的調査（`2026-11-12-codebase-health-audit`）の指摘のうち、ユーザー承認済み。ただし Firefox は低優先、Chrome 動作を最優先、修正が Chrome に影響しないことを条件。
本タスクでは「Chrome の意図した挙動を変えない安全な修正」を適用し、`yarn test` + `yarn build` で検証する。実行時確認が要る高リスク項目（base64往復削除・履歴二重系統・manifest lazy-load・AssetCache O(N²)・onInstalled shadow）は本タスク外（要別枠）。

## 対象（本タスクで修正）

- 項目1: `Downloader.removeDownloadFromCollection` の splice 誤用（同時数管理の破損）
- 項目2a: `Request.readData` のバイト毎蓄積 → チャンク連結へ（出力バイトは同一・メモリ/速度のみ改善）
- 項目3: `HistoryRepo.getItem` を uid 照会へ上書き（履歴の重複排除を復旧）
- 項目4: `AbstractRepo.searchItems` の `item.title` null ガード
- 項目11: `config/default.js` の `mangaRenameRule` 末尾タイポ `}` 除去（＋同挙動を検証していたテスト更新）

## 調査結果 / 変更内容

（下段に実装結果を追記）

変更ファイル（5 src + 1 test + 2 docs）:

- `src/modules/Net/Downloader.js:73-78` `removeDownloadFromCollection`: splice の返り値代入をやめ、`indexOf`→`splice(index,1)` の破壊操作に変更（同時数管理の参照喪失を解消）。Chrome挙動: 完了毎にactive接続数が正しく減り、既定3同時が正しく効く。多重DLの停止リスクを除去。既存の正常DL挙動は維持。
- `src/modules/Net/Request.js:20` `responseChunks` 追加、`:49-90` `readData` のarrayBuffer分岐をバイト毎push→チャンク配列蓄積へ変更、`:78-88` `concatResponseChunks`（onload時に1つのUint8Arrayへ連結）追加、`:110-113` send初期化を`responseChunks=[]`へ。出力バイト列は従来と同一（`plain`分岐とondata/onprogress/onload契約は不変）。
- `src/modules/Db/Repository/HistoryRepo.js:43-50` `getItem(equals)` を `where('uid').equals(equals.uid).first()` で上書き。`uid`重複排除が復旧し履歴の重複行増加を停止（既存重複行はそのまま）。呼び出し元4箇所（HistoryService/History/options DownloadService/内部saveItem）はいずれも`{uid}`を渡す経路のため波及なし。
- `src/modules/Db/Repository/AbstractRepo.js:71` `searchItems` の `item.title` を null ガード。title欠損レコードでのTypeErrorを解消。検索の総当り性は維持（要別枠最適化）。
- `src/config/default.js:221` `mangaRenameRule` の末尾 `}` を除去。新規インストールのみ影響（既存ユーザーはstorage値のまま。update移行は対象外）。
- `test/renameRules.spec.js:93-101` 上記タイポ挙動を検証していたテストの期待値を `123_タイトル/p0.jpg`（余分な`}`なし）へ更新。
- `test/Request.spec.js`（新規）`readData` のチャンク再構成を3テスト（分割byte順・空応答0バイト・plain連結）。

## Verification

- `yarn test`（jest）: **4 suites / 24 tests passed**（Time 3.6s）。新規 `Request.spec.js` 3件含む。既存renameRules/pathjoin/MultiplePagesすべて維持。Time 3.6s / yarn test 完了 5.88s。
- `yarn build`（Chrome・NODE_ENV=production）: **成功 exit 0**（Time 16.5s）。既存の asset size limit WARNING のみで ERROR なし。
- 実行時（Chrome実機）: **未実施**。項目1（複数枚DLの同時数）・項目3（履歴重複抑止）・項目11（漫画フォダ名）はブラウザ操作での目視確認が要るが、本タスクではjest+build検証まで。項目2aは出力バイト同一を unit で担保。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
