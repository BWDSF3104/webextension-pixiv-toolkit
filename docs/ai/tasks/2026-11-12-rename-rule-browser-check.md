# プレースホルダ展開のChrome実機（ダウンロードマネージャー）画面確認

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: 拡張をChromeにロードし 設定→保存→ファイル実在 を画面とディスクで確認

## 意図 / 背景

jest（2026-11-12-rename-rule-tests）でタスククラス→ファイル名生成は検証済みだが、Chromeダウンロードマネージャー（`browser.downloads` + MV3 background）経由で実際にプレースホルダ展開後のファイル名（日本語・サブフォルダ含む）が保存されるかは不明。実機で確認し、動かなければ原因究明する。

## 調査結果 / 変更内容

**結論: 実機で適用確認できた（動いている）。コード変更なし。**

- `dist/chrome` を chrome-devtools MCP でインストール（ID `nccfhdinjmbjnlgnmmgglmenmaacgagf`、MV3 SW起動・エラーなし）
- ダウンロードマネージャページから実コードと同経路を発動（ページ側Blob→`blob:` URL→`download:saveFile` メッセージ→background `DownloadService.saveFile`→`browser.downloads.download`）
- 結果: `chrome.downloads.search` で `D:\Downloads_Desktop\123_タイトル\p1.png` state=complete・68B（送信バイト一致）、ディスク実在、file://一覧スクショで可視確認
- 設定値（chrome.storage.local・全項目既定の適切なプレースホルダ）: `{id}_{title}` 系規則×6、画像規則 `p{pageNum}`×4、`downloadRelativeLocation: ''`。設定UI・RenameDialogのプレースホルダquick picks表示も確認

補足事実（バグではなく本タスクで判明）:
- 設定は `chrome.storage.local` に保存（syncではない）
- ページから `chrome.downloads.download` に直接渡した `filename` はChromeが無視（リソース名・自動名になる）。サブフォルダ・日本語名が反映されるのは background の `DownloadService.saveFile`（URL→filenameキャッシュ + `onDeterminingFilename` で suggest）経由のみ。実コードは全経路このため実運用上正しい。直接保存コードを追加しないこと
- `chrome-extension://` リソースURLをbackground経由でダウンロードするとChrome制約でNETWORK_FAILED（実コードはblob:のみで経路外）
- テスト成果 `D:\Downloads_Desktop\123_タイトル\p1.png` は証拠に残置（diag生成物2件はchrome.downloads.removeFileで削除済み）

## Verification

- 画面証拠（Drive: `I:\マイドライブ\kilo\2026-11-12-rename-rule-browser-check\`、local copyはkilo-safe-removeでゴミ箱へ済み）:
  - `settings-rename-rows-20261112.png` / `rename-dialog-open-20261112.png`（開く操作のbefore→after）
  - `dl-manager-open-20261112.png` / `downloaded-folder-20261112.png`（`123_タイトル\p1.png` の一覧）
  - 確認手順txt: `rename-rule-browser-confirmation-2026-11-12.txt`
- 機械実測: `downloadId=22 → filename D:\Downloads_Desktop\123_タイトル\p1.png, state=complete, fileSize=68`。`Get-ChildItem` で実在一致
- 未検証点: `chrome://downloads` 画面そのもののスクショ（DevToolsからchrome://を開けず）。chrome.downloads.search + file://一覧で代替
- ブラウザ開閉: 開いた拡張ページ・file://ページは閉じた。専用プロファイル（.cache\chrome-devtools-mcp\chrome-profile）のChrome本体7プロセスを終了し残存0を確認（ユーザー自身の通常プロファイルChromeは非対象）

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
