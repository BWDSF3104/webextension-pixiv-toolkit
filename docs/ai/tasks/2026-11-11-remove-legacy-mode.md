# レガシーモード廃止（常にA/B 2 button表示）

**Status**: 進行中
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

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
