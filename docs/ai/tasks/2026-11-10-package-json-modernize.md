# package.json を実行環境に合わせて最新化（engines / NODE_OPTIONS）

**Status**: 完了
**Date**: 2026-11-10

## 意図 / 背景

素のコマンドが実行環境（Node 24.22.1）で通らなかった: engines が `~16.18.0` で yarn の engine チェックが失敗、webpack 4 の md4 ハッシュが OpenSSL 3 で `ERR_OSSL_EVP_UNSUPPORTED`。回避策を外側（`--ignore-engines`・環境変数）で毎回指定する状態は検証可能とは言えない。プロジェクト側 `package.json` を実行環境へ合わせた。webpack 5 への更新は検証が通じるために過剰（`uglifyjs-webpack-plugin` の排除など別作業が必要）なので不要と判断。

## 調査結果 / 変更内容

- `package.json` engines: `~16.18.0` / `~8.19.2` / `~1.22.4` → `>=16.18.0` / `>=8.19.0` / `>=1.22.0`
- `package.json` scripts: dev / dev:firefox / dev:cs / dev:op / dev:bg / build / build:firefox の7本に `cross-env NODE_OPTIONS=--openssl-legacy-provider` を追加（`test` は前タスクで追加済み）
- 決定: 上流の webpack 4・Babel 構成は維持。toolchain 更新は本タスクの範囲外
- `docs/ai/workflows.md` と `AGENTS.md`（Code Standards/検証条）を実行環境の実態へ更新
- shortcut の限定: `--openssl-legacy-provider` は将来の Node / OpenSSL で除去される前提の回避策。webpack 5 へ更新すれば不要になる

## Verification

- `npx --yes yarn@1.22.4 install`（フラグなし）: engine チェック通過。0.53s（Already up-to-date）
- `$env:NODE_OPTIONS=''` のうえで `npx --yes yarn@1.22.4 build`: 成功 11.97s（`dist/chrome`）
- `npx --yes yarn@1.22.4 build:firefox`: 成功 12.22s（`dist/firefox`）
- `npx --yes yarn@1.22.4 test`: 7 passed / 1 suite、0.959s
- 未確認: `yarn dev` のウォッチ動作、`chrome://extensions` での実機確認

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
