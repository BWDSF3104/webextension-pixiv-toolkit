# showPixivOmina設定トグル削除（デッド設定）

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: InterfaceOptions.vue entry/watch/data + default.js:203 削除→yarn test/build→画面確認（設定画面）→Drive保存→コミット

## 意図 / 背景

forkでPixiv Omina表示ブロック削除済みのため、設定画面の `showPixivOmina` トグルはデッド設定（ONにしても表示されない）。表示初期 data 値 true が fork 既定 false と食い違い、保存値のない端末では ON に見える。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目1（優先1）
承認範囲: `src/options_page/components/options/InterfaceOptions.vue`（showPixivOmina の v-list-tile、watch、data、created割当）と `src/config/default.js` の showPixivOmina key（203）削除。範囲外変更不可。

## Verification

合格条件: `yarn test` / `yarn build` 通過、設定画面でトグル消去と周辺レイアウト崩れなしの画面確認。保存: `I:\マイドライブ\kilo\2026-11-11-fix-omina-toggle-removal\`（playwright-confirmation-rule の保存規則、chrome-devtools MCP、識別条件: コマンドラインに `C:\Users\fujim\.cache\chrome-devtools-mcp\chrome-profile` を含む chrome.exe）。画面確認不可なら未検証扱い（合格しない）。項目終了時に開いたpageを閉じる。

### 結果（2026-11-11）

- `yarn test`: 2 suites / 11 tests passed（3.88s）。`yarn build`（chrome）: exit 0 成功（基線39cc89dでも変更後も）。
- 画面確認（chrome-devtools MCP、window outer 945x1020 / inner 932x871・dpr2、人工resizeなし、before/after同一条件・full page）:
  - before: `omina-toggle-before-20261111.png` — Interface に「Show Pixiv Omina」行＋トグル（ON 表示。表示初期 data 値 true・保存値なしで fork 既定 false と食い違いを実測）。Change Log dialog を CLOSE 後に撮影。
  - after: `omina-toggle-after-20261111.png` — トグル行消滅、Interface 残行・Others のレイアウト崩れなし（スナップショットで checkbox 消滅も確認）。
  - 確認txt: `omina-toggle-confirmation-2026-11-11.txt`。Drive 保存後 local copy は `kilo-safe-remove` でゴミ箱。
- 実測で閉じた判断: options page の実パスは `options_page/index.html`（委譲文の `/index.html` は ERR_FILE_NOT_FOUND）。MCP プロファイルに拡張未_install のため `install_extension`（dist/chrome）で再 load、id は同一 `nccfhdinjmbjnlgnmmgglmenmaacgagf`。
- 記録と実コードの差異（軽微）: 「created割当」は実際は `beforeMount` 割当。削除対象は同一（同ファイル承認範囲内）。
- ブラウザ: 設定画面 page は close_page で閉じた。MCP 制限で最後の page（about:blank）は閉じられずブラウザ本体残存（識別条件での終了は委譲元統括で確認）。
- 合格。commit: 本項目分のみ（InterfaceOptions.vue・default.js）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
