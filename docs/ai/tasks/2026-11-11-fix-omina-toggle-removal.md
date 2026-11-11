# showPixivOmina設定トグル削除（デッド設定）

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: InterfaceOptions.vue entry/watch/data + default.js:203 削除→yarn test/build→画面確認（設定画面）→Drive保存→コミット

## 意図 / 背景

forkでPixiv Omina表示ブロック削除済みのため、設定画面の `showPixivOmina` トグルはデッド設定（ONにしても表示されない）。表示初期 data 値 true が fork 既定 false と食い違い、保存値のない端末では ON に見える。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目1（優先1）
承認範囲: `src/options_page/components/options/InterfaceOptions.vue`（showPixivOmina の v-list-tile、watch、data、created割当）と `src/config/default.js` の showPixivOmina key（203）削除。範囲外変更不可。

## Verification

合格条件: `yarn test` / `yarn build` 通過、設定画面でトグル消去と周辺レイアウト崩れなしの画面確認。保存: `I:\マイドライブ\kilo\2026-11-11-fix-omina-toggle-removal\`（playwright-confirmation-rule の保存規則、chrome-devtools MCP、識別条件: コマンドラインに `C:\Users\fujim\.cache\chrome-devtools-mcp\chrome-profile` を含む chrome.exe）。画面確認不可なら未検証扱い（合格しない）。項目終了時に開いたpageを閉じる。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
