# Known Issues

1エントリ1ファイル（`known-issues/KI-YYYYMMDD-NN-short-name.md`）。解決済みは `known-issues/archive/`。このファイルはインデックス。

- `KI-20261110-01-epub-generation-unavailable-under-mv3` — epub 生成不可（MV3 で eval / Function 不可）。Status: 保留（上流待ち）
- `KI-20261110-02-agents-md-vue-version-mismatch` — AGENTS.md の「Vue 3」が package.json（Vue 2.6 / Vuetify 1）と不一致。Status: ユーザー承認待ち
- `KI-20261110-03-agents-md-upstream-branch-master` — AGENTS.md の `upstream/main` が上流既定ブランチ `master` と不一致。Status: ユーザー承認待ち
- `KI-20261110-04-gifjs-whammy-leftover-in-statics` — readme で削除扱いのライブラリが `src/statics/lib` に残存。Status: 調査中
