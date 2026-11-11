# AppSuggest削除（Test.vue参照＋component）

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: before（Test route表示）→Test.vue block/import/登録/pixivOminaIcon削除＋AppSuggest.vue kilo-safe-remove→yarn test/build→残存grep 0→after画面→Drive→単独コミット+push→task end

## 意図 / 背景

ユーザー指示（2026-11-11 09:49）「消す。消したあと機能に影響ないか確認」。forkでOminaは不要（decision `2026-11-10-ui-label-distinction-and-pixiv-omina-hidden.md`、設定画面カードは項目 `2026-11-11-settings-audit` で削除済み）。残る参照はTest.vue（debug route）の表示例のみ。

## 調査結果 / 変更内容

承認範囲:
- `src/options_page/components/Test.vue`: app-suggest block（9-18）、import（38）、components登録（44）、data `pixivOminaIcon`（50）削除
- `src/options_page/components/AppSuggest.vue`: `kilo-safe-remove`（参照消滅で完全dead）
- 影響確認: `yarn test`、`yarn build` exit=0、AppSuggest/pixivOminaIcon残存参照grep 0、Test route表示確認（cacheable-image・Debug actions・Debug Request moduleが健在であること＝Test pageの他機能への影響なし）

## Verification

- before: Test route（`index.html#/test`）表示（app-suggest表示例あり）→ `I:\マイドライブ\kilo\2026-11-11-remove-app-suggest\`（同一window・full page）
- after: 削除後Test route（表示例消滅＋Test page其余機能表示）＋確認txt。local copy `kilo-safe-remove`、chrome-profile条件一致chrome.exe終了（残存0）
- 合格後 `task_manager --root S:\Documents\Kilo_Commons\webextension-pixiv-toolkit end --task docs/ai/tasks/2026-11-11-remove-app-suggest.md`。code分単独コミット+push、記録分単独コミット+push

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
