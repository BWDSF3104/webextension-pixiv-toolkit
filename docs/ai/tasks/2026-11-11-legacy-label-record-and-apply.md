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

### 試行2（2026-11-11 委譲）: 合格（試行1の持帰り件は decision 2026-11-11-fork-label-wording で解消済み）

- 実装（承認範囲どおり、試行1で確定した方針のまま）: en/zh_CN へ `fork_legacy_download_label`・`fork_ugoira_zip_label` 追加（既存key変更なし）、`AppLegacy.vue` の `Download` button と ugoira 換算3 button（gif/apng/webm）へ fork label + `type="download"`（既存 `.button--download` 流用・新CSSなし）。
- before 取得方法: 実装コード revert → build → `reload_extension` → before screenshot → 再適用 → build → after（同一条件 932x871・dpr 2・viewport full page）。before＝現状（label未表示・既定青 `rgb(0,150,250)`）、after＝fork label + `rgb(10,125,70)` = `#0a7d46`（非ugoira/ugoira 両方）。
- 観察点: ugoira 換算3 button が同一文言 `Ugoira (zip, follows settings)` になる（decision の文字どおり適用。format区別は progress text のみ）。判断変更なし・記録のみ。
- ugoira 作品特定（実測で閉じた）: 履歴4件に ugoira なし、Rankings ugoira 入口 404（実測）→ tag検索 `うごイラ` で illustType=2 の `151936600` 確定。storage downloadMode=1 は実測（`{"downloadMode":1}`）・既存値のまま。
- 合格（証拠）: `yarn test` 11 passed、`yarn build` exit 0、画面確認 before/after 両組合格（Verification 参照・Drive保存済み）。
- 作業ツリー: 基線 HEAD `54214cf` 上、本項目分のみ変更（AppLegacy.vue・en/zh_CN・task file）。単独コミット+push。ブラウザ: 画面確認後、last open page は MCP制限で close_page 不可 → 識別条件一致 chrome.exe（ブラウザ本体のみ）を終了、残存 0 確認（MCPにブラウザ終了操作がないためプロセス終了で対応）。

## Verification

- 記録訂正: 実施報告の該当記述を「記録と実コード不一致（実施なし）。訂正＝label key追加と型適用を実施」へ更新。→ 訂正対象記述が監査task fileに不存在（grep＋git log --all -Sで証明）。監査task fileへ訂正項目を追記（2026-11-11）。実施＝事実として未実施（一度も実施されていない）。
- `yarn test` / `yarn build` 通過。→ 試行2で通過（2026-11-11）: `yarn test` 2 suites / 11 tests passed（Time 1.989s、Done 4.25s）。`yarn build`（chrome）exit 0（WARNING は既存 asset size limit のみ、Done 9.94s。before 用 rebuild Done 9.31s）。
- 画面確認: legacy mode（`downloadMode=1`、確認用にテストプロファイルで設定し確認後復元）。before/afterを `I:\マイドライブ\kilo\2026-11-11-legacy-label-record-and-apply\` へ保存（playwright-confirmation-rule、chrome-devtools MCP、残存識別条件は要約参照）。項目終了時にpage閉じる。→ 試行2で合格（2026-11-11、同一条件 932x871・dpr 2・viewport full page・panel handler展開）。
  - 保存ファイル: `legacy-download-before-20261111.png` / `legacy-download-after-20261111.png`（非ugoira artwork 151753981）、`legacy-ugoira-before-20261111.png` / `legacy-ugoira-after-20261111.png`（ugoira artwork 151936600）、txt `legacy-label-confirmation-2026-11-11.txt`。local copy は `kilo-safe-remove` でゴミ箱へ送った。Drive側は残す。
  - 実測（before → after）: 非ugoira `Download` `class="button"` bg `rgb(0,150,250)`（既定青）→ `Download (zip, follows settings)` `button button--download` bg `rgb(10,125,70)` = `#0a7d46` ✓。ugoira `DL GIF`/`DL APNG`/`DL WEBM` `class="button"` 既定青 → 3 buttonすべて `Ugoira (zip, follows settings)` `button button--download` bg `rgb(10,125,70)` ✓。
  - ugoira 作品特定（実測で閉じた）: storage downloadMode=1 は既存値のまま（実測 `{"downloadMode":1}`・変更なし）。既存プロファイル履歴に ugoira なし（history 4件・type pixiv_illust/pixiv_manga）。Rankings ugoira 入口は pixiv 側 404（`ranking.php?mode=ugoira`・API実測）。tag検索 `うごイラ` 実測で illustType=2 の `151936600` を確定。
  - 判断（段階1/2）: ugoira 換算3 button への fork label適用（同一文言）は decision 2026-11-11-fork-label-wording と項目4承認範囲の文字どおり（「換算 button へ fork label + type=download」）。3 button が同一文言になるのは観察点（記録のみ・持帰りなし）。
- 画面確認不可なら未検証扱い（合格しない）。→ 該当: 不合格（未検証）。→ 試行2で画面確認実施、合格。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
