# AGENTS.md の Vue バージョン記述が package.json と不一致

**Date**: 2026-11-10

## 症状
`AGENTS.md` の Code Standards は「Vue 3」と記載。実際は `vue ^2.6.12`（`vuetify ^1.5.24`、`vue-router ^3.4.3`）。`devDependencies` の `@vue/runtime-dom ^3.2.41` は JSX ビルドヘルパー用で、UI は Vue 2。

## 原因
フォーク時のベースライン記録時の記述誤り。

## 影響
コードを書く際に誤ったフレームワーク前提（Composition API、Vue 3 用コンポーネント）を選ぶ。

## 修正方針
`AGENTS.md` は write-protected。ユーザー承認を得て Code Standards を「Vue 2.6 + Vuetify 1」へ修正。

## Status
ユーザー承認待ち

**Resolved**: 2026-11-10（ユーザー承認。AGENTS.md Code Standards と Project Structure を Vue 2.6 / Vuetify 1 へ修正）
