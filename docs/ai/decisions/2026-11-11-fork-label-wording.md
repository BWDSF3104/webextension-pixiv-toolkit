# fork label文言の決定（項目4残件解消）

**Date**: 2026-11-11
**Status**: 確定（ユーザー指示2026-11-11 06:57「残件と次の行動（項目4）適切なもので実施」）

## 決定

段階3で持ち帰った fork label文言を、直前assess回答で提示した值（正典記録側のzh_CN値）を「相応」として採用:

- `fork_legacy_download_label` en: `Download (zip, follows settings)` / zh_CN: `下载（zip，跟随设置）`（正典記録にzh_CN値の記載がないため相応の対訳。記録側の `fork_ugoira_zip_label` zh_CN = `Ugoira（zip，跟随设置）` は正典値として維持）
- `fork_ugoira_zip_label` en: `Ugoira (zip, follows settings)` / zh_CN: `Ugoira（zip，跟随设置）`

適用範囲（claimされた実施範囲どおり、項目4承認範囲へ反映）: legacy mode（`downloadMode=1`）の `AppLegacy.vue` の `Download` button と ugoira 換算 button へ fork label + `type="download"`（緑）。既存 key `_download` は変更しない（fork分のみ）。

## 補足（既知の限定）

- labelの「zip, follows settings」は `downloadSaveMode=0`（zip）時の意味。設定が folder の場合、legacy Download の実挙動は folder 保存で文言と一致しない。文言は採用どおりとし、手順書（項目6）で「設定追従」の挙動を説明する。

supersedes: 項目4の段階3持ち帰り（`docs/ai/tasks/2026-11-11-legacy-label-record-and-apply.md` 試行1）を解消。
