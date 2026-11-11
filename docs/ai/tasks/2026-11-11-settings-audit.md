# 設定画面の項目棚卸し（不要残存・追加候補）

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: options page項目列挙（NewSettings/DownloadOptions/InterfaceOptions等）→残存不要項目確認（Omina済み・mode済み）→画面1点確認→Drive保存→追加候補は判断依頼として提示（実装指示待ち）

## 意図 / 背景

ユーザー指示（2026-11-11 09:06): 設定画面に不要な項目が残っていないか、逆に追加すべきものがないかの確認。レガシーモード廃止（6241e87）直後の棚卸し。

## 調査結果 / 変更内容

UI表示項目（grep+読取で確定）:
- 削除済みで残存なし: download mode tile（DownloadOptions.vue）、Pixiv Ominaトグル（項目1）、fork label key（項目4→廃止決定で削除）
- NewSettingsカード = fork設定4項目: DownloadSaveMode / ZipDownloads / DontCreateWorkFolder（3項目とも `_dl_button_override_note` 注記あり・項目2）＋ CombineRenameRules（rename規則はDL命名に有効・関連項目）→ 不要残存なし
- DownloadOptions の max-process tile: 常時表示（mode削除でv-if除去）＝managerタスク設定として妥当
- ロケールdead key（UI非表示・コード残存のみ、任意の掃除候補）: `_legacy`、`_download_mode`、`_download_mode_desc`（"In legacy mode, ffmpeg and .mp4 generation isn't supported"＝legacy前提の文言、consumer消滅でdead）
- `Application.js:53-61` のdownloadMode比較は発火不能のまま（既知・無害、変更しない）
- 追加候補: 機能上必要な追加なし（A/Bはクリック毎overrideで設定不要。既定ボタン設定等は依頼されていない範囲）

実測（画面1点・`I:\マイドライブ\kilo\2026-11-11-settings-audit\`）:
- mode設定なし✓・max-process=3常時表示✓・言語表示日本語（既存値default変更なし）
- 残存不要の実測: **Pixiv Omina推薦カード（AppSuggest）が設定画面に表示**（`Index.vue:96-106`、`Downloads.vue:120-127`）。decision 2026-11-10「拡張UIから非表示」はトグル分のみ実施済み、カード分未実施→判断依頼（実施推奨）
- fork設定4項目は「ダウンロードタスク設定＞グローバル」panel（`GlobalTaskSettings.vue:30-36`）に存在（NewSettingsカード＝同一項目のdialog内重複表示・upstream構造・無害）。panel折叠のため注記のUI表示はcode由来（非実測）
- browser: chrome-profile条件一致chrome.exe終了、残存0確認（最終page close不可のためprocess終了）

## Verification

- 画面確認1点（chrome-devtools MCP、playwright-confirmation-rule、既存instance `nccfhdinjmbjnlgnmmgglmenmaacgagf`、既存値変更なし、纯確認のため単one shot）: options page Downloadsセクション＝mode設定なし・max-process tile表示・3項目注記表示、NewSettingsカード4項目。画像＋txtを `I:\マイドライブ\kilo\2026-11-11-settings-audit\` へ保存、local copy `kilo-safe-remove`、識別条件一致chrome.exe終了（残存0）
- 追加項目の実装は指示待ち（判断依頼として提示）。判断後の実施は単独コミット+push

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
