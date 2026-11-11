# 表示言語に日本語追加＋リリースビルド（6.4.2-fork2）

**Status**: 完了
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

### 実施結果（2026-11-11、合格）

- ja JSON有効＋key集合一致: `python docs\ai\tmp\check_ja_keys.py` → `en=333 ja=333 missing=0 extra=0 bad_shape=0`（構造 `"key": { "message": "..." }`）
- `yarn test`（2026-11-11 実装後）: 2 suites / 11 tests passed（Time 1.994 s）
- `yarn build`（chrome, 2026-11-11 実装後）: exit=0、ja messages.json emitted、WARNING は既存の asset size limit のみ（Time 15.89 s）
- 画面確認（chrome-devtools MCP、拡張 `nccfhdinjmbjnlgnmmgglmenmaacgagf`（`install_extension` dist/chrome、同一id確認）、window 932x871・dpr 2 実測、before/after同一条件・viewport screenshot）: **合格**
  - language 原値実測 = `default`（record）。実測事実: fallback は `browser.i18n.getUILanguage()`（環境 'ja'）で、配線後 'default' でもUIは日本語表示（確認開始時点で日本語表示）。before/afterは明示選択（en→ja）で証示
  - language dropdown に option「日本語」表示 ✓（`options-ja-option-open-20261111.png`）
  - options page: English選択でUI英語（before）→「日本語」選択でUI日本語へ live 変化（after）✓（`options-ja-before-20261111.png` / `options-ja-after-20261111.png`）
  - 内容scriptパネル（artwork 151753981、login済「ぶるめ」）: `.ptk__container` innerText before `Download (zip, follows settings) / Select & DL / Legacy / Mode` → after `ダウンロード（zip、設定に従う） / 選択＆DL / Legacy / Mode` ✓（Legacy/Modeはフォークlabel・スコープ外）（`artwork-ja-before-20261111.png` / `artwork-ja-after-20261111.png`）
  - language 原値 `default` へ復元確認 ✓（storage 再実測 `{"language":"default"}`）
  - 保存: `I:\マイドライブ\kilo\2026-11-11-ja-locale-release\`（上記5画像＋`ja-locale-confirmation-2026-11-11.txt`）。local copy（scratch\2026-11-11-ja-locale-release）は `kilo-safe-rmdir` でゴミ箱
  - ブラウザ: page 11（artwork）close 済み。page 10（options page）は最後に開いている page のため close_page 不可（MCP制限）
- コミット+push: code分単独 `e4b2ead`（ja messages.json＋Locales.js＋I18n.js＋InterfaceOptions.vue、1007 insertions）→ push origin master 済み
- release: `dist/chrome` zip（manifest.json zipルート、`tar -tf` 確認、10,467,957 bytes、`docs/ai/tmp/release/`（gitignore内）・repo非コミット）→ GitHub release `6.4.2-fork2`（target master、asset `webextension-pixiv-toolkit-6.4.2-chrome.zip`）: https://github.com/BWDSF3104/webextension-pixiv-toolkit/releases/tag/6.4.2-fork2 （gh は upstream(fork parent) 既定解決で leoding86 宛 403 → `-R BWDSF3104/...` 明示で作成）
- 記録コミット+push: 本項目分単独（task file + `current-task.tsv`（task_manager update/end 経由））

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
