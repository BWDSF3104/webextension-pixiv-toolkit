# webextension-pixiv-toolkit

Pixiv Toolkit Next（Chrome/Firefox 拡張機能）のフォーク。upstream: `leoding86/webextension-pixiv-toolkit`（origin = `BWDSF3104/webextension-pixiv-toolkit`）。

## 共通規約

言語・実装開始ゲート・ターミナル安全・コマンド実行ルール・コード検証の共通条・Memory Bank 運用・commit message 規約は global 正典 `AGENTS.md`（`C:\Users\fujim\.config\kilo\AGENTS.md`）を参照。このファイルにはプロジェクト固有項目のみ記載する。

## コード検証（本プロジェクト）

- 依存インストール: `yarn install`（`yarn.lock`）・Node 16 系
- ビルド: `yarn build`（Chrome）/ `yarn build:firefox`（Firefox）
- テスト: `npx jest`（`package.json` に `test` script は無い。`jest.config.json` + `test/*.spec.js`）
- 上流取り込み後: `git fetch upstream` → `git merge upstream/master`（上流の既定ブランチは `master`）してからビルド＋テスト
- テストの外部 API 呼出し: 可（決定: `docs/ai/decisions/2026-11-02-tests-may-call-external-api.md`）

## Development

- ウォッチビルド: `yarn dev`（`PLATFORM_ENV=chrome`）/ `yarn dev:firefox`
- 部分ウォッチ: `yarn dev:cs`（content script）/ `yarn dev:op`（options page）/ `yarn dev:bg`（background）
- 出力: `dist/chrome`, `dist/firefox`（`.gitignore` 対象）
- 動作確認: `chrome://extensions` で `dist/chrome` を Load unpacked（Manifest V3）

## Code Standards

- JavaScript (ESM) + Vue 2.6 / Vuetify 1（options page）・Babel・webpack 4
- 上流の既存スタイル（2 space・`.editorconfig`）に従う。フォーク固有の変更は `src/modules/` 配下の既存モジュール単位で最小限に閉じる
- ロケール: `src/statics/_locales/`（en / zh_CN）。新規文言は両ロケールに追加

## Documentation

- Memory Bank のファイル構成・更新タイミングは `docs/ai/memory-bank-guide.md` を参照
- Git Workflow・Commit Checklist は `docs/ai/workflows.md` を参照

## Project Structure

```
webextension-pixiv-toolkit/
├── src/
│   ├── background/       # service worker（modules/services/updates）
│   ├── content_scripts/  # ページ側注入（components/modules/styles）
│   ├── core/browser/     # 拡張 API のブラウザ差異吸収
│   ├── modules/          # Browser Db Extension Manager Net PageResource Parser Ports Util Workers
│   ├── options_page/     # ダウンロードマネージャ（Vue 2.6・router・services）
│   ├── popup_page/
│   ├── repositories/
│   ├── errors/ mixins/ config/
│   └── statics/          # manifest.json, _locales, lib（ffmpeg・dexie・jszip 等）
├── config/               # webpack 分割設定（base/common/bg/op/cs/popup）
├── test/                 # jest（*.spec.js）
├── dist/                 # ビルド出力（追跡外）
└── docs/help.md          # 上流のユーザーヘルプ
```
