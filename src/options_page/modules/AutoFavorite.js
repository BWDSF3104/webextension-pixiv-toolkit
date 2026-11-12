import GlobalSettings from '@/modules/GlobalSettings';
import browser from '@/modules/Extension/browser';

/**
 * task type -> favorite endpoint kind / body key
 */
const FAVORITE_TYPES = {
  PIXIV_ILLUST: { favKind: 'illusts', idKey: 'illust_id' },
  PIXIV_MANGA: { favKind: 'illusts', idKey: 'illust_id' },
  PIXIV_UGOIRA: { favKind: 'illusts', idKey: 'illust_id' },
  PIXIV_NOVEL: { favKind: 'novels', idKey: 'novel_id' }
};

/**
 * Resolve favorite request target from a download task
 * @param {any} task
 * @returns {{ favKind: string, idKey: string, id: string }|null}
 */
function resolveTarget(task) {
  const mapping = FAVORITE_TYPES[task.type];
  const id = task.context && task.context.id;

  if (!mapping || !id) {
    return null;
  }

  return { favKind: mapping.favKind, idKey: mapping.idKey, id: String(id) };
}

/**
 * Favorite a completed download task through an opened pixiv.net tab.
 * The authenticated POST runs in the tab's content script, so the tab must
 * be open, otherwise the favorite is skipped.
 * @param {any} task
 */
function tryFavorite(task) {
  if (!GlobalSettings({}).autoFavoriteAfterDownload) {
    return;
  }

  const target = resolveTarget(task);

  if (!target) {
    return;
  }

  browser.tabs.query({ url: 'https://www.pixiv.net/*' }, tabs => {
    if (!tabs.length) {
      console.warn('[PTK] auto favorite skipped: no opened pixiv.net tab');
      return;
    }

    let port;

    try {
      port = browser.tabs.connect(tabs[0].id, { name: 'auto-favorite' });
    } catch (error) {
      console.error('[PTK] auto favorite failed: %o', error);
      return;
    }

    port.onMessage.addListener(message => {
      if (message.favorite && message.favorite.ok === false) {
        console.warn('[PTK] auto favorite failed: %s', message.favorite.message);
      }

      port.disconnect();
    });

    port.postMessage(Object.assign({ type: 'favorite' }, target));
  });
}

export default { resolveTarget, tryFavorite };
