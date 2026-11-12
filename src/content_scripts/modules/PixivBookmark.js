import { RuntimeError } from '@/errors';

/**
 * POST to a Pixiv ajax endpoint using the page's session.
 * Must run in a pixiv.net content script (same-origin, cookies included).
 * @param {string} endpoint e.g. 'illusts/bookmarks/add'
 * @param {any} body
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
function authenticatedPost(endpoint, body) {
  const token = (document.documentElement.innerHTML.match(/"token":"([0-9a-f]{32})"/i) || [])[1];

  if (!token) {
    return Promise.reject(new RuntimeError('Pixiv CSRF token not found, reload the page'));
  }

  return fetch(`https://www.pixiv.net/ajax/${endpoint}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-csrf-token': token
    },
    body: JSON.stringify(body)
  }).then(response => response.json()).then(data => ({
    ok: !data.error,
    message: data.message
  }));
}

/**
 * Add a work to the current user's bookmark
 * @param {('illusts'|'novels')} favKind
 * @param {('illust_id'|'novel_id')} idKey
 * @param {string} id
 */
export function bookmark(favKind, idKey, id) {
  const body = { comment: '', restrict: 0, tags: [] };
  body[idKey] = String(id);

  return authenticatedPost(`${favKind}/bookmarks/add`, body);
}

/**
 * Like an artwork (illust/manga/ugoira only, novels have no like)
 * @param {string} id
 */
export function like(id) {
  return authenticatedPost('illusts/like', { illust_id: String(id) });
}
