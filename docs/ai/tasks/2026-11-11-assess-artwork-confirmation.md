# 作品画面機能確認（新インストール相当・既定downloadMode=2）

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: 子委譲: fresh相当テストインスタンスでdist/chrome install→artwork page確認（A/B button緑・Select & DL dialog・Ominaなし）→before/after+txt Drive保存→記録コミット

## 意図 / 背景

ユーザー指示（2026-11-11 06:56）「作品画面での機能も確認」。既定変更（decision 2026-11-11-default-download-mode-manager）後の新インストール相当で、作品画面（content UI）のfork機能を確認する。実装変更なし、確認専用項目。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目5（確認専用・コード変更なし）
確認内容（新インストール相当・storage seed後 downloadMode=2）:
- 作品画面にA/B button（DL to folder / DL per image）が表示され、download系 緑 `#0a7d46` であること
- `Select & DL`（選択系 青 `#0b74c4`）と dialog footer（選択系3＋download系2＋close  grey `#5b6b78`）の表示
- Pixiv Omina button/要素なし
- legacy mode（user切替後）のfork label表示は項目4で確認（本項目は既定モードのみ）

## Verification

- 合格条件: 上記確認＋before/after スクリーンショットと確認txtを `I:\マイドライブ\kilo\2026-11-11-assess-artwork-confirmation\` へ保存（playwright-confirmation-rule、chrome-devtools MCP、local copy `kilo-safe-remove`）。確認結果と保存先をタスク記録へ記載。画面確認不可なら未検証扱い（合格しない）。項目終了時にpage閉じる（識別条件は要約参照）。
- 確認は新インストール相当インスタンス（fresh seed、storage値は変更しない）で行う。既存プロファイルの値を汚染しない。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
