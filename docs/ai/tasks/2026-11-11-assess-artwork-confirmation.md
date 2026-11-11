# 作品画面機能確認（新インストール相当・既定downloadMode=2）

**Status**: 完了
**Date**: 2026-11-11
**Next Action**: 子委譲: fresh相当テストインスタンスでdist/chrome install→artwork page確認（A/B button緑・Select & DL dialog・Ominaなし）→before/after+txt Drive保存→記録コミット

## 意図 / 背景

ユーザー指示（2026-11-11 06:56）「作品画面での機能も確認」。既定変更（decision 2026-11-11-default-download-mode-manager）後の新インストール相当で、作品画面（content UI）のfork機能を確認する。実装変更なし、確認専用項目。

## 調査結果 / 変更内容

実行固有ID: assess-settings-fork-inconsistencies / 項目5（確認専用・コード変更なし）
確認内容（新インストール相当・storage seed後 downloadMode=2）:
- 作品画面にA/B button（DL to folder / DL per image）が表示され、download系 緑 `#0a7d46` であること
- `Select & DL`（選択系 青 `#0b74c4`）と dialog footer（選択系3＋download系2＋close  grey `#5b6b78`）の表示
- Pixiv Omina button/要素なし
- legacy mode（user切替後）のfork label表示は項目4で確認（本項目は既定モードのみ）

## Verification

- 合格条件: 上記確認＋before/after スクリーンショットと確認txtを `I:\マイドライブ\kilo\2026-11-11-assess-artwork-confirmation\` へ保存（playwright-confirmation-rule、chrome-devtools MCP、local copy `kilo-safe-remove`）。確認結果と保存先をタスク記録へ記載。画面確認不可なら未検証扱い（合格しない）。項目終了時にpage閉じる（識別条件は要約参照）。
- 確認は新インストール相当インスタンス（fresh seed、storage値は変更しない）で行う。既存プロファイルの値を汚染しない。

### 確認結果（2026-11-11 合格）

- 新インスタンス: `yarn build`（成功・9.30s）後、dist/chrome を `scratch\ptk-fresh-item5`（別パス）から chrome-devtools MCP で install → instance ID `hakfmpdifangacgmjmdggpedajmclfal`（既存 `nccfhdinjmbjnlgnmmgglmenmaacgagf` と別・fresh storage）。
- storage 実測（options page context・chrome.storage.local.get）: `downloadMode=2`、keyCount=92（fresh install seed、src/background/Application.js:135・src/config/default.js:255）。既存インスタンスstorageは未変更。
- 作品page 151753981（非ugoira・2枚、登录プロファイル既存、window outer 945x1020・viewport 932x871・dpr2）で確認（getComputedStyle 実測）:
  1. A/B button「DL to folder」「DL per image」= `button--download`、背景 rgb(10,125,70)=`#0a7d46` → 合格
  2. 「Select & DL」= `button--select`、背景 rgb(11,116,196)=`#0b74c4`；dialog footer 2行表示（選択系3=青、download系2=緑、close=grey rgb(91,107,120)=`#5b6b78`）→ 合格
  3. Pixiv Omina button/要素: DOM検索0件 → 合格
  4. 既定モード=マネージャUI: seed downloadMode=2 かつ渲染UIがA/B＋page-selector（App.vue のみの構成。AppLegacy該当なし）→ App（マネージャUI）で渲染、合格
- before→after 変化: `Select & DL` click で selection dialog（"Select page(s) you want to download"）closed→open（footer 2行が視覚表示）。before=install直後の作品画面、after=dialog open。同一window size・同一full page範囲・同一取得方法。
- Drive保存: `I:\マイドライブ\kilo\2026-11-11-assess-artwork-confirmation\` → `artwork-151753981-before-20261111.png` / `artwork-151753981-after-20261111.png` / `artwork-confirmation-2026-11-11.txt`。local copy（scratch）は `kilo-safe-remove` でゴミ箱へ送った（Drive側保持）。
- ブラウザ: 記録完了後page閉→識別条件一致 chrome.exe（MCPサーバー除く）終了、残存0確認（実施）。

## 完了時 Memory Bank 操作

- [ ] `current-task.tsv` の参照行を削除
- [ ] 解決した `known-issues/` ファイルを `known-issues/archive/` へ `mv`（該当する場合）
- [ ] `backlog.md` の完了項目を削除（該当する場合）
