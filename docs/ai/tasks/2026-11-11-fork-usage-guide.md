# fork使い方の手順書作成（docs/help-fork.md）

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: 子委譲: 日本語手順書（インストール・既定2の即使用・A/Bの意味・dialog・色・上流設定の追従/上書き関係・既存プロファイル不変）→単独コミット+push

## 意図 / 背景

ユーザー指示（2026-11-11 06:56）「使い方の手順書作成」。fork機能（既定2、A/B button、dialog、色、Omina非表示）の使い方を日本語手順書として記録する。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目6。成果物: `docs/help-fork.md`（新規、日本語）。コード変更なし。
記載内容:
1. インストール（dist/chrome Load unpacked、6.4.2-fork1）
2. 既定モード（新PC＝ダウンロードマネージャ。既存プロファイルは保存値維持）
3. A/B buttonの意味（A=work folder内ファイル単位、B=直下ファイル単位、クリック単位のoverrideで設定は変わらない）
4. Select & DL dialog（footer 2行・A/B）
5. 色分け3群（選択/ダウンロード/クローズ）
6. Ugoira は换算button（A/B効果なし）
7. 上流設定（downloadSaveMode/dontCreateWorkFolder/globalZipMultipleImages）とoverrideの関係（A/B使用時は上書き。設定追従はlegacyのDownload等）
8. Pixiv Omina 非表示（fork）
9. legacy mode でのfork label表示（項目4実施後は「Download (zip, follows settings)」）

## Verification

- 合格条件: 上記9項目が手順書に含まれ、実測済みの挙動（項目1〜5の記録・decision）と矛盾しないこと。表不使用、簡潔。単独コミット+push（docs）。画面確認は不要（文書）。

### 内容照合（2026-11-11 合格・試行1）

- 9項目すべて `docs/help-fork.md` に包含。各項目の根拠:
  1. 6.4.2-fork1 はGitHub release tag（監査記録 `2026-11-10-mv3-chrome-basic-function-audit.md`:84。コード内文字列ではない）。Load unpacked/Manifest V3 はプロジェクトAGENTSどおり
  2. decision `2026-11-11-default-download-mode-manager`（既定2・既存プロファイルは保存値維持=Updater.mergeSettings）
  3. decision `2026-11-10-download-button-split-design`＋試行2実測（A=work folder内ファイル単位、B=直下ファイル単位、click単位override）
  4. decision `2026-11-10-select-and-dl-button-ab-in-selection-dialog`＋項目5実測（footer 2行・download行disabled）
  5. decision `2026-11-10-button-group-colors`（実測rgb一致: #0b74c4/#0a7d46/#5b6b78）
  6. Ugoiraスコープ外（decision）＋legacy換算button文言（decision `2026-11-11-fork-label-wording`＋項目4試行2実測）
  7. 項目2記録（3設定desc注記・A/B使用時は上書き・設定追従はlegacyのみ）
  8. decision `2026-11-10-ui-label-distinction-and-pixiv-omina-hidden`（既存設定trueでも非表示）
  9. decision `2026-11-11-fork-label-wording`（「zip, follows settings」はdownloadSaveMode=0時の意味、folder設定時実挙動=folder追従）
- panel展開でのみ押せる旨（decision `2026-11-10-collapsed-state-button-operation`）は実測記録と一致（追加1行）。
- 正典文書間の矛盾検出なし。表不使用・簡潔。画面確認不要（文書項目・ブラウザ開いていない）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
