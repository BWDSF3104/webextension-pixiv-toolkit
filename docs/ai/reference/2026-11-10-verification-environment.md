# 検証環境と検証コマンド（2026-11-10 時点）

- Node: 24.22.1（`package.json` engines は `>=16.18`。dev / build script に `NODE_OPTIONS=--openssl-legacy-provider` 組込み済み）
- yarn: 1.22.22 を global install（正典 lockfile は `yarn.lock`。npm で入れると lockfile が diverge するため yarn を使う）
- `yarn install`: 0.76s（Already up-to-date）
- `yarn test`: 7 passed / 1 suite、0.941s
- `yarn build`: 11.33s → `dist/chrome`
- `yarn build:firefox`: 10.14s → `dist/firefox`
- `yarn dev`: ウォッチ起動を確認。単発コンパイル（`webpack --config config/webpack.content-scripts.config.js`）成功、`APngGenerator.worker` chunk 生成

## 判定

webpack 4 のまま維持。webpack 5 へ更新すると `uglifyjs-webpack-plugin`（webpack 5 で不可）の置換、Node core module polyfill 既定停止、`worker-loader` / `mini-css-extract-plugin` / `html-webpack-plugin` の整合確認が必要で、上流 build 設定全体を変える。検証が通ることに対して不要。
