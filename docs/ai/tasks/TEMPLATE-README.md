# Task Record Template

1タスク1ファイル。`task_manager add` が `docs/ai/tasks/YYYY-MM-DD-short-name.md` を作成する（手書きしない）。

必須フィールド:

```
# [Task Title] (YYYY-MM-DD)

**Status**: 計画中 / 進行中 / 完了
**Date**: YYYY-MM-DD
**Backlog**: backlog.md の該当項目（該当時）

## 意図・背景

## 調査結果 / 変更内容

## Verification
- `[command]`: [結果]（推測ではなく実測）

## 完了時 Memory Bank 操作チェックリスト
- [ ] `current-task.tsv` の参照行を削除（`task_manager end`）
```
