# Decisions

1エントリ1ファイル（`decisions/YYYY-MM-DD-short-name.md`）。このファイルはインデックス。

## Active

- `decisions/2026-11-02-tests-may-call-external-api.md` — テストの外部 API 呼出しを可。条件: `api-rate-limits.md` の制限、mock 維持、スクラッチ/明示テストモードでの実呼出し、 Secrets をコードに書かない。

作成後の決定は修正しない。上書きする場合は新ファイルを作り、旧ファイル冒頭に `**Superseded by**: <新ファイル名>` を追加する。
