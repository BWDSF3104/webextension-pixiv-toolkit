# downloadMode設定画面フォールバックを既定2へ整合

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: DownloadOptions.vue:118,196 と DownloadMode.vue:38,56 を2へ→yarn test/build→画面確認（初回読み込み表示）→Drive保存→コミット

## 意図 / 背景

fork既定 downloadMode=2（decision 2026-11-11）に対し、設定画面のフォールバックが `|| 1`（上流由来）で、storage未seedの初回読み込みで設定画面だけ「legacy(1)」表示になりfork既定と不一致。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目3（優先3）
承認範囲: `src/options_page/components/options/DownloadOptions.vue`（data 118、`|| 1` 196）と `src/options_page/components/options/option-items/DownloadMode.vue`（data 38、`|| 1` 56）の計4箇所を2へ。ロジック追加なし。

## Verification

- `yarn test` / `yarn build` 通過。
- 画面確認: storageに downloadMode が未定義の状態で設定画面が「Download manager(2)」表示こと。既存プロファイルの storage に既に値がある場合、その値の削除/変更は段階3（不可逆データ変更）として持ち帰るか、新規プロファイルで確認。Drive保存先 `I:\マイドライブ\kilo\2026-11-11-align-download-mode-fallback\`（playwright-confirmation-rule、chrome-devtools MCP、残存識別条件は要約参照）。項目終了時にpage閉じる。
- 画面確認不可なら未検証扱い（合格しない）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
