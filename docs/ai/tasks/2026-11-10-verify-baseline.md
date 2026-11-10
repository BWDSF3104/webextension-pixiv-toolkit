# 検証可能な状態の回復（依存インストール・test script）

**Status**: 完了
**Date**: 2026-11-10

## 意図 / 背景

検証コマンド（`npx jest` / `yarn build`）が実行環境で成立せず、変更の合否を証拠で示せなかった。依存をインストールし、`test` script を追加して、テストとビルドが実際に走る状態にする。

## 調査結果 / 変更内容

- `package.json`: `"test": "jest"` を追加（scripts 1行）。追加前は `yarn test` が `Command "test" not found` で失敗
- 実行環境は Node 24.22.1（engines は `~16.18.0`）。`yarn` は未インストール → `npx --yes yarn@1.22.4` で代用
- engine チェックと OpenSSL 3 の問題 → 回避策を `docs/ai/known-issues/KI-20261110-05-node-24-engine-and-openssl-workaround.md` に記録。`docs/ai/workflows.md` の Commit Checklist に回避策を反映
- `docs/ai/tmp/` を `.gitignore` へ追加（前タスクの延续）

## Verification

- `npx --yes yarn@1.22.4 install --ignore-engines`: 成功（331.50s）
- `npx jest`: 成功。Test Suites 1 passed / Tests 7 passed、100% カバレッジ、3.518s
- `NODE_OPTIONS=--openssl-legacy-provider` + `build`: 成功（16.98s）。`dist/chrome` に `manifest.json`・`_locales`・`background`・`content_scripts`・`options_page`・`popup_page` を生成
- `NODE_OPTIONS=--openssl-legacy-provider` + `build:firefox`: 成功（20.49s）。`dist/firefox` を生成
- 未確認: 拡張を実ブラウザ（`chrome://extensions`）に読み込んだ動作確認は未実施

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
