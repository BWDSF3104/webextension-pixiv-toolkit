# chrome-devtools MCP の自動起動Chromeでコンテンツスクリプトが注入されない

**状態**: 回避策あり（2026-11-12 判明）

## 症状

- CDP `Extensions.loadUnpacked`（`chrome-devtools_install_extension`）で拡張はインストール済みになる（`list_extensions` に表示、拡張ページ・service worker は動作）。
- しかし pixiv 等の対象ページにコンテンツスクリプトが注入されない（`#__ptk-app` 未生成、CS CSS 未読込）。
- コンソールに注入関連のエラーログなし。新規タブ作成・拡張再インストール・browser再起動でも再現。

## 原因

- 確定は未完了。自動起動Chromeの `--enable-automation` / `--remote-debugging-pipe` 系のフラグがCDP経由インストール拡張のCS注入を抑制している可能性が高い。

## 回避策

- コンテンツスクリプトのUI操作を要する検証はこの環境では不可。UI層は通常Chromeで別途確認する。
- UI層を跨いだ後続の処理（タスク作成以降）を単体で検証したい場合は、オプションページコンテキストから `chrome.runtime.sendMessage({action:'download:addDownload', args:{unpackedResource, options}})` を送信して実コード経路を実データで実行できる（例: タスク `2026-11-12-rename-rule-real-work-check`）。

## 参考

- `docs/ai/tasks/2026-11-12-rename-rule-real-work-check.md`
