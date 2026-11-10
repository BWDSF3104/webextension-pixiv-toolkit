# API Rate Limits

本プロジェクトが呼ぶ外部 API の制限記録。テスト呼出しは決定 `docs/ai/decisions/2026-11-02-tests-may-call-external-api.md` の条件に従う。

## Rate Limit Table

| Service | Rate limit | Notes |
|---|---|---|
| `www.pixiv.net/ajax/illust/{id}`・`/pages`・`/ugoira_meta`・`illust/unlisted/{id}` | 公表値なし・未計測 | 呼び出し元 `src/modules/Parser/Pixiv/` |
| `comic.pixiv.net/api/app/episodes/{id}/read_v4` | 公表値なし・未計測 | 呼び出し元 `src/modules/Parser/PixivComic/` |
| Fanbox API | 公表値なし・未計測 | 呼び出し元 `src/modules/Parser/Fanbox/` |

## Guidelines

- 呼出し回数を増やさない。既存 jest テストは可能な限り mock のまま維持する
- 実呼出しを伴う検証は `docs/ai/tmp/` のスクラッチスクリプト、または明示的なテストモードで行い、`npx jest` の既定収集に混ぜない
- 時間ベースのレート制限は実装されていない。制御は `src/modules/Queue.js` の `processors`（同時数、既定 1）のみ
- Pixiv 認証情報・トークンはテストコードに埋めない。`.env` / 環境変数の値を使う
