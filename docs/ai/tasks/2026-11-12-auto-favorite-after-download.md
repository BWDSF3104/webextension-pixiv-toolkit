# ダウンロード成功後の自動お気に入りオプション

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: 実装: config/設定UI/DownloadManagerフック/content script POST

## 意図 / 背景

ダウンロード成功後に作品の Pixiv お気に入り（ブックマーク）を自動で行うオプションを追加する。ユーザー依頼により実装開始指示済み（2026-11-12）。
※別タスク `2026-11-10-mv3-chrome-basic-function-audit` は残件が指示待ち保留のため並行実施。

## 調査結果 / 変更内容

### 設計（確定）

- 設定キー `autoFavoriteAfterDownload`（既定 false、chrome.storage.local）。
- 発火点は `DownloadManager.listenTaskEvents` の `'complete'` リスナー1本（illust/manga/ugoira/novel 全タスクを網羅）。ダウンロード実行は options page（download manager タブ）のみ（`ContentPageDownloadManager` はデッドコード確認済み）。
- 認証付きお気に入り POST はセッション Cookie 確保のため pixiv.net タブの content script で実行（コードベース既存の same-origin fetch パターンに追随）。options 側は popup の `tabs.query` + `tabs.connect`（fetch-info）と同じ配線で content へ依頼。
- エンドポイント（上流調査で確定）:
  - `POST https://www.pixiv.net/ajax/illusts/bookmarks/add`（illust/manga/ugoira 共通）body `{illust_id, restrict:0, comment:"", tags:[]}`
  - `POST https://www.pixiv.net/ajax/novels/bookmarks/add`（novel）body `{novel_id, restrict:0, comment:"", tags:[]}`
  - ヘッダ `x-csrf-token`（`__NEXT_DATA__`/ページソースの `"token":"([0-9a-f]{32})"` から抽出）、`credentials: 'same-origin'`。
- 対象外: Pixiv コミック / Fanbox（お気に入り相当 API 無し）。unlisted 作品は API 側でエラー→ログのみ。
- 制限: pixiv.net タブが開いていること（無ければスキップ・ログ）。

### 変更ファイル

1. `src/config/default.js` — `autoFavoriteAfterDownload: false` 追加
2. `src/options_page/modules/AutoFavorite.js` — 新規（task→{favKind,idKey,id} 変換 + タブ検索して content へ依頼）
3. `src/options_page/modules/DownloadManager.js` — `'complete'` に1行追加
4. `src/content_scripts/modules/PixivBookmark.js` — 新規（token 抽出 + POST 実行）
5. `src/content_scripts/Bootstrap.js` — port メッセージ `type:'favorite'` 分岐追加
6. `src/options_page/components/options/DownloadOptions.vue` — v-switch 追加（enableDownloadMetadata と同型）
7. `src/statics/_locales/{en,ja,zh_CN}/messages.json` — ロケール2キー×3ファイル
8. `test/AutoFavorite.spec.js` — 新規（種別→エンドポイント変換の単体テスト）

### テスト計画

- 単体: `yarn test`（jest 全 spec。新規 spec は 4 変換ケース + 設定無効時に tabs.query を呼ばないこと）
- ビルド: `yarn build` / `yarn build:firefox`
- 手動（要ログイン環境・ユーザー実施）: dist/chrome ロード→スイッチ ON→illust 1件 DL→pixiv 側でお気に入り済みになること、novel でも同様、OFF で動作しないこと

## Verification

- 単体: `yarn test` → Test Suites: 7 passed / Tests: 35 passed（新規 `test/AutoFavorite.spec.js` 5 テスト含む）※初回 2 失敗は spec の browser モックに `__esModule: true` 不足、修正后成功
- ビルド: `yarn build` → exit=0、`yarn build:firefox` → exit=0（既存の asset size warning のみ）
- 成果物反映: `dist/chrome/content_scripts/app.js` に `bookmarks/add`、`dist/chrome/options_page/downloads.js` / `index.js` に `autoFavoriteAfterDownload` を確認
- 手動確認（未実施・要 Pixiv ログイン環境）: スイッチ ON で DL 完了時に pixiv 側でお気に入り済みになること、OFF で動作しないこと、pixiv タブ無し時にスキップされること

## 設計判断

- 認証付きお気に入り POST を options page ではなく pixiv.net タブの content script で実行する理由（SameSite/CSRF 確保・既存 same-origin fetch パターン追随）→ `decisions/2026-11-12-auto-favorite-via-content-script-tab.md`

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
