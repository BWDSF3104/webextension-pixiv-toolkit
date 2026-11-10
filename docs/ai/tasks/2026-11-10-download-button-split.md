# ダウンロードボタン改修: ボタン分割（フォルダ展開 / 画像別保存）

**Status**: 進行中
**Date**: 2026-11-10
**Next Action**: 検討中: 2ボタンの意味（フォルダ展開=saveMode1+work folder / 画像別保存=saveMode1+work folderなし）の確定と実装開始指示待ち

## 意図 / 背景

ダウンロードボタンを、挙動別に分割する:
- ボタンA: フォルダ展開（作業フォルダを作り画像をファイルとして保存）
- ボタンB: 画像別保存（画像ごとにファイル保存）

現状は単一的な `Download` ボタンで、zippack / folder 保存の分岐は設定（`downloadSaveMode`）でしか選べない。クリックごとに挙動を選べるようにする。

## 調査結果 / 変更内容

### 現状の構造（コード確認）

- content UI のボタン: `src/content_scripts/components/App.vue:14`（非ugoiraは1個の `Download` ボタン）→ `download()` → `getDownloadArgs()`（`App.vue:358`）の `options` → `download:addDownload` / `ContentPageDownloadManager.addTask`。
- `options` は `DownloadAdapter.createDownloadTask(resource, options)`（`src/options_page/modules/DownloadAdapter.js:62`）経由でタスクコンストラクタへそのまま流れる。追加フィールドは配線不要。
- 保存挙動の分岐はタスク実行時の `GlobalSettings()` 読み:
  - `shouldZipFile()`: `src/options_page/modules/DownloadTasks/MultiplePagesDownloadTask.js:134`
  - `dontCreateWorkFolder()`: 同 `:144`
  - 画像ごと保存（zip の場合 zip.file、folder モードの場合 `download:saveFile` を画像単位）: `onItemFinish` 同 `:161-198`
  - zip 生成は `onFinish` 同 `:236-268`（zip モードのみ）
- 設定: `downloadSaveMode`（`src/config/default.js:263`、0=zip / 1=folder）、`globalZipMultipleImages`（1=常にzip/2=複数page/3=複数ファイル）、`dontCreateWorkFolder`（1-3）。
- つまり「フォルダ展開保存」「フォルダなしで画像ごとに保存」の挙動自体は既存設定にあり、欠けているのはクリック単位の選択（タスク単位 override）とボタン。

### 最小実装案（実装開始指示後）

1. `MultipleDownloadTaskOptions` に `saveMode` override 追加（undefined=設定follow）。`shouldZipFile()` / `dontCreateWorkFolder()` の先で override を見る。約4〜6行。
2. `App.vue` の非ugoiraボタンを2個へ分割: `@click="download({ saveMode: 'folder' })"` / `@click="download({ saveMode: 'perImage' })"`。ラベルは `tl()` で en / zh_CN 両ロケールへ追加。
3. override 分岐は新ロジックなので jest spec を1本（`shouldZipFile` / `dontCreateWorkFolder` の override 判定）。
4. Ugoira は既存の换算ボタン別（UgoiraDownloadTask は単一換算ファイル生成）なのでスコープ外とする — 要確認。

### 承認（2026-11-10 04:20 ユーザー「推奨で承認」）

- 2ボタンの意味・クリック単位の override・Ugoira スコープ外：すべて推奨案どおり承認。
- decision: `docs/ai/decisions/2026-11-10-download-button-split-design.md`

### 未確定（ユーザー確認 needed）

- 2ボタンの正確な意味: 「フォルダ展開」=work folder+画像ファイル保存、「画像別保存」=work folderなしで画像ごとに直接保存という解釈（推奨）。もう一方の解釈: 画像ごとに Chrome ダウンロード項目として1件ずつ出す（folder モードでは現状 already 画像ごとに saveFile=1 download item）。
- override はクリック1回分のみ（設定は変更しない）という前提。
- 並行タスク: `2026-11-10-mv3-chrome-basic-function-audit.md` が実装開始指示待ちで進行中。

## 合格条件と検証方法（委譲実行）

- `yarn build`（Chrome）と `yarn test`（jest）が通過。新規 spec に override 判定を含む。
- 画面確認: ユーザー指示（2026-11-10 04:22）により手順の「Playwright」は Chrome MCP（chrome-devtools MCP）へ読み替え。before/after スクリーンショットと確認 txt を `playwright-confirmation-rule` の保存規則（`I:\マイドライブ\kilo\2026-11-10-download-button-split\`）で残す。ボタンA/Bそれぞれの操作前後（download実行 → 保存結果の表示）を記録。
- 画面確認ができない項目は未検証扱い（合格しない）。ブラウザは項目終了時に閉じる（chrome-devtools MCP にブラウザ終了操作がない場合はその旨と理由を結果に残す）。
- ブラウザ本体の識別条件（実プロセス確認で確定）: コマンドラインに `C:\Users\fujim\.cache\chrome-devtools-mcp\chrome-profile` を含む chrome.exe（MCPサーバー本体の cmd/node は除く）。委譲前に残存あり（監査時からのブラウザ）。

## Verification

（記入）

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
