# yarn の global install と検証環境の記録（webpack 4 維持の判定）

**Status**: 完了
**Date**: 2026-11-10

## 意図 / 背景

検証コマンドが `npx --yes yarn@1.22.4` 頼みだった。正典 lockfile は `yarn.lock` なので、npm へ切り替えると lockfile が diverge する。yarn を global に入れて素のコマンドで再現可能にする。あわせて toolchain 更新（webpack 5）の要否を判定し、環境の事実を常設参照へ記録する。

## 調査結果 / 変更内容

- yarn 1.22.22 を global install（ユーザー承認済み。プロジェクト範囲外の変更）
- `docs/ai/reference/2026-11-10-verification-environment.md` を作成。`docs/ai/memory-bank-guide.md` の構成に `reference/` を1行追加
- 判定: webpack 4 を維持。webpack 5 は `uglifyjs-webpack-plugin`（webpack 5 で不可）の置換、Node core module polyfill 既定停止、`worker-loader` / `mini-css-extract-plugin` / `html-webpack-plugin` の整合確認が必要で、検証が通ることに対して不要
- 注意: ファイル変更の commit `a4077d7` はこのタスク記録より先に作成済み
- VS Code 再起動（正典 `vscode_graceful_restart.py --new-window`）は PATH 更新のため実施 — 既存ウィンドウのターミナルは install 前の環境 snapshot を持っていた

## Verification

- `yarn --version` → 1.22.22
- `yarn install`（フラグなし） → 成功 0.76s（engine チェック通過）
- `yarn test` → 7 passed / 1 suite、0.941s
- `yarn build` → 成功 11.33s（`dist/chrome`）
- `yarn build:firefox` → 成功 10.14s（`dist/firefox`）
- `yarn dev` → ウォッチ起動を確認。単発コンパイル（`webpack --config config/webpack.content-scripts.config.js`）成功、`APngGenerator.worker` chunk 生成
- 未確認: ウォッチの完了行（`Compiled successfully`）を停止前に確認できず、`chrome://extensions` での実機確認も未実施

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
