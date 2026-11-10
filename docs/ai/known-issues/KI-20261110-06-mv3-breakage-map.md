# MV3 で基本機能を壊している点の一覧（改修タスクへの参照）

**Date**: 2026-11-10

## 症状

最新 Google Chrome で基本機能（ダウンロード、Ugoira 変換、epub 生成）が動作しない。

## 原因（確認済み）

- blocking webRequest が MV3 で不可、かつ `webRequest` permission 未宣言 → `WebRequestService` が動かない／呼ぶと TypeError
- `net_request_rules_1.json` rule 2 の `initiatorDomains` が不正（ドメインではない）→ 登録されない。`testMatchOutcome` で match なし。
- rule 1 は `resourceType` が不正キーで有効な `resourceTypes` が省略され、実測で `image` matched（DNR の `set` 値と同じ `referer: https://www.pixiv.net` が request header に出る）。本来の条件は `resourceTypes` に修正すべきだが、現状は image に効いている。
- service worker の状態喪失で `cachedDownloadIdFilenameMap` / `ports` が失われる。listener の同期登録にも違反。`chrome.downloads.onDeterminingFilename` listener の存在と storage read は確認、ファイル名/port の実測は未完了。
- content script の isolated world CSP が `new Function` と `blob:` worker を禁じる（handlebars、gif.js worker）
- `content_scripts.js` 列に `handlebars-latest.js` が無く `Handlebars` が undefined
- ffmpeg core が remote code（unpkg）または同封ファイル欠落

## 実行時確認（2026-11-10）

- `dist/chrome` install 成功。options page / popup page は load 成功。content script isolated world は `__ptk-app` false、console `Uncaught ReferenceError: Handlebars is not defined`。
- `dist/chrome` 内の `lib/ffmpeg/ffmpeg-core.js`, `ffmpeg-core.wasm`, `ffmpeg-core.worker.js` は存在。ただし options page は `lib/ffmpeg/ffmpeg.min.js` を script として読み込まないため、global `FFmpeg` が undefined。`UgoiraDownloadTask.js` の global `FFmpeg` 参照で Ugoira 変換が失敗する可能性が高い（download 実測は未実施）。

詳細と file:line は `docs/ai/tasks/2026-11-10-mv3-chrome-basic-function-audit.md`。

## 影響

ダウンロード名前の化け・pximg 403・GIF/epub 変換不可。UI 表示そのものは MV3 影響外。

## 修正方針

改修タスクの「改修方針」参照。実装はユーザーの開始指示後に着手。

## Status

進行中（`2026-11-10-mv3-chrome-basic-function-audit`）
