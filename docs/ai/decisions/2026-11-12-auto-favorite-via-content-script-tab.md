# 自動お気に入りは pixiv.net タブの content script で POST する

**日付**: 2026-11-12
**状態**: 採用

## 背景

ダウンロード完了後の自動お気に入りは `POST /ajax/{illusts|novels}/bookmarks/add` を要認証で実行する必要がある。ダウンロード実行主体は options page（拡張オリジン）だが、拡張ページからの pixiv.net への POST でセッション Cookie が付くか（SameSite 扱い）は確実でない。上流コードベースも要認証 API は全て pixiv.net 上の content script（same-origin）で実行しており、options page からの認証呼び出しは無い。

## 決定

- options page 側（`AutoFavorite.tryFavorite`）は `browser.tabs.query({url:'https://www.pixiv.net/*'})` + `tabs.connect`（popup の `fetch-info` と同型のポート経由）で content script に依頼するだけにする。
- 実際の POST は content script（`PixivBookmark.js`）で `credentials:'same-origin'` + `x-csrf-token`（ページソースから抽出）で実行する。

## 結果・制約

- 認証が確実に効く（ブラウザ差异に依存しない）新規パーミッションなし。
- 制限: ダウンロード完了時点で pixiv.net タブが開いていること。無ければスキップして warn ログ。unlisted 作品は API 側エラー→ログのみ。
- 代替案（不採用）: options page から直接 fetch — Cookie 付与が未検証で失敗時に無音化するため不採用。
