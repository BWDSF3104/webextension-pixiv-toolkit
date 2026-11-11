# fork使い方の手順書（6.4.2-fork1）

上流（webextension-pixiv-toolkit）のフォーク。以下は実測済みの挙動にもとづく手順です（2026-11-10〜11）。

## インストール

1. `yarn install` → `yarn build`（Chrome）で `dist/chrome` を生成
2. `chrome://extensions` で Load unpacked により `dist/chrome` を読み込む（Manifest V3）
3. forkのリリースは GitHub の `6.4.2-fork1`

## 既定モード（ダウンロードマネージャ）

- 新しいPC・新規プロファイルの既定はダウンロードマネージャ。作品画面にA/Bボタンが出ます。設定を変えなくても即使えます。
- 既存プロファイルは保存済みの値のまま（上書きされません）。legacyのままならlegacyのままです。

## A/Bボタン

- A「DL to folder」: 作品名のwork folderを作り、その中にファイル単位で保存（複数枚作品向け）
- B「DL per image」: work folderを作らず、ダウンロードフォルダ直下にファイル単位で保存（どのタイプでも使用可）
- 選択はクリック1回分だけ。グローバル設定は変わりません（設定追従はlegacyのDownload等だけ）
- 1枚作品でAを押すとfolder内に1ファイルとなり、Bとの差が出ます
- ボタンはpanelを開いた状態でのみ押せます

## Select & DL dialog

- `Select & DL` を押すと選択dialogが開きます
- footerは2行。1行目=選択（Select All / Unselect All / Select Invert）、2行目=ダウンロード（DL to folder / DL per image）とClose
- 選択したpageだけが保存対象。未選択のあいだdownload行はdisabled
- forkでこのdialogのDownload（zip＝設定追従）buttonはA/Bに置き換えられています

## 色分け（3群・白文字）

- 選択系 青 `#0b74c4`: `Select & DL` buttonとdialogの選択行
- ダウンロード系 緑 `#0a7d46`: A/B buttonとdialogのdownload行
- クローズ 灰色 `#5b6b78`: dialogのClose

## Ugoira

- Ugoira作品は换算button（GIF / APNG / WEBMなど）で、A/Bの効果はありません（単一の換算ファイル生成のため）
- legacy modeでは換算buttonはすべて「Ugoira (zip, follows settings)」表示。 フォーマットの区別はprogress textのみ

## 上流設定とoverrideの関係

- 設定の `Download save mode`・`Create zip file`・`Do not create work folder` は、A/Bボタン使用時は上書きされます（クリック単位のoverride。設定自体は変わらない）
- 設定追従が効くのはlegacy modeのDownload等のみ
- 設定画面のこれら3項目には注記（overrideされる旨の1文）が表示されます

## Pixiv Omina

- forkでは拡張UIから非表示（button削除済み）。既存設定がONでも表示されません

## legacy mode でのfork label

- legacy modeのDownload buttonは「Download (zip, follows settings)」と表示されます
- この文言は設定がzip（downloadSaveMode=0）のときの意味です。設定がfolder保存のとき、実挙動は設定どおりfolder保存になり、文言の「zip」と一致しません（追従＝設定が正しい）
