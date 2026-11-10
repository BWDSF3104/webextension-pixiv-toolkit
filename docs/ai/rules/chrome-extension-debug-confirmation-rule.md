# Chrome拡張のデバッグ・画面確認ルール

**Date**: 2026-11-10

## 前提

- 確認には Chrome DevTools MCP を使う。
- 拡張 tool は `--categoryExtensions` が有効な pipe connection で使う。`--autoConnect` / `--browserUrl` では使えない。
- `--load-extension` はこの環境で無視される。`install_extension` で `dist/chrome` を読み込む。
- persistent profile を使う。`--isolated` は付けない。
- Kilo global config の例:
  `C:\Users\fujim\.config\kilo\kilo.jsonc` の `mcp` に `chrome-devtools` entry。
  `--filesystemRoot=S:/Documents/Kilo_Commons/webextension-pixiv-toolkit` を付ける。

## 手順

1. `list_extensions` で extension が読み込まれているか確認。
2. `install_extension` で `S:\Documents\Kilo_Commons\webextension-pixiv-toolkit\dist\chrome` を読み込む。
3. `list_pages` で page と extension service worker ID（例: `sw-1`）を確認。
4. login は `.env` の `PIXIV_EMAIL` / `PIXIV_PASSWORD` から行う。task、decisions、known-issues に credentials を書かない。
5. content script の画面確認は valid page URL で行う。無効 URL では `Invalid page. url: ...` になる。
6. `take_snapshot` で a11y tree を見る。拡張 UI の evidence は `__ptk-app` ではなく `.ptk__container`、`.ptk__guide`、`.ptk__action__wrapper__body` などを確認する。`document.getElementById('__ptk-app')` false は Vue mount point が component root に置換されている可能性があり、UI 不在の証明ではない。
7. `list_console_messages` で content script page と service worker の console error を確認する。service worker は `serviceWorkerId` を指定する。
8. service worker API は `evaluate_script` の `serviceWorkerId` で見る。page main world と content script isolated world は同じ JS realm ではない。main world evaluate では content script の `window.$app` / `window.$eventBus` を見ない。
9. DNR は `getMatchedRules()` だけで filter しない。この tool では `MatchedRulesFilter` の properties が `minTimeStamp` / `tabId` だけで、resourceType や urlFilter は使えない。ルール条件確認には `testMatchOutcome({ url, type, initiator, method })` を使う。
10. screenshot は `docs/ai/tmp/` で一時的に撮ってよい。残す必要がある場合は `docs/evidence/` に `YYYY-MM-DD-<slug>.png` として保存する。`docs/ai/tmp/` は正典 archive で消えるため evidence storage にしない。

## service worker evaluate 例

```js
async () => ({
  enabledRulesets: await chrome.declarativeNetRequest.getEnabledRulesets(),
  webRequest: typeof chrome.webRequest,
  dn: typeof chrome.declarativeNetRequest,
  storage: typeof chrome.storage,
  downloads: typeof chrome.downloads,
  runtime: typeof chrome.runtime
})
```

## DNR test 例

```js
async function testDNR(url, type, initiator = 'https://www.pixiv.net') {
  return await chrome.declarativeNetRequest.testMatchOutcome({
    url,
    type,
    initiator,
    method: 'get'
  });
}
```

## 記録

- Memory Bank には実行結果、URL、tool 結果、file:line を書く。
- credentials は書かない。保管場所 `.env` と変数名だけ書く。
- `testMatchOutcome` は hypothetical request の match test で、実際の network request ではない。実 request の header を確認する場合は `list_network_requests` / `get_network_request` を使う。
