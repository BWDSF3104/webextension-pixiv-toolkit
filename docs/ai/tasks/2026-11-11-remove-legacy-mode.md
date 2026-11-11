# レガシーモード廃止（常にA/B 2 button表示）

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: 持ち帰り(段階3): NewSettings.vueがDownloadMode.vueをstatic import(14/25/35行)。ファイル削除+残存参照0の合格条件は承認範囲内の修正で成立せず、yarn buildはmodule not foundでfail。実装せず作業ツリーは委譲前状態(記録更新除くclean)。親の追加承認(Import/登録/template使用の削除)後にVerification実行

## 意図 / 背景

ユーザー裁定（2026-11-11 08:16）「レガシーモードはいらない。ややこしいだけ」。設定によらずA/B 2 buttonが常時表示が正常、との裁定（直前08:14）。単一「設定追従」buttonはlegacy mode由来で、forkの2 button分割は manager mode（App.vue）のみ実装だったため、既存プロファイル（downloadMode=1保存）では1 buttonだけ見えていた。decision `docs/ai/decisions/2026-11-11-remove-legacy-mode.md`。

## 調査結果 / 変更内容

基線: HEAD `63ad5e3`（clean、scratch除く）。
承認範囲（削除・置換）:
- `src/content_scripts/UIApplication.js`（import AppLegacy削除、render条件 `downloadMode === 2 ? App : AppLegacy` → `h(App)`）
- `src/options_page/components/options/DownloadOptions.vue`（download-mode-option tile、DownloadMode.vue import/登録、data downloadMode、created割当、`v-if="downloadMode === 2"` のmax-process tileの条件削除＝常時表示）
- `src/options_page/components/options/option-items/DownloadMode.vue` 削除（`kilo-safe-remove`）
- `src/content_scripts/components/AppLegacy.vue` 削除（`kilo-safe-remove`）
- `fork_legacy_download_label`・`fork_ugoira_zip_label` を en/zh_CN/ja の messages.json から削除（適用先消滅）
- `src/config/default.js` の `downloadMode` key 削除
- `src/options_page/components/NewSettings.vue`（拡張承認・2026-11-11 08:21 親判定、根拠: `DownloadMode.vue` の残存呼び出しは NewSettings.vue:14（template `<download-mode>`）/25（import）/35（components登録）のみ。削除成立にこの3箇所削除が必要。上流key `_legacy`/`_download_manager` は削除しない（上流ロケール・デッドkeyは無害））
- `Application.js` のonChanged（downloadMode比較）は変更しない（設定UI消失で発火不能、無害）
- `PageSelector` は `App.vue` 経由で維持（dialog footer 2行契約不変）

承認範囲と実コードの矛盾（2026-11-11 子実行、実装前確認で発見・実装せず持ち帰り）:
- `src/options_page/components/NewSettings.vue`（承認範囲外）が `option-items/DownloadMode.vue` を static import（line 25・登録 line 35・template使用 line 14）。build graph: options page `Index.vue` → `UpdateNotice.vue` → `NewSettings.vue` → `DownloadMode.vue`。item3のファイル削除と合格条件「DownloadMode残存参照0」は NewSettings.vue の3箇所変更なしに成立せず、`yarn build` は module not found でexit≠0。承認範囲内の修正方法では合格不能 → 段階3持ち帰り（最小追加承認: NewSettings.vue import/登録/template使用の削除）。
- fork label 2keyの参照元は `AppLegacy.vue` と messages.json（en/zh_CN/ja）のみを確認（rg照合）。AppLegacy削除でkey削除は整合。
- 基線の矛盾: タスク記録の「基線 63ad5e3」と委譲文（parent記録 08:18）の HEAD f31b085 が食い違う。新しい文書（委譲文）を優先し、実測で `git rev-parse` = f31b085・clean（untracked scratch/ のみ）を確認。この旨を記録。

## Verification

- 合格条件: `yarn test`（jest）通過、`yarn build`（chrome）exit=0、AppLegacy/DownloadModeの残存参照0（grep照合）。
- 画面確認（chrome-devtools MCP、playwright-confirmation-rule、既存instance `nccfhdinjmbjnlgnmmgglmenmaacgagf`、既存値変更なし）:
  1. options page（Downloads）に「Download mode」設定がないこと。max-process tile表示（条件削除）
  2. artwork 151753981（storage downloadMode=1保存のまま）でA/B button（「DL to folder」「DL per image」）表示＝設定によらず2 button
  3. Select & DL dialog footer 2行契約（選択3＋download2＋close）維持
  before/after（before=変更前のoptionsとartwork、after=変更後）と確認txtを `I:\マイドライブ\kilo\2026-11-11-remove-legacy-mode\` へ保存（local copy `kilo-safe-remove`）。項目終了時にpage閉じる（最終page close不可の旨を残す）
- 合格後 `task_manager --root S:\Documents\Kilo_Commons\webextension-pixiv-toolkit end --task docs/ai/tasks/2026-11-11-remove-legacy-mode.md`。code分単独コミット+push、記録分単独コミット+push。commit prefix英語・説明日本語

### 実行結果（試行2: 合格）

- 実装（承認範囲＋NewSettings.vue 3箇所=拡張承認 bfa99d7）: `UIApplication.js` render常時 `h(App)`（import App削除済み側維持）、`DownloadOptions.vue`（tile・import・登録・data・created割当削除、max-process tile `v-if` 削除＝常時表示）、`NewSettings.vue`（14行template使用・25行import・35行登録削除）、`DownloadMode.vue`・`AppLegacy.vue` を `kilo-safe-remove`（ゴミ箱）、fork label 2keyを en/zh_CN/ja messages.json から削除、`default.js` の `downloadMode` key削除。`Application.js` は変更なし（承認範囲）。
- `yarn test`: 2 suites / 11 tests passed（2.1s）。`yarn build`（chrome）: exit=0。残存参照grep: AppLegacy=0・DownloadMode=0・削除key名=0（Application.jsのdownloadMode比較2箇所のみ残る＝変更しない旨の決定どおり、発火不能・無害）。上流key `_legacy`/`_download_manager` は削除しない旨どおり保持。
- 画面確認（chrome-devtools MCP・既存instance nccfhdinjmbjnlgnmmgglmenmaacgagf・既存storage値downloadMode=1変更なし=SW経由read-only照合、window size outer 945x1020 / inner 932x871 / dpr2 同一、options=viewport scrollY=0、artwork・dialog=full page 同一取得方法）:
  1. options Downloads: before=「ダウンロードモード」（従来）tile表示・max-process tile非表示／after=mode設定なし・max-process tile（3）常時表示 → 合格
  2. artwork 151753981: before=単一「ダウンロード（zip、設定に従う）」＋「選択＆DL」＋Legacy Modeバッジ／after=「フォルダへ DL」「画像ごとに DL」2 button＋「選択＆DL」、Legacyバッジなし → 合格（常時2 button）
  3. dialog footer 2行契約: before/afterとも 選択3（すべて選択・すべて解除・選択反転）＋download2（フォルダへ DL・画像ごとに DL）＋閉じる → 維持 合格
- Drive保存: `I:\マイドライブ\kilo\2026-11-11-remove-legacy-mode\`（options-before/after、artwork-151753981-before/after、dialog-footer-151753981-before/after、remove-legacy-mode-confirmation-2026-11-11.txt）。local copy（scratch/）はDrive保存後 `kilo-safe-remove` でゴミ箱へ送信。
- ブラウザ: 項目終了時に閉じた。最終page close不可のため識別条件（コマンドラインに `C:\Users\fujim\.cache\chrome-devtools-mcp\chrome-profile` を含むchrome.exe、MCPサーバー本体除く）のみ終了、残存0確認。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
