# Pixiv 資格情報の保管場所はプロジェクト内の gitignored `.env`

**Date**: 2026-11-10

## 決定

- Pixiv 資格情報はプロジェクト直下の `.env` に保管する。
- `.gitignore` に `.env` を追加し、git 管理対象にしない。
- `docs/ai/tmp/` は正典 archive で消えるため、資格情報保管場所として使用しない。

## 保管場所

- `S:\Documents\Kilo_Commons\webextension-pixiv-toolkit\.env`

## 変数名

- `PIXIV_EMAIL`
- `PIXIV_PASSWORD`

## 運用

- task file には credentials を書かず、保管パスと変数名だけ書く。
- 旧 `docs/ai/tmp/pixiv_credentials.local.md` と external temp の一時コピーは Recycle Bin へ削除した。
