# バージョン設定・ビルド・リリースpush（6.4.3-fork3相当）

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: version確認（manifest/package.json）→決定→yarn build→zip→GitHub release+tag push→記録commit+push

## 意図 / 背景

ユーザー指示（2026-11-11 09:53): バージョン適切に設定しビルド、リリースビルドとしてpush。fork2（tag `6.4.2-fork2`、package.json version 6.4.2）以後の変更: legacy mode廃止（6241e87）、設定画面掃除（f16dba9）、AppSuggest削除（915ba5a）→ 挙動変更あり、patch bump相当。

## 調査結果 / 変更内容

- versionは `package.json` のみ（manifest.json无version、webpack background config line 63で `json.version = packageInfo.version` 注入）。UI表示「Next v6.4.2」もpackage.json由来。
- 決定: `package.json` version `6.4.2` → `6.4.3`。GitHub tag/releaseは `6.4.3-fork3`（fork表記の正典惯例は tag接尾辞 `-forkN`、manifestは数字のみ）。
- 変更: `package.json` version 1行。

## Verification

- `yarn build`（chrome）exit=0、`dist/chrome/manifest.json` version=6.4.3（grep照合）✓
- zip（dist/chrome、manifest.jsonルート）10,422,870 bytes → GitHub release `6.4.3-fork3` 作成 ✓ https://github.com/BWDSF3104/webextension-pixiv-toolkit/releases/tag/6.4.3-fork3
- `yarn test` 11 passed
- code分 `2ba2206` push済み。記録分単独コミット+push。UI画面確認は不要（version注入のみ・Playwright項目なし）

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
