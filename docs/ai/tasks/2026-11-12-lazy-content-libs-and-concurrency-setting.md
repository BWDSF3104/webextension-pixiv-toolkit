# content script注入削減(item8)と同時接続数の設定有効化(item17)

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: manifestからEpubMaker+jszip-utils削除、downloadNextをprocessorsまで補充ループ化、テスト更新、build+test

## 意図 / 背景

観測で確定した item 8（content script が全 pixiv ページに約1093KB注入、うち on-demand 専用ライブラリ約540KB）と item 17（`downloadTasksWhenDownloadingImages` が `downloadNext` の設計上 1 に固定され不発）のうち、**安全に改善できる範囲**を実施する。①=content script に毎回注入される未使用ライブラリの除去。②=既存設定を有効化し同時接続数をユーザーが切り替えられるようにする。Chrome 挙動を壊さないこと。

## 調査結果 / 変更内容

### ① content script 注入から EpubMaker 系を除去（item8 の一部・安全な分のみ）
`src/statics/manifest.json` の `content_scripts.js` に `lib/jszip/jszip-utils.min.js`・`lib/js-epub-maker/js-epub-maker-idpf-wasteland-template.js`・`lib/js-epub-maker/js-epub-maker.js` が毎回注入されていた。grep で **content_scripts に EpubMaker / JSZipUtils の参照ゼロ**（`EpubMaker` は webpack `externals` 宣言のみでバンドルコード未参照＝inert、novel EPUB は options 側 `NovelDownloadTask` が使用）。`options_page/index.html` は EpubMaker を読んでおらず novel EPUB は MV3 で既に不発＝content 側は完全なデッド重み。→ 3エントリを除去。
- 削減: js-epub-maker 64.5KB + idpf-wasteland-template 7.4KB + jszip-utils 1.75KB ≈ **約74KB/ページ**。
- **jszip/gif/whammy は content_scripts の ugoira 変換（GifGenerator/WebmGenerator/ApngGenerator）が実際に使う**ため残置（MV3 content script の dynamic import は webpack4 JSONP だと web_accessible_resources / main-world 問題で高リスク。①の「安全な分」に含めず観測のみ保留）。

### ② 同時接続数の設定を実際に効かせる（item17）
- 調査: `processors` は既に `GlobalSettings().downloadTasksWhenDownloadingImages`（既定3）から各 DownloadTask が渡しており、設定UIも `DownloadOptions.vue:30` に既にある。不発の原因は `Downloader.downloadNext()` が1件ずつ shift・開始し、完了時にのみ1件補充する設計だったため。
- 変更: `src/modules/Net/Downloader.js` `downloadNext()` を **`processors`（0以下なら1にガード）まで補充する while ループ**に変更。`downloadFile()` は同梱で `downloadFilePorts.push` するため確実に見積もり、完了/エラーの splice＋再帰でスロットを補充。`finish` は**キューと進行中portが両方空の時だけ**発火（同時進行時に早発火しない）。
- 効果: 既存の「設定→ダウンロード→同時接続数」が実際に効く（**既定3で実効1→3**）。pixiv のレート制限が気になるユーザーは設定を1にすれば従来の優しい挙動を維持できる。

### テスト（test/Downloader.spec.js）
旧テストが「downloadNextは1件ずつ開始」＝item17バグを固定していた。①**processorsまで同時に開始＋失敗port除去で待機ファイルを補充**（errorMessage文字列経路の crash 回帰防止も継続担保）、②**processors を越えて開始せず、全消化まで finish を発火しない**、の2件に更新・追加。

## Verification

- `yarn test`: **6 suites / 30 tests 合格**（Downloader 4件）。
- `yarn build`(chrome)・`yarn build:firefox`: 双方 exit 0（サイズ warning のみ、エラーなし）。
- ビルド済み `dist/chrome/manifest.json` の content_scripts js に epub/jszip-utils が**存在しない**ことを PowerShell で確認（一致0件）。残存 js は global/vue/vue-i18n/locales/jszip/gif/whammy/app.js。
- Chrome 実機: `reload_extension`→pixiv 作品ページ再読み込み。コンソールの error は pixiv 自広告スクリプト（prebid/browsingTopics 非推奨）のみで**拡張由来の未定義エラー（JSZipUtils/EpubMaker 等）はゼロ**。`wait_for` で拡張 DL パネル（フォルダへ DL/画像ごとに DL/選択＆DL）の再マウントを確認 → content script は lib 削減後も正常起動。
- 未確認: ②の**実際に画像を複数枚ダウンロードして pximg への同時fetchが3になること**は未実測（UI操作/ディスク副作用のため）。ロジックはテストで担保、設定経路（DownloadOptions→GlobalSettings→processors）は調査で確認済み。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
