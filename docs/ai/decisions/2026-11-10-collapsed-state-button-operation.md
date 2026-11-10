# 2026-11-10 畳んだ状態でのボタン操作（再実測）

**Task**: docs/ai/tasks/2026-11-10-download-button-split.md

## 決定（実測で確定）

- panelの既定（`autoActivateDownloadPanel=false`）は畳んだ状態（`ptk__container__body--collapse`）。畳んだ状態ではボタンは押せない（click toolは「interactiveでない」と判定、操作前画像で非表示確認）。
- 操作経路はhandler arrow（`#ptk__new-handler`）で展開 → 展開後にボタン click。ボタン自体の実装は状態によらず押下可（handler clickでcollapseがtoggles）。

supersedes: 該当なし（操作経路の明確化。試行2の実測は展開した状態で行われた — 試行2のtxtに操作前画像・collapsed/expandedの記録がなく確証はない。この決定はその確証を補強する再実測）。
