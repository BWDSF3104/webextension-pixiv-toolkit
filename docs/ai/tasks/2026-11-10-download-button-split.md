# ダウンロードボタン改修: ボタン分割（フォルダ展開 / 画像別保存）

**Status**: 完了
**Date**: 2026-11-10
**Next Action**: 段階3解消(2026-11-10 05:01 常時表示/すべて承認)。残工程: adapter透過4行(IllustAdapter 2関数+EpisodeAdapter+PostAdapter)→yarn test/build→画面再実測(A=work folder内ファイル単位/B=直下ファイル単位)→項目分コミット+push。試行回数2回目(上限3)

## 意図 / 背景

ダウンロードボタンを、挙動別に分割する:
- ボタンA: フォルダ展開（作業フォルダを作り画像をファイルとして保存）
- ボタンB: 画像別保存（画像ごとにファイル保存）

現状は単一的な `Download` ボタンで、zippack / folder 保存の分岐は設定（`downloadSaveMode`）でしか選べない。クリックごとに挙動を選べるようにする。

## 調査結果 / 変更内容

### 現状の構造（コード確認）

- content UI のボタン: `src/content_scripts/components/App.vue:14`（非ugoiraは1個の `Download` ボタン）→ `download()` → `getDownloadArgs()`（`App.vue:358`）の `options` → `download:addDownload` / `ContentPageDownloadManager.addTask`。
- `options` は `DownloadAdapter.createDownloadTask(resource, options)`（`src/options_page/modules/DownloadAdapter.js:62`）経由でタスクコンストラクタへそのまま流れる。追加フィールドは配線不要。
- 保存挙動の分岐はタスク実行時の `GlobalSettings()` 読み:
  - `shouldZipFile()`: `src/options_page/modules/DownloadTasks/MultiplePagesDownloadTask.js:134`
  - `dontCreateWorkFolder()`: 同 `:144`
  - 画像ごと保存（zip の場合 zip.file、folder モードの場合 `download:saveFile` を画像単位）: `onItemFinish` 同 `:161-198`
  - zip 生成は `onFinish` 同 `:236-268`（zip モードのみ）
- 設定: `downloadSaveMode`（`src/config/default.js:263`、0=zip / 1=folder）、`globalZipMultipleImages`（1=常にzip/2=複数page/3=複数ファイル）、`dontCreateWorkFolder`（1-3）。
- つまり「フォルダ展開保存」「フォルダなしで画像ごとに保存」の挙動自体は既存設定にあり、欠けているのはクリック単位の選択（タスク単位 override）とボタン。

### 最小実装案（実装開始指示後）

1. `MultipleDownloadTaskOptions` に `saveMode` override 追加（undefined=設定follow）。`shouldZipFile()` / `dontCreateWorkFolder()` の先で override を見る。約4〜6行。
2. `App.vue` の非ugoiraボタンを2個へ分割: `@click="download({ saveMode: 'folder' })"` / `@click="download({ saveMode: 'perImage' })"`。ラベルは `tl()` で en / zh_CN 両ロケールへ追加。
3. override 分岐は新ロジックなので jest spec を1本（`shouldZipFile` / `dontCreateWorkFolder` の override 判定）。
4. Ugoira は既存の换算ボタン別（UgoiraDownloadTask は単一換算ファイル生成）なのでスコープ外とする — 要確認。

### 使用条件の補足（2026-11-10 04:53 ユーザー）

- A: 複数枚作品用 → Aの表示は画像が2枚以上のときだけ（Bは常時表示）。
- B: どのタイプでも使用 → adapter透過の承認範囲を Illust/Manga（IllustAdapter）、PixivComic（EpisodeAdapter）、Fanbox（PostAdapter）へ拡張。Novel/Ugoira は単一ファイル生成のためBの効果=現状（直下保存）と等価、変更なし。
- 判定ロジック（MultipleDownloadTask）は4タイプ共有で既存specがカバー。追加はadapterの `saveMode` 透過1行×4関数（IllustAdapterはillust/mangaの2関数）+表示条件1行（App.vue: pages>=2でA表示）。

### 承認（2026-11-10 04:20 ユーザー「推奨で承認」）

- 2ボタンの意味・クリック単位の override・Ugoira スコープ外：すべて推奨案どおり承認。
- decision: `docs/ai/decisions/2026-11-10-download-button-split-design.md`

### 実行結果（2026-11-10 子委譲）

- 承認設計どおり実装: `MultipleDownloadTaskOptions.saveMode`（undefined=follow）、`shouldZipFile()` / `dontCreateWorkFolder()` 冒頭の override 判定、`App.vue` 非ugoiraボタン2分割（`download({ saveMode: 'folder' })` / `download({ saveMode: 'perImage' })`）、en/zh_CN ロケール（`_download_to_folder` / `_download_per_image`）、新規jest spec。
- **実コードとの食い違い（実施せず、持ち帰り）**: 委譲文の前提「配線（DownloadAdapter→タスクoptions）は既存のoptions透過を利用する」は実コードで成立しない。`IllustAdapter.createIllustDownloadTask`（`src/options_page/modules/DownloadAdapters/Pixiv/IllustAdapter.js:51-65`）がタスクoptionsを新規objectとして構築し `options.selectedIndexes` しか透過せず、`saveMode` が失われる（manga側 `createMangaDownloadTask` も同じ）。unit spec通過（override判定は正しい）に対し、実測では両ボタンとも設定follow（ZIP保存）。配線1行の追加は承認範囲外ファイルの変更になるため段階3として持ち帰った（parent裁定待ち）。
- 画面確認で `downloadMode=2`（新モード=App.vue）が必要。委譲プロファイルの実設定は `downloadMode=1`（legacy）であり、確認のため一時変更し、確認後に元の値1へ復元（段階1、根拠: UIApplication.js:83 のrender条件）。
- 試行回数: 1（不合格原因分析完了。修正は承認範囲外のため実施せず未解決）。

### 未確定（ユーザー確認 needed）

- 2ボタンの正確な意味: 「フォルダ展開」=work folder+画像ファイル保存、「画像別保存」=work folderなしで画像ごとに直接保存という解釈（推奨）。もう一方の解釈: 画像ごとに Chrome ダウンロード項目として1件ずつ出す（folder モードでは現状 already 画像ごとに saveFile=1 download item）。
- override はクリック1回分のみ（設定は変更しない）という前提。
- 並行タスク: `2026-11-10-mv3-chrome-basic-function-audit.md` が実装開始指示待ちで進行中。

## 合格条件と検証方法（委譲実行）

- `yarn build`（Chrome）と `yarn test`（jest）が通過。新規 spec に override 判定を含む。
- 画面確認: ユーザー指示（2026-11-10 04:22）により手順の「Playwright」は Chrome MCP（chrome-devtools MCP）へ読み替え。before/after スクリーンショットと確認 txt を `playwright-confirmation-rule` の保存規則（`I:\マイドライブ\kilo\2026-11-10-download-button-split\`）で残す。ボタンA/Bそれぞれの操作前後（download実行 → 保存結果の表示）を記録。
- 画面確認ができない項目は未検証扱い（合格しない）。ブラウザは項目終了時に閉じる（chrome-devtools MCP にブラウザ終了操作がない場合はその旨と理由を結果に残す）。
- ブラウザ本体の識別条件（実プロセス確認で確定）: コマンドラインに `C:\Users\fujim\.cache\chrome-devtools-mcp\chrome-profile` を含む chrome.exe（MCPサーバー本体の cmd/node は除く）。委譲前に残存あり（監査時からのブラウザ）。

## Verification

- `yarn test`（2026-11-10）: 2 suites passed / 11 tests passed（新規 `test/MultiplePagesDownloadTask.spec.js` 4 tests: override 'folder'=follow無視で no-zip+work folder / override 'perImage'=no-zip+no work folder / 未指定=zip follow / 未指定=folder mode dontCreateWorkFolder=2 follow。既存 pathjoin spec 7 tests 通過。Time 2.14s）。
- `yarn build`（chrome, 2026-11-10）: 成功（webpack 4.46.0、15.84s、警告は既存のasset size limitのみ）。
- `jest.config.json` 変更理由: specがテスト対象の `@/` alias importを持つため、`moduleNameMapper`（`^@/(.*)$` → `<rootDir>/src/$1`）が必要（既存test setupにalias解決なし。spec実行に必要な最小plumbing。既存spec結果に影響なし）。
- 画面確認（Chrome MCP、Playwright読み替え）: **不合格**。対象 artwork `151753981`（Illust type 0・2 page、ranking実測で選定。manga型は `onItemFinish` の `type !== 'PIXIV_MANGA'` 分岐でボタンBの意味が現れないためtype 0）。window size viewport 932x871（outer 945x1020・dpr 2）、同一取得方法・同一被写体範囲。before/after（ボタンA/Bそれぞれの操作前→click→操作後）4枚 + 確認txt を `I:\マイドライブ\kilo\2026-11-10-download-button-split\` へ保存（local copyは `kilo-safe-remove` でゴミ箱）:
  - `artwork-151753981-buttonA-before-20261110.png` / `artwork-151753981-buttonA-after-20261110.png`
  - `artwork-151753981-buttonB-before-20261110.png` / `artwork-151753981-buttonB-after-20261110.png`
  - `button-split-confirmation-2026-11-10.txt`
- 実測保存結果（chrome.downloads search '151753981'）: `D:\Downloads_Desktop\151753981_隊員Oさん.zip` と `D:\Downloads_Desktop\151753981_隊員Oさん (1).zip`（state complete）— 両ボタンともZIP=設定follow（downloadSaveMode=0・globalZipMultipleImages=1）。合格条件（work folder内ファイル単位/直下ファイル単位）を満たさない。不合格原因は `IllustAdapter` でのoptions構築（`saveMode`透過なし、IllustAdapter.js:51-65）。
- ブラウザ: chrome-devtools MCP既存ブラウザ使用（プロファイル`ぶるめ`）。開いたpageはdownload manager tab（page 2）をclose_pageで閉じた。page 1（artwork）は「最後に開いているpageは閉じ不可」のため残し（ブラウザプロセスそのものはMCPに終了操作なし、残存処理は親）。確認用一時変更 `downloadMode` は 2→1（元の値）へ復元済み。
- コミット: 未実施（画面確認不合格＝未解決のため保留。作業ツリーは変更を残して継続、parent裁定待ち）。

## 再確認（2026-11-10 05:41 ユーザー指示、実測）

- 畳んだ状態（既定、`autoActivateDownloadPanel=false`）: ボタンは非表示。snapshot上はテキストノードのみでclick toolは「not interactive」で失敗 → 畳んだ状態のままでは押せない。`#ptk__new-handler` clickで展開（class `ptk__container__body--collapse` → `ptk__container__body`）後、`DL per image` click成功。
- 再実測のB直下保存: `D:\Downloads_Desktop\p0 (1).jpg`・`p1 (1).jpg` complete（05:45Z）→ work folderなし直下ファイル単位（`(1)`接尾辞は同名ファイル存在のため）。
- 訂正: 05:19の報告で「直下ファイルが現在存在しない」としたのはlistingのフィルタ（artwork id名 filterで直下p0/p1を捕捉できず）の誤り。試行2のファイル（`p0.jpg`・`p1.jpg`・`p0.png`）は削除されておらず、現在も直下に残存（14:07・14:09）。work folder内のp0/p1も残存。
- 保存（Drive）: `recheck-151753981-buttonB-collapsed-before-20261110.png`（畳んだ状態・操作前）、`recheck-151753981-panel-expanded-after-20261110.png`（展開後）、`recheck-151753981-buttonB-after-20261110.png`（click後）、`recheck-confirmation-2026-11-10.txt`。local copyは `kilo-safe-remove` でゴミ箱。window size 932x871・dpr 2同一条件。
- downloadMode=2（App.vue表示のため一時変更）→ 確認後1（元の値）へ復元済み。
- ブラウザ: page 1（artwork）は最後に開いているpageのためclose_page不可（MCP制限）。識別条件一致のchrome.exeを5回の巡回（延べ76件、うち41件は親プロセス終了で既に消滅）で終了し、残存0確認。
- decision: `docs/ai/decisions/2026-11-10-collapsed-state-button-operation.md`。

### Select & DL 再実測（2026-11-10 06:11 ユーザー質問、実測）: **機能する**

- 対象: artwork 151753981（2page）。p1相当（`.ptk__page-preview` 2番目）を選択、dialog footerの `Download` をclick（uid snapshotはa11y非公開のため、evaluate_scriptで実DOM要素への実click＝Vueハンドラインデックスへイベントdispatch。window size 945x1020/viewport 932x871・dpr 2）。
- 実測: `D:\Downloads_Desktop\151753981_隊員Oさん (2).zip` complete（06:16:46Z）→ 展開確認でzip内容 `p1.jpg` のみ（選択反映OK、p0未保存）。download manager pageが開き（MV3で `ensureDownloadManagerOpen` 経路OK）、設定どおりzip保存（saveMode未指定のためglobal設定追従）。
- 保存（Drive）: `sd-select-before/mid/after-20261110.png`（before=選択前、mid=選択反映、after=Download click後）、`select-dl-recheck-20261110.txt`。local copyは `kilo-safe-remove`。pageはclose済み（download manager page含む）、chrome.exe残存0確認。downloadMode 2→1復元済み。
- 補足: 分割ボタン（A/B）もpage-selectorの選択状態を反映する（`pageSelectorSelectHandler` → `getDownloadArgs` の `selectedIndexes`）。

### 試行2（2026-11-10 05:03 委譲、裁定反映）: **合格**

- 正典矛盾の記録: 本記録04:53の「A表示=2枚以上」条件は05:01裁定「常時表示（枚数条件なし）」に置換（新しい文書を優先）。実装（App.vue）は常時表示で裁定と一致、削除する表示条件はなし。単発作品でA=work folder内1ファイル（=Bとの差）を単発実測で確認。
- adapter透過4行（承認範囲どおり、既存フィールドコピーの流儀）: `IllustAdapter.js`（createIllustDownloadTask・createMangaDownloadTaskへ `saveMode: options.saveMode`）、`EpisodeAdapter.js`、`PostAdapter.js`。Novel/Ugoira変更なし。
- `yarn test`: 2 suites / 11 tests passed（既存維持、Time 1.937s）。`yarn build`（chrome）: 成功（ERRORなし、14:05-14:06、既存警告のみ）。
- 画面確認（新instance、拡張id `nccfhdinjmbjnlgnmmgglmenmaacgagf` を dist/chrome からinstall、window size viewport 932x871・dpr 2・同一取得方法、before/after 6枚+txtをDriveへ、local copyゴミ箱）: `I:\マイドライブ\kilo\2026-11-10-download-button-split\` の `wired-artwork-151753981-buttonA-before/after-20261110.png`、`wired-artwork-151753981-buttonB-before/after-20261110.png`、`wired-single-151883880-buttonB-before/after-20261110.png`、`wired-confirmation-2026-11-10.txt`。
- 実測（chrome.downloads search・state complete・ディスクLastWriteTime）:
  - A（2page illust 151753981）: `D:\Downloads_Desktop\151753981_隊員Oさん\p0.jpg`・`p1.jpg`（14:06:56）= work folder内ファイル単位 ✓
  - B（同）: `D:\Downloads_Desktop\p0.jpg`・`p1.jpg`（14:07:28）= 直下ファイル単位（work folderなし） ✓
  - B（単発1枚 151883880）: `D:\Downloads_Desktop\p0.png`（14:09:37）= 直下1ファイル ✓、2ボタン常時表示 ✓
  - 不合格条件（ZIP保存/A直下/B folder内）発生せず。テスト用実ファイルは実測証拠として保持（削除は `kilo-safe-remove`）。
- downloadMode=2（App.vue描画条件）への一時変更→確認後1（元の値）へ復元。試行回数は項目全体で試行2（上限3内）。ブラウザプロセスは閉じられず（MCPに終了操作なし、page 2閉じる・page 1は最終pageのため閉じ不可、残存処理は親）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
