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
 * task types that Pixiv allows to be liked (novels have no like)
 */
const LIKEABLE_TYPES = ['PIXIV_ILLUST', 'PIXIV_MANGA', 'PIXIV_UGOIRA'];

/**
 * Resolve the favorite/like actions to run for a download task
 * @param {any} task
 * @param {any} settings
 * @returns {any[]} content script actions in request order
 */
function resolveActions(task, settings) {
  const id = task.context && task.context.id;
  const actions = [];

  if (!id) {
    return actions;
  }

  const mapping = FAVORITE_TYPES[task.type];

  if (settings.autoFavoriteAfterDownload && mapping) {
    actions.push({ type: 'favorite', favKind: mapping.favKind, idKey: mapping.idKey, id: String(id) });
  }

  if (settings.autoLikeAfterDownload && LIKEABLE_TYPES.indexOf(task.type) > -1) {
    actions.push({ type: 'like', id: String(id) });
  }

  return actions;
}

/**
 * Favorite/like a completed download task through an opened pixiv.net tab.
 * The authenticated POSTs run in the tab's content script, so the tab must
 * be open, otherwise the actions are skipped.
 * @param {any} task
 */
function tryFavorite(task) {
  const settings = GlobalSettings({});
  const actions = resolveActions(task, settings);

  if (!actions.length) {
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

    let pending = actions.length;

    port.onMessage.addListener(message => {
      const result = message.favorite || message.like;

      if (result && result.ok === false) {
        console.warn('[PTK] auto favorite failed: %s', result.message);
      }

      if (--pending <= 0) {
        port.disconnect();
      }
    });

    actions.forEach(action => port.postMessage(action));
  });
}

export default { resolveActions, tryFavorite };
