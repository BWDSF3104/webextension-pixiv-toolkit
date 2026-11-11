# 表示言語に日本語追加＋リリースビルド（6.4.2-fork2）

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: ja/messages.json全key翻訳（en==333key相当）→Locales.js/I18n.js/InterfaceOptions.vue配線→yarn test/build→画面確認（options page ja表示、language原値復元）→Drive保存→単独コミット+push→release 6.4.2-fork2（zip manifestルート、gh）

## 意図 / 背景

ユーザー指示（2026-11-11 07:31）: 拡張機能の表示言語に日本語を追加し、テスト完了したら完成品をリリースビルドとしてpush。现状のロケールは en/zh_CN のみ（ロケール条＝両ロケール）。

## 調査結果 / 変更内容

- en messages.json 実測 333 key（666 ":" 行）。ja は全key必須（vue-i18n の fallback は 'en' で messages に 'ja' 未登録 → 追加後に登録が必要）
- 配線3箇所: `src/modules/Locales.js`（import/export追加）、`src/modules/I18n.js`（messages 'ja' 追加）、`src/options_page/components/options/InterfaceOptions.vue`（languageOptions に `{ text: '日本語', value: 'ja' }` 追加）
- 成果: `src/statics/_locales/ja/messages.json`（新規・日本語訳・key集合はenと一致）
- リリース: `yarn build`（chrome）→ `dist/chrome` zip（manifest.json ルート）→ GitHub release `6.4.2-fork2`（gh、assets `webextension-pixiv-toolkit-6.4.2-chrome.zip`）。手順は workflows.md・監査記録（6.4.2-fork1）準拠。zipは gitignore 内（docs/ai/tmp/release）、記録のみコミット

## Verification

- 合格条件: `yarn test` 通過、`yarn build` exit=0、ja JSON有効＋key集合一致（照合スクリプトはスクラッチ `docs/ai/tmp/`）、画面確認（options page で language=ja 選択時UIが日本語表示、内容scriptのパネルも日本語。language原値は実測・記録し確認後復元）。before/after+確認txtを `I:\マイドライブ\kilo\2026-11-11-ja-locale-release\` へ保存（playwright-confirmation-rule、chrome-devtools MCP、local copy `kilo-safe-remove`）。項目終了時にpage閉じる（最終page閉不可の旨を結果に残す）
- release: gh で release `6.4.2-fork2` 作成（target master）。gh 認証不可なら残件として記録
- コミット+push: 単独（code分と記録）。commit prefix英語・説明日本語

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
