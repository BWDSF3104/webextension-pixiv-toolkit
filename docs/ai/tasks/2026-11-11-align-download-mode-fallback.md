# downloadMode設定画面フォールバックを既定2へ整合

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: DownloadOptions.vue:118,196 と DownloadMode.vue:38,56 を2へ→yarn test/build→画面確認（初回読み込み表示）→Drive保存→コミット

## 意図 / 背景

fork既定 downloadMode=2（decision 2026-11-11）に対し、設定画面のフォールバックが `|| 1`（上流由来）で、storage未seedの初回読み込みで設定画面だけ「legacy(1)」表示になりfork既定と不一致。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目3（優先3）
承認範囲: `src/options_page/components/options/DownloadOptions.vue`（data 118、`|| 1` 196）と `src/options_page/components/options/option-items/DownloadMode.vue`（data 38、`|| 1` 56）の計4箇所を2へ。ロジック追加なし。

## Verification

- `yarn test`: 2 suites / 11 tests passed（4.47s）。`yarn build`（chrome）: 成功（13.78s）。
- 画面確認（chrome-devtools MCP、window 945x1020 / viewport 932x871）:
  - 既存プロファイル（id nccfhdinjmbjnlgnmmgglmenmaacgagf）storage実測: downloadMode=1（既存値。削除・変更なし。正挙動としてLegacy(1)表示のまま）。
  - 新規install相当のテストインスタンス（dist/chromeのscratch\ptk-freshコピー → id ajaipaagpmcfplifmgpijffkknlkjgga。このテストインスタンスのstorageのみ操作）で合格条件の「storage未定義」状態を作成（fresh installのonInstalled seed（Application.js:135）でkeyが埋まるため、テストインスタンス限りの `chrome.storage.local.remove('downloadMode')` を実行）。リロード後の設定画面: select表示「Download Manager」、`v-if="downloadMode === 2"` 行（Max process）表示。storage get → undefined。合格。
  - Drive保存: `I:\マイドライブ\kilo\2026-11-11-align-download-mode-fallback\` → `download-mode-fallback-undefined-storage-20261111.png`・`download-mode-fallback-confirmation-2026-11-11.txt`。local copyは `kilo-safe-remove` でゴミ箱へ送った。
  - page閉: page 3閉。最後に開いていたpage（page 5）はMCP制限で閉じられない（その旨記録）。
- decision 2026-11-11-default-download-mode-manager.md 補足（「フォールバックは変更しない」）と本タスクの承認範囲が矛盾。同日のタスク記録（実装指示）を採用。fresh installではonInstalledがdefaultSettingsをseedするため、実運用の「未定義」状態はseed前またはキー欠落時のみ（実測）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
