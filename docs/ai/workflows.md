# Workflows

## Git Workflow

### Branch Strategy
- `master`: 上流フォークの既定ブランチ（`origin/HEAD` → `origin/master`）。上流取り込み先
- `develop` / `next`: 上流側の作業ブランチ（取り込み時に確認）
- Feature branches: `feature/short-description`
- Bug fix branches: `fix/short-description`

### 上流取り込み
1. `git fetch upstream`
2. `git merge upstream/master`（上流の既定ブランチは `main` ではなく `master`）
3. `yarn install` → `npx jest` → `yarn build` / `yarn build:firefox`

### Commit Checklist
Before every commit:

1. **Run verification**:
   - JS 変更: `npx jest`（`package.json` の `test` script から呼ぶ）
   - ビルド影響変更: `yarn build`（Firefox 向け変更は `yarn build:firefox`）
   - Both: run both commands
   - Node が engines（`~16.18.0`）と違う場合: `yarn install --ignore-engines`、ビルドは `NODE_OPTIONS=--openssl-legacy-provider` を設定して実行（known-issues KI-20261110-05）
2. **Check diff**: `git diff --cached` to review staged changes
3. **Check status**: `git status` to ensure only intended files are staged
4. **Never commit secrets**: Verify no API keys, tokens, or credentials in diff
5. **Write commit message**:
   - Prefix: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
   - Description in Japanese

### Commit Message Format
```
[type]: [日本語の説明]

[Optional detailed explanation]
```

Examples:
- `feat: 新機能の実装`
- `fix: バグ修正`
- `docs: ドキュメント更新`
- `refactor: コード整理`

## 動作確認

このプロジェクトにデプロイ先はない。確認はビルド成果物をブラウザに読み込んで行う:

1. `yarn build` が成功すること（`dist/chrome`）
2. `chrome://extensions` で `dist/chrome` を Load unpacked（Manifest V3）
3. pixiv ページでアクションパネル → ダウンロードマネージャへの送信 → 保存まで確認
4. Firefox 向け変更は `yarn build:firefox` 後、`dist/firefox` で確認（上流は未テスト）
5. 確認結果をタスクファイルの Verification に記録
