# fork使い方の手順書作成（docs/help-fork.md）

**Status**: 進行中
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

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
