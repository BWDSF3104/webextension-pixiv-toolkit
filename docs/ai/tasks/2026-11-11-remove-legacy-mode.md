# レガシーモード廃止（常にA/B 2 button表示）

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: 委譲: UIApplication.js render常時App（条件削除）、DownloadOptions.vue mode設定tile+DownloadMode.vue削除、AppLegacy.vue削除、fork label 2key（en/zh_CN/ja）削除、default.js downloadMode key削除→yarn test/build→画面確認（既存プロファイルdownloadMode=1保存のままA/B表示、optionsにmode設定なし）→Drive保存→単独コミット+push

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
- `Application.js` のonChanged（downloadMode比較）は変更しない（設定UI消失で発火不能、無害）
- `PageSelector` は `App.vue` 経由で維持（dialog footer 2行契約不変）

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
