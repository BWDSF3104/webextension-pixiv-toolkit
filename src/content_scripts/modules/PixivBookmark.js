import { RuntimeError } from '@/errors';

/**
 * Add a work to the current user's bookmark using the page's session.
 * Must run in a pixiv.net content script (same-origin, cookies included).
 * @param {('illusts'|'novels')} favKind
 * @param {('illust_id'|'novel_id')} idKey
 * @param {string} id
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export default function bookmark(favKind, idKey, id) {
  const token = (document.documentElement.innerHTML.match(/"token":"([0-9a-f]{32})"/i) || [])[1];

  if (!token) {
    return Promise.reject(new RuntimeError('Pixiv CSRF token not found, reload the page'));
  }

  const body = { comment: '', restrict: 0, tags: [] };
  body[idKey] = String(id);

  return fetch(`https://www.pixiv.net/ajax/${favKind}/bookmarks/add`, {
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
