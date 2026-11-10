# AGENTS.md の上流取り込みコマンドが upstream/main になっている

**Date**: 2026-11-10

## 症状
`AGENTS.md` は `git merge upstream/main` と記載。上流 `leoding86/webextension-pixiv-toolkit` に `main` は存在しない。

## 原因
フォーク時のベースライン記録時の記述誤り。

## 影響
上流取り込みコマンドが失敗する。

## 修正方針
`AGENTS.md` は write-protected。ユーザー承認を得て `upstream/master` へ修正。`git ls-remote --heads upstream` で確認済み（master / develop / next）。

## Status
ユーザー承認待ち

**Resolved**: 2026-11-10（ユーザー承認。AGENTS.md を `upstream/master` へ修正）
