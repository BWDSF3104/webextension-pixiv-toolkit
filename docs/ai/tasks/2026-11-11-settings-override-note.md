# 設定画面にA/Bクリックoverrideの注記追加

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: A/Bボタンで上書きされる3設定（downloadSaveMode/dontCreateWorkFolder/globalZipMultipleImages）のdesc注記1行をen/zh_CN追加→画面確認→コミット

## 意図 / 背景

forkのA/Bボタン（click単位override、decision 2026-11-10-download-button-split-design）は既定モードでA/Bクリックが常に `saveMode` を固定するため、設定の `downloadSaveMode`・`dontCreateWorkFolder`・`globalZipMultipleImages` はA/B使用経路では効かない（設定追従はlegacyのDownload等のみ）。設定UIがこの上書き関係を示さず誤解を招く。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目2（優先2）
承認範囲: 3設定のdesc注記1文を en/zh_CN ロケールへ追加（新規文言は両ロケール）＋既存desc表示机制での表示。挙動変更・項目非表示化は承認範囲外（非推奨）。

採用判断（段階1）: 1文は3設定共通の共有キー `_dl_button_override_note` とし、既存 `v-list-tile-sub-title` を3コンポーネント（DownloadSaveMode.vue / ZipDownloads.vue / DontCreateWorkFolder.vue）に1行ずつ追加。文言はユーザーに見えるボタンラベル（`_download_to_folder`「DL to folder」/`_download_per_image`「DL per image」）を参照。根拠: App.vue:14-18 のボタンがこのラベルで表示、SuperMixin.tl→vue-i18n は Locales.js 経由で messages.json キーをそのまま参照可能。

## Verification

- `yarn test`: 2 suites / 11 tests passed（2.004s）。`yarn build`（chrome）: 成功。
- 画面確認（chrome-devtools MCP、window 945x1020 / viewport 932x871、被写体=Download Task Settings > Global listitem element、同一window・同一取得方法）:
  - before（旧HEAD 91138dbビルドのテストインスタンス scratch\ptk-old・id mdndjoapicjkflookphaoljndekaonfc、fresh storage state0、注記なし）→ `settings-download-before-20261111.png`
  - after（新ビルド・id nccfhdinjmbjnlgnmmgglmenmaacgagf、storage実測 state0）: Download save mode・Create zip file tilesに注記表示 → `settings-download-global-section-new-state0-after-20261111.png`
  - toggle操作（saveMode 0→1）: DontCreateWorkFolder tile表示+注記 → before `settings-download-toggle-saveMode1-before-20261111.png` / after `settings-download-toggle-saveMode1-after-20261111.png`
  - 3設定すべて注記の実表示を確認（en）。合格。操作後storageを0へ復元、テストインスタンスuninstall。
- Drive保存: `I:\マイドライブ\kilo\2026-11-11-settings-override-note\`（上記4 png + `settings-override-note-confirmation-2026-11-11.txt`）。local copyは `kilo-safe-remove` でゴミ箱へ送る。
- ブラウザ（chrome-devtools MCP、プロファイル chrome-devtools-mcp\chrome-profile）: 確認用pageはclose_pageで閉じた。最後に開いていたpage（new-tab-page）はMCP制限（last page close不可）で閉じられず、その旨記録。残存識別条件に一致するchrome.exe 9件を検出、終了操作で停止（残存0確認）。テストインスタンス（scratch\ptk-old）はuninstall済み。
- 画面確認不可なら未検証扱い（合格しない）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
