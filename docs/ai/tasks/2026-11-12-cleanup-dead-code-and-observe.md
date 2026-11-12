# 未参照の確定したデッドコード掃除と残項目の実機観測

**Status**: 進行中
**Date**: 2026-11-12
**Next Action**: grepで参照ゼロを確定→kilo-safe-remove→build+testで再確認。item8はpixiv読込で注入JS計測、item17/2bはログイン済みで実DL観測(無ければ観測手順記録)

## 意図 / 背景

（記入）

## 調査結果 / 変更内容

（記入）

## Verification

（記入）

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
