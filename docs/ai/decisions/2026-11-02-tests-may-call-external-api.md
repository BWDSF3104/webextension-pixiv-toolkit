# webextension-pixiv-toolkit のテストは外部 API を呼べる

**Date**: 2026-11-02

## Decision

テストでの外部 API 呼出しを**可**とする。プロジェクト依存方針の変更（`S:\Documents\Kilo_Commons\Common_Operations\docs\ai\decisions\2026-11-02-test-external-api-policy-per-project.md`）に基づく本プロジェクトの決定。

## 運用条件

- `docs/ai/api-rate-limits.md` のレート制限を守る
- Secrets（Pixiv 認証情報・トークン）をテストコードに埋めない。テストは `.env` / 環境変数の値を使う
- 呼び出し回数を増やさない。既存 jest テストは可能な限り mock のまま維持する
- 実呼出しを伴う検証は `docs/ai/tmp/` のスクラッチスクリプト、または明示的なテストモードで行い、`npx jest` の既定収集に混ぜない

## Impact

- `AGENTS.md`（コード検証条）に方針と本決定への参照を追加
- `docs/ai/api-rate-limits.md` の Test Script Guidelines から禁止記述を削除し、本決定への参照へ変更
