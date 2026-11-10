# Memory Bank Guide

運用・命名規則・`task_manager` の呼び出しは正典 `S:\Documents\Kilo_Commons\Common_Operations\docs\ai\memory-bank-guide.md` に従う。ここには本プロジェクト固有の項目のみ書く。

## 本プロジェクトの実際の構成

```
docs/ai/
├── memory-bank-guide.md     # このファイル
├── architecture.md          # 本プロジェクトのシステム構成
├── api-rate-limits.md       # Pixiv 系 API の制限記録
├── workflows.md             # フォーク運用（上流取り込み・検証・動作確認）
├── decisions/               # 1エントリ1ファイル（YYYY-MM-DD-short-name.md）
├── known-issues/            # 1エントリ1ファイル（KI-YYYYMMDD-NN-short-name.md）。解決済みは archive/
├── tasks/                   # 1タスク1ファイル。雛形は tasks/TEMPLATE-README.md
├── reference/               # 常設参照（1エントリ1ファイル。アーカイブしない）
└── tmp/                    # スクラッチ（gitignore、7日で削除）
```

`current-task.tsv` は `task_manager` が作成・更新する（edit ツールで直接編集しない）。`decisions.md` / `known-issues.md` / `plans.md` / `issue-inventory.md` / `backlog.md` はインデックスとして使う。

## 上流由来のドキュメント

`docs/help.md` と `readme.md` は上流のユーザーヘルプ・リリース説明。フォーク側で書き換えない（上流 merge で更新される）。上流の記載と実コードが食い違った場合は `known-issues/` に記録する。
