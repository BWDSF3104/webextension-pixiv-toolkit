# プレースホルダ展開（リネーム規則）の各ボタン別テスト

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: test/renameRules.spec.js を作成し jest で実行

## 意図 / 背景

設定の「リネーム規則」はプレースホルダ展開（`{id}` `{title}` 等）であり、実際に各ダウンロードボタン起動時に適用されるかをテストで確認する。ユーザー指示によりテスト計画を作成して実施。

## テスト計画

新規 spec: `test/renameRules.spec.js`。実物の `NameFormatter` / `pathjoin` / `MimeType` / `config/default.js` の既定規則を使い、各タスククラスの保存ファイル名生成コード（`onItemFinish` / `makeTxtBook`）から出力される filename をモック保存APIで捕捉して検証する。

| # | ボタン | 検証経路 |
|---|--------|----------|
| 1 | イラスト | `IllustDownloadTask.onItemFinish`（フォルダ保存）→ `illustRenameRule` + `illustRenameImageRule` が展開される |
| 2 | 漫画 | `MangaDownloadTask` → `mangaRenameRule`（既定値の `}` タイポ含む）が展開される |
| 3 | うごーら | `UgoiraDownloadTask.onItemFinish` → `ugoiraRenameRule` が zip 保存名に展開される |
| 4 | 小説 | `NovelDownloadTask.makeTxtBook` → `novelRenameRule` が .txt 名に展開される |
| 5 | Pixiv漫画 | `EpisodeDownloadTask.onItemFinish`（FileSystem経由）→ `pixivComicEpisodeRenameRule`（`{numberingTitle}_{workTitle}`）が展開される |
| 6 | Fanbox | `PostDownloadTask.onItemFinish` → `fanboxPostRenameRule`（`{pageNum}` 含む）が展開される |
| 7 | （変種）zipモード | `globalZipMultipleImages=1` で zip 内ファイル名=画像規則、zip 名=作業規則 |
| 8 | （変種）作品フォルダなし | `dontCreateWorkFolder=2` + `combinWRRule=0` で画像規則のみ |
| 9 | （境界） | 規則空→フォールバック名、不明プレースホルダ `{unknown}` はリテラル残存（現行挙動の記録） |

共通モック: `GlobalSettings` / `Extension/browser` / `FileSystem` / `Downloader` / `Util(fixFilename)` / ugoira generator。NameFormatter・MimeType・pathjoin は実物。

## 調査結果 / 変更内容

- 新規: `test/renameRules.spec.js`（10テスト）。既存spec様式に倣い GlobalSettings/browser/FileSystem/Downloader/Util/ImageDecrypte をモック、NameFormatter・pathjoin・MimeType・config既定規則は実物を使用。
- 結果: 全ボタン種別（イラスト/漫画/うごーら/小説/Pixiv漫画/Fanbox）でプレースホルダ展開が保存ファイル名に適用されることを確認。zip名・zip内ファイル名・作品フォルダなし変種も適用。
- 判明した現行挙動（バグではなく記録）:
  - `mangaRenameRule` 既定値 `{id}_{title}}` の末尾 `}` はリテラルでファイル名に残る（上流タイポ）。
  - Fanbox既定規則 `{id}_{title}/{pageNum}` の `{pageNum}` は `onItemFinish` の `buildPageNum(args.index)` で上書きされ、`pageNumberStartWithOne` 既定では 0-based になる。
  - 不明プレースホルダ（`{unknown}`）は置換されずリテラル残存。規則が空ならフォールバック名。
- 注: 並行進行中の `2026-11-10-mv3-chrome-basic-function-audit` は別ファイル・指示待ちで競合なし。テストのみ追加のため実装タスクと衝突せず。

## Verification

- `npx jest test/renameRules.spec.js --coverage=false` → 10/10 passed（2026-11-12、約1.0s）
- `npx jest --coverage=false`（全体） → 3 suites / 21 tests passed（約2.1s、既存テスト非破壊）

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
