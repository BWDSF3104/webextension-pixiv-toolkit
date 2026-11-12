# ダウンロード成功後の自動いいねオプション

**Status**: 完了
**Date**: 2026-11-12
**Next Action**: 実装: PixivBookmark一般化 + autoLikeAfterDownload設定 + like送信

## 意図 / 背景

「ダウンロード成功後の自動お気に入り」(2026-11-12 完了) の拡張で、「いいね」も自動で行うオプションを追加する。設計合意・実装開始指示済み（2026-11-12）。
※別タスク `2026-11-10-mv3-chrome-basic-function-audit` は残件が指示待ち保留のため並行実施。

## 調査結果 / 変更内容

### 設計（確定）

- 設定キー `autoLikeAfterDownload`（既定 false、お気に入りとは独立スイッチ）。
- いいね API: `POST https://www.pixiv.net/ajax/illusts/like` body `{illust_id}`。ヘッダ・CSRF・credentials は bookmarks/add と同一（`PixivBookmark.js` を認証付き same-origin POST 実行器に一般化して共用）。
- いいねは illust/manga/ugoira のみ対象（小説にいいね機能は無い）。
- 1タスク完了で最大 2 action（favorite + like）を同じ pixiv.net タブの content script へ順に送信。応答数分受信でポート切断。
- いいねのレート制限・既にいいね済みの場合等は Pixiv 側がエラーを返す → 従来どおりログのみ。

### 変更ファイル

1. `src/content_scripts/modules/PixivBookmark.js` — named export に変更（`bookmark` + `like`、共通の POST 関数）
2. `src/content_scripts/Bootstrap.js` — `type:'like'` 分岐追加
3. `src/options_page/modules/AutoFavorite.js` — `resolveActions(task, settings)` に変更（favorite/like アクションリスト生成）
4. `src/config/default.js` — `autoLikeAfterDownload: false` 追加
5. `src/options_page/components/options/DownloadOptions.vue` — スイッチ追加
6. `src/statics/_locales/{en,ja,zh_CN}/messages.json` — ロケール2キー×3ファイル
7. `test/AutoFavorite.spec.js` — action 解決ケースへ更新 + tryFavorite は port 切断条件に追従

### テスト計画

- 単体: `yarn test`
- ビルド: `yarn build` / `yarn build:firefox`
- 手動（要ログイン環境）: ON→DL→Pixiv 側で「いいね」済みになること、OFF で動作しないこと、novel で like が飛まないこと

## Verification

- 単体: `yarn test` → Test Suites: 7 passed / Tests: 37 passed（`test/AutoFavorite.spec.js` を action 解決 4 + tryFavorite 3 に更新、いいねの順・novel 除外・全応答受信後の切断を検証）
- ビルド: `yarn build` → exit=0、`yarn build:firefox` → exit=0。`dist/chrome/content_scripts/app.js` に `illusts/like` 反映を確認
- 手動確認（未実施・要 Pixiv ログイン環境）: ON→DL→Pixiv 側で「いいね」済みになること、OFF で動作しないこと、novel では like が飛まないこと

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
