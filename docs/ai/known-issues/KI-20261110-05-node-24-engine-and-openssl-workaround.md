# Node 24 では依存インストールと webpack 4 ビルドが既定手順で通らない

**Date**: 2026-11-10

## 症状
- `yarn install` が engine チェックで失敗（`package.json` の engines は `node ~16.18.0`。実環境は Node 24.22.1）
- `yarn build` が `ERR_OSSL_EVP_UNSUPPORTED`（webpack 4 の md4 ハッシュが OpenSSL 3 で不可）

## 原因
プロジェクトの engine 指定が Node 16 系で固定。実行環境の Node が 24。

## 影響
検証コマンド（`npx jest` / `yarn build`）が素のコマンドでは成立しない。ビルド検証がブロックされる。

## 回避策（確認済み）
- `npx --yes yarn@1.22.4 install --ignore-engines`（331.5s）
- `$env:NODE_OPTIONS='--openssl-legacy-provider'` を設定して `build` / `build:firefox`（16.98s / 20.49s）
- 実行環境に `yarn` がない（`npx --yes yarn@1.22.4` で代用）。Node 16 を使うなら engine 指定どおりで回避策は不要

## Status
回避策運用中（engine 指定の変更は未実施）
