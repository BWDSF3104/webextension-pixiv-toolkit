# MV3改修方針1-6の実装

**Status**: 進行中
**Date**: 2026-11-12

## 意図 / 背景

監査タスク `2026-11-10-mv3-chrome-basic-function-audit` の改修方針1-6について、実装済みかの確認と、未実施分の「本当に実装すべきか」の検討を含む実装（ユーザー指示 2026-11-12）。

## 調査結果 / 変更内容

### 方針ごとの実施済み状況（2026-11-12 調査）

- **方針5**（WebRequestService 削除）: **実施済み**。commit 75947cb（cleanup-dead-code-and-observe）で削除。
- **方針6**（permission・未使用モジュール整理）: **大半実施済み**。ScriptInjector/Notification/Queue/pouchdb 等は削除済み。残は manifest の `downloads.shelf`（Chrome 117 deprecated・参照ゼロ）と `web_accessible_resources` の存在しない `lib/ffmpeg/ffmpeg-core.wasm` 参照 → 今回掃除。
- **方針2**（onDeterminingFilename）: 未実施。**listener 削除で解決**と判断。listener の動作は `downloads.download({url, filename})` に渡済みの filename を map 経由で再 suggest するだけで、listener なしなら download() の filename がそのまま有効（既定 conflictAction は uniquify で同等）。SW 再起動で map が失れてファイル名が Chrome 自動名になる既知症状も、map ごと削除で消える。上流 HISTORY v6.4.2 も「Remove the listener for event onDeterminingFilename」。storage 永続化は不要と判断。
- **方針1**（DNR rule）: 未実施。**rule 1 の修正はしない**と判断 — `resourceType` が不正キーのため実質 full match になり、実測（11-10）で image 含む pximg リクエストに Referer が適用されダウンロードが動いている。正しい `resourceTypes` に直すと列挙漏れの型で現状動いている経路を壊すリスク > 効果。rule 2 は `initiatorDomains` 不正で登録されず実害ゼロの dead rule → 削除。
- **方針3**（blob worker → 同封 worker）: 未実施。ugoira GIF 変換（`ContentPageDownloadManager.js:73` で GifGenerator は LIVE）が MV3 content script CSP で blob worker を作れず失敗する可能性が高いが**未実測**。gif.js の `workerScript` 指定でも gif.js 内部が XHR→blob 経路のため、同封 worker 化には GifGenerator 側の配線変更が必要。→ ユーザー判断依頼（GIF変換を使うか）。
- **方針4**（handlebars/epub）: content script 列からは js-epub-maker を除去済み（7ad7fef）。残る epub 経路は download manager（`downloads.html:12-13` が handlebars-latest.js + js-epub-maker.js を読む）。extension page CSP（`script-src 'self' 'wasm-unsafe-eval'`）で `new Function` 不可のため epub 生成は不可（コード確定・未実測）。修正は sandbox ページ隔離で中規模。→ ユーザー判断依頼（EPUB を使うか）。
- **関連（監査項目8、方針外）**: ugoira MP4 変換は `ffmpeg-core.js`/`ffmpeg-core.wasm` が同封されず、`downloads.html:7` の参照が 404、既定 corePath は unpkg（remote code で MV3 禁止）→ MP4 変換不可。npm の @ffmpeg/core を同封すれば直るが +約25MB。→ ユーザー判断依頼。

### 今回実装（2026-11-12）

- `DownloadService.js`: `onDeterminingFilename` listener・`cachedDownloadIdFilenameMap`・`cacheDownloadIdFilename` を削除（方針2。download() の filename がそのまま有効。conflictAction は既定 uniquify で同等）
- `net_request_rules_1.json`: rule 2 を削除（不正 `initiatorDomains` で未登録の dead rule、挙動不変）。rule 1 は現状 working（実質 full match で Referer 適用済み）のため無変更
- `manifest.json`: `downloads.shelf` 削除、`web_accessible_resources`（存在しない `ffmpeg-core.wasm` のみ）削除
- `downloads.html`: 存在しない `lib/ffmpeg/ffmpeg-core.js` 参照削除（handlebars/epub 参照は方針4 判断待ちで残置）
- 未実施（判断依頼）: 方針3（GIF worker 同封化）、方針4（EPUB sandbox）、監査項目8（ffmpeg core 同封）

## Verification

- `yarn test`: 7 suites / 37 tests passed（Time 2.494s）
- `yarn build`（chrome）: exit 0（Done in 10.84s）、`yarn build:firefox`: exit 0（Done in 8.94s）
- `net_request_rules_1.json`: `ConvertFrom-Json` 妥当（rules=1, id=1）
- `rg cachedDownloadIdFilename|listenOnDeterminingFilename src/`: 残参照ゼロ
- **未確認**: ダウンロードファイル名の Chrome 実機表示（listener 削除後）。上流 v6.4.2 が同方針で listener を削除してリリースしている点を根拠とするが、本 fork での実 DL 目視は未実施

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
