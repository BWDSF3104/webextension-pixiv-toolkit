# ugoira MP4/ffmpeg を退役し webm/gif/apng を pure-JS ジェネレータへ配線（2026-11-12）

## 決定

download manager（options page）の ugoira 変換を、`convertType` に応じて `GifGenerator` / `WebmGenerator` / `ApngGenerator` を直接使う形へ配線し、ffmpeg 系（MP4 変換・custom ffmpeg CLI）を機能ごと退役した。

## 理由

- ffmpeg.wasm 0.11.x は MV3 拡張ページで二重に非互換（pthread=SharedArrayBuffer 不可・blob importScripts が CSP ブロック、`KI-20261112-01`）。core 同封では直らず、0.12.x 自作ブリッジは中規模改修+ログイン環境での実機検証が前提。
- 一方 webm（whammy・メインスレッドのみ）、gif（gif.js + 同封 worker・25c2c7c で実測済）、apng（UPNG.js npm 同梱・メインスレッド）は MV3 CSP を通過することが確認済みで、content script 側で既に使われているジェネレータをそのまま流用できる。
- mp4 は「copy（無変換）で mp4 コンテナに詰めるだけ」の実装で、ffmpeg が動かなかった現在も使えていた経路がゼロ。失う実機能がゼロのため削除した。

## 変更の概要

- `UgoiraDownloadTask.js`: コンストラクタで `convertType`（gif/webm/apng）からジェネレータを解決、未対応は `RuntimeError('NOT_SUPPORT_CONVERT_TYPE')`。`runFFmpeg`・ffmpeg 分岐を削除
- `ApngGenerator.js`: worker-loader（blob worker、CSP 不可）をやめ `APNG.encode` 直接呼び出しへ。`APngGenerator.worker.js` 削除
- `GifGenerator.js`: `GlobalSettings().ugoiraQuanlity` へ変更（CS グローバル `$extension` 依存を排除）
- `downloads.html`: `lib/gifjs/gif.js`・`lib/whammy.js` を script 追加、ffmpeg.min.js 参照削除
- UI: CS の mp4/custom ボタン、`UgoiraOptions.vue` の ffmpeg カスタム CLI、`UgoiraConverterOption.vue`、`default.js` の ugoiraFFmpeg* 系キー、`ThirdParty.vue` の ffmpeg.wasm クレジットを削除
- ビルド: `webpack.background.config.js` の ffmpeg/pouchdb（参照ゼロの dead copy）コピー規則と `FFmpeg` external、`webpack.base.config.js` の worker-loader 規則を削除
- `src/statics/lib/ffmpeg/`、`ContentPageDownloadManager.js`（参照ゼロ）を削除

## supersede

- `2026-11-12-epub-sandbox-and-ffmpeg-deferred.md` の「ffmpeg は 0.12.x ブリッジ移行は別タスクで保留」→ 移行ではなく退役で決着（`KI-20261112-01` は解決としてアーカイブ）

## 補記

- jest は `dist/` を haste map に取り込み `upng-js` の重複衝突で落ちるため、`jest.config.json` に `modulePathIgnorePatterns: ["<rootDir>/dist/"]` を追加
- `_locales` の ffmpeg 関連文言と HISTORY の記載は歴史記述・無害として残置
