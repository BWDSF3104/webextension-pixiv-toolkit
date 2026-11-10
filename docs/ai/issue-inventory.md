# Issue Inventory

全既知問題の索引。個別エントリは `known-issues/`（解決済みは `known-issues/archive/`）。

| ID | Title | Status | Related |
|----|-------|--------|---------|
| KI-20261110-01 | epub 生成不可（MV3 の eval 禁止） | 保留（上流待ち） | `src/statics/lib/js-epub-maker`, `handlebars-latest.js` |
| KI-20261110-02 | AGENTS.md の Vue バージョン記述 | 解決済み（archive） | `AGENTS.md`, `package.json` |
| KI-20261110-03 | AGENTS.md の上流ブランチ名 | 解決済み（archive） | `AGENTS.md`, `docs/ai/workflows.md` |
| KI-20261110-04 | `statics/lib` の gifjs / whammy（上流 readme の削除記述が古い） | 解決済み（archive） | `src/statics/manifest.json`, `src/content_scripts/modules/Legacy/UgoiraGenerator/` |
| KI-20261110-05 | Node 24 の engine / OpenSSL で検証コマンドが通らない | 回避策運用中 | `package.json`（engines）, `config/webpack.base.config.js` |
