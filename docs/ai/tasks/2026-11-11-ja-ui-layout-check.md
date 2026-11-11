# 日本語表記によるUI崩れ確認（options・panel・dialog）

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: 委譲: nccf instance（既存）でlanguage=ja設定→options page、artwork panel、Select & DL dialog footerをbefore(en)/after(ja)同一条件で取得→切り取り・溢れ・折返し崩れなしを確認→language原値(default)復元→Drive保存→記録コミット+push。修正は承認範囲外（発見時は持帰り）

## 意図 / 背景

jaロケール（合格済み・e4b2ead）でUI要素の切り取り・button溢れ・折返し位置の崩れがないか、before(en)/after(ja)同一条件比較で確認する（確認専用項目。修正は承認範囲外）。

## 調査結果 / 変更内容

- 対象: options page（Interface・Downloadsセクション）、artwork page 151753981（legacy panel fork label、Select & DL dialog footer 2行契約）。既存instance `nccfhdinjmbjnlgnmmgglmenmaacgagf`（同一ID確認。storage継続、language以外の既存値変更なし: downloadMode=1、原値 language='default'）。
- 操作: language en→ja（UIセレクト。原値 'default' 実測→確認後復元確認済み）。artwork page は panel handler展開→「Select & DL」/「選択＆DL」 click→dialog open（en/ja同一操作）。
- 実測（window size 全取得同一: outer 945x1020 / viewport 932x871、人工resizeなし、full page同一取得方法）:
  - options page: ja表示でクリップ（scrollWidth>clientWidth）0件、viewports/文書幅はみ出し0件。button・select・長文折返しすべて枠内、崩れなし。
  - panel: ja fork label「ダウンロード（zip、設定に従う）」幅199px（en 218px）、panel 1行3 button整列、溢れなし。
  - dialog footer: jaで行数=2（選択3行＋download2＋close）、footer幅550px（viewport約60%＝契約どおり）、全button scrollWidth==clientWidth、折返し位置の崩れなし。
- 合否: 合格（崩れ発見なし、修正0回、再検証なし）。code変更なし。

## Verification

- Drive保存 `I:\マイドライブ\kilo\2026-11-11-ja-ui-layout-check\`: options-page-before/after-20261111.png、artwork-151753981-panel-before/after-20261111.png、artwork-151753981-dialog-before/after-20261111.png、ja-ui-layout-check-confirmation-2026-11-11.txt（local copy scratch/ja-ui-layout-check/ は正典 kilo-safe-rmdir でゴミ箱へ送った）。
- before/after同一window size・同一被写体範囲（同一full page）・同一取得方法。合否=合格。
- ブラウザ: open page close、最後に開いているpageはclose不可のため識別条件一致（`C:\Users\fujim\.cache\chrome-devtools-mcp\chrome-profile`）chrome.exeのみ終了、残存0確認（実施結果は結果報告に記載）。
- 修正・再検証試行回数: 0（確認専用）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
