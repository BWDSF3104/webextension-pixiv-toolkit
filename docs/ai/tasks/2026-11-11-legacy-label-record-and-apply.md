# 監査記録の訂正とlegacy label/type適用（記録とコード不一致）

**Status**: 進行中
**Date**: 2026-11-11
**Next Action**: 文言決定記録済み（decision 2026-11-11-fork-label-wording）→委譲実施: en/zh_CN 4 key追加+AppLegacy Download/ugoira換算buttonへfork label+type=download→yarn test/build→legacy mode作品画面確認（非ugoira: Download、ugoira: 換算button）before/after Drive保存→単独コミット+push+終了

## 意図 / 背景

監査項目（2026-11-10-mv3-chrome-basic-function-audit）の実施報告は「fork label実装（`fork_legacy_download_label`/`fork_ugoira_zip_label`、`type="download"`）合格」とするが、実コードにlabel keyも型適用も存在しない（記録とコードの不一致）。実コードを確認した結果: `AppLegacy.vue:14-24` は `tl('_download')` のまま・型なし＝既定青、`_locales/en/messages.json` 最終コミットは 17c0f1c（button分割keyのみ）。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目4（優先4）
承認範囲: `docs/ai/tasks/2026-11-10-mv3-chrome-basic-function-audit.md` の記録訂正（試行1で実施済み）、en/zh_CN ロケールへの fork label key追加、`AppLegacy.vue` の `Download` button と ugoira 換算 button へ `type="download"`＋fork label適用（claimされた実施範囲へ拡張、既存key `_download` は変更なし）。button表示のみ。

### 文言決定（2026-11-11 06:57 ユーザー指示「適切なもので実施」）

decision `docs/ai/decisions/2026-11-11-fork-label-wording.md`。採用: `fork_legacy_download_label` en `Download (zip, follows settings)` / zh_CN `下载（zip，跟随设置）`、`fork_ugoira_zip_label` en `Ugoira (zip, follows settings)` / zh_CN `Ugoira（zip，跟随设置）`。段階3解消、実装委譲可能。

### 試行1（2026-11-11 委譲・前提検証）: 不合格（前提の記録と実物が不一致）→ 実施せず持ち帰り

- 訂正対象記述の所在確認: 「fork label実装（`fork_legacy_download_label`/`fork_ugoira_zip_label`、`type="download"`）合格」は監査task file・`docs/ai/`全体・Drive確認txt・保存済みtool outputのどこにも存在しない。`git log --all -S`（全履歴）でも両key名とAppLegacy.vueへの`type="download"`適用のコミット痕跡なし（17c0f1cのbutton分割keyのみは実測一致）。claimはassess回答（チャット、2026-11-11 06:04）のみ。監査fileの実施報告（button色確認）とdecision `2026-11-10-button-group-colors.md`（A2 未確認・既定青）は実コードと一致していた。
- 採った判断: 正典文書間の矛盾は新文書優先（子の判断ルール）。監査fileの記録記述は実コードと整合しており、訂正対象記述は不存在。監査task fileのVerificationへ訂正項目を追記（事実としての「実施なし」＋所在はチャット回答のみ）→ 実施済み。
- 段階3持ち帰り: 2 label keyの文言（en/zh_CN）は正典・記録・全履歴のどこにも定義なし。ユーザー-visibleなlabel文言の決定は段階3（UX）。決定なしでは実装・合格条件（画面確認でのlabel表示）を満たせない。`fork_ugoira_zip_label`は適用対象buttonが承認範囲外（ugoira 換算 button 触れない）のため、追加のみ・未適用となる。
- 実施・検証: 実装なし（コード変更ゼロ）。`yarn test`/`yarn build` 実行なし（変換対象なし）。画面確認未実施＝未検証（不合格）。試行1回で停止。
- 作業ツリー: 基線 HEAD `1b2fb34`・cleanを維持（コード変更なし。本項目の未コミット変更は記録更新のみ: 本task file＋監査task fileの訂正項目）。コミットなし。ブラウザは開いていない（画面確認不可のため起動せず）。

## Verification

- 記録訂正: 実施報告の該当記述を「記録と実コード不一致（実施なし）。訂正＝label key追加と型適用を実施」へ更新。→ 訂正対象記述が監査task fileに不存在（grep＋git log --all -Sで証明）。監査task fileへ訂正項目を追記（2026-11-11）。実施＝事実として未実施（一度も実施されていない）。
- `yarn test` / `yarn build` 通過。→ 実行せず（実装なし）。
- 画面確認: legacy mode（`downloadMode=1`、確認用にテストプロファイルで設定し確認後復元）。before/afterを `I:\マイドライブ\kilo\2026-11-11-legacy-label-record-and-apply\` へ保存（playwright-confirmation-rule、chrome-devtools MCP、残存識別条件は要約参照）。項目終了時にpage閉じる。→ 未実施（label文言未決定のため合格条件成立不可）。未検証。
- 画面確認不可なら未検証扱い（合格しない）。→ 該当: 不合格（未検証）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
