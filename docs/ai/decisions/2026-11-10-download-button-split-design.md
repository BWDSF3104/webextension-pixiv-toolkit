# 2026-11-10 ダウンロードボタン分割の設計（推奨案承認）

**Task**: docs/ai/tasks/2026-11-10-download-button-split.md
**承認**: 2026-11-10 04:20 ユーザー「推奨で承認」

## 決定

- ボタンA（フォルダ展開）: saveMode=1（folder保存）+ work folder 作成。
- ボタンB（画像別保存）: saveMode=1 + work folder 作成なし（dontCreateWorkFolder=2 の挙動）。
- 選択はクリック1回分（タスク単位 override）。グローバル設定は変更しない。override 未指定時は設定 follow（undefined）。
- Ugoira はスコープ外（単一換算ファイル生成のため）。
- 実装形: `MultipleDownloadTaskOptions.saveMode`、`shouldZipFile()` / `dontCreateWorkFolder()` 冒頭の override 参照、`App.vue` 非ugoiraボタン2分割、en/zh_CN ロケール追加、jest spec 1本。
- 不採用: 画像ごとにダウンロード項目/タスクを作り分ける解釈（候補2）。同一挙動になるため不要。

supersedes: なし（新決定）。UI label 決定（2026-11-10-ui-label-distinction-and-pixiv-omina-hidden）には影響しない（新ボタンは button のまま）。
