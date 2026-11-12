# プレースホルダ展開の実際のPixiv作品ダウンロード確認（ログイン許可済み）

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: なし

## 意図 / 背景

前タスク（rename-rule-browser-check）で合成Blobによる保存経路は検証済み。ユーザー許可（ログインOK・資格情報はプロジェクト直下 `.env` の `PIXIV_EMAIL`/`PIXIV_PASSWORD`、gitignore済み）のもと、実際のPixiv作品をコンテンツスクリプトのボタンからダウンロードし、プレースホルダ展開後のファイル名で保存されるか確認する。

- パスワードは画面へ直接入力せずクリップボード経由でペーストし、ログ・記録に平文を残さない。

## 調査結果 / 変更内容

- ログイン: MCP専用Chromeプロファイルにpixivセッションが既に保持されており再ログイン不要。`PIXIV_EMAIL`/`PIXIV_PASSWORD` は不使用（平文露出なし）。
- 環境制約（判明・原因究明済み、詳細は known-issues）: `chrome-devtools` MCP の自動起動Chromeでは、CDP `Extensions.loadUnpacked` で入れた拡張のコンテンツスクリプトが pixiv ページに注入されない（`#__ptk-app` 未生成、新規タブ/再インストール/browser再起動でも再現）。エラーログはなし。コンテンツスクリプトの A/B ボタンUI層自体は過去タスク `2026-11-10-mv3-chrome-basic-function-audit` で通常Chromeの画面確認済み。
- 代替手順（実コードを1行も書き換えずに実データで検証）: オプションページコンテキストから実コードのタスク作成ハンドラへ実データで送信 `chrome.runtime.sendMessage({action:'download:addDownload', args:{unpackedResource, options}})`。`unpackedResource` は `IllustParser.parseContext` と同一のpixiv実API（`/ajax/illust/{id}`・`/ajax/illust/{id}/pages`）から `standardContext` と同一形で構築。以降は100%実コード経路（`PageResourceFactory`→`IllustAdapter`→`IllustDownloadTask`→Downloader(pximg original取得・DNR referer有効)→`NameFormatter`展開→`download:saveFile`→Chrome保存→自動開始）。
- 設定: `illustRenameRule` を `{authorId}_{id}_{title}`（`illustRenameImageRule: p{pageNum}`）に変更して検証、検証後に既定 `{id}_{title}` へ復元済み。
- 対象: illust 151916777「危ないポッキーゲーム」（ラクりゅん / userId 3348890 / 2ページ）。
- コード変更なし。スクラッチフォルダ `docs/ai/tmp/` にスクリプトなし（MCP evaluate と bash のみ）。

## Verification

- 証拠（2026-11-12 12:43 JST 実測、実作品・実API・実ピクセルデータ）:
  - `addDownload` 応答: `{"result":true}`、illustType 0、userId 3348890、totalPages 2、originals 2件
  - `D:\Downloads_Desktop\3348890_151916777_危ないポッキーゲーム\p0.png` state=complete 14,629,996B
  - `D:\Downloads_Desktop\3348890_151916777_危ないポッキーゲーム\p1.png` state=complete 14,648,620B
  - `Get-ChildItem` でディスク実在・サイズ一致（12:43:47 / 12:43:49）
  - プレースホルダ展開: `{authorId}`→3348890 / `{id}`→151916777 / `{title}`→危ないポッキーゲーム / `p{pageNum}`→p0,p1 と全て一致
- 合否: 合格
- スクショ: `I:\マイドライブ\kilo\2026-11-12-rename-rule-browser-check\dlmanager-real-{before,after}-20261112.png`、`real-downloaded-folder-20261112.png`。手順・実測値・環境制約は同フォルダ `rename-rule-browser-confirmation-2026-11-12.txt` に追記済み。
- 残置物: 上記ダウンロードフォルダはユーザー承認のもと同日ゴミ箱へ送信済み（`kilo-recycle-external -Approved`、復元可能）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
