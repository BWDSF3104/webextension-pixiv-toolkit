const mockSettings = {};
const mockTabsQuery = jest.fn();
const mockTabsConnect = jest.fn();

jest.mock('@/modules/GlobalSettings', () => () => mockSettings);
jest.mock('@/modules/Extension/browser', () => ({
  __esModule: true,
  default: {
    tabs: {
      query: (options, callback) => mockTabsQuery(options, callback),
      connect: (...args) => mockTabsConnect(...args)
    }
  }
}));

const AutoFavorite = require('@/options_page/modules/AutoFavorite').default;

test('favorite actions map each work type to its endpoint', () => {
  const settings = { autoFavoriteAfterDownload: true, autoLikeAfterDownload: false };

  for (const type of ['PIXIV_ILLUST', 'PIXIV_MANGA', 'PIXIV_UGOIRA']) {
    expect(AutoFavorite.resolveActions({ type, context: { id: '123' } }, settings))
      .toEqual([{ type: 'favorite', favKind: 'illusts', idKey: 'illust_id', id: '123' }]);
  }

  expect(AutoFavorite.resolveActions({ type: 'PIXIV_NOVEL', context: { id: '456' } }, settings))
    .toEqual([{ type: 'favorite', favKind: 'novels', idKey: 'novel_id', id: '456' }]);
});

test('like is only resolved for likeable types (novel has no like)', () => {
  const settings = { autoFavoriteAfterDownload: false, autoLikeAfterDownload: true };

  for (const type of ['PIXIV_ILLUST', 'PIXIV_MANGA', 'PIXIV_UGOIRA']) {
    expect(AutoFavorite.resolveActions({ type, context: { id: '123' } }, settings))
      .toEqual([{ type: 'like', id: '123' }]);
  }

  expect(AutoFavorite.resolveActions({ type: 'PIXIV_NOVEL', context: { id: '456' } }, settings)).toEqual([]);
});

test('favorite runs before like for the same task', () => {
  const settings = { autoFavoriteAfterDownload: true, autoLikeAfterDownload: true };

  expect(AutoFavorite.resolveActions({ type: 'PIXIV_ILLUST', context: { id: '123' } }, settings))
    .toEqual([
      { type: 'favorite', favKind: 'illusts', idKey: 'illust_id', id: '123' },
      { type: 'like', id: '123' }
    ]);
});

test('unsupported type or missing work id resolves no action', () => {
  const settings = { autoFavoriteAfterDownload: true, autoLikeAfterDownload: true };

  expect(AutoFavorite.resolveActions({ type: 'PIXIV_COMIC_EPISODE', context: { id: '1' } }, settings)).toEqual([]);
  expect(AutoFavorite.resolveActions({ type: 'FANBOX_POST', context: { id: '1' } }, settings)).toEqual([]);
  expect(AutoFavorite.resolveActions({ type: 'PIXIV_ILLUST', context: {} }, settings)).toEqual([]);
  expect(AutoFavorite.resolveActions({ type: 'PIXIV_ILLUST' }, settings)).toEqual([]);
});

test('tryFavorite does nothing when both settings are disabled', () => {
  mockSettings.autoFavoriteAfterDownload = false;
  mockSettings.autoLikeAfterDownload = false;
  mockTabsQuery.mockClear();

  AutoFavorite.tryFavorite({ type: 'PIXIV_ILLUST', context: { id: '123' } });

  expect(mockTabsQuery).not.toHaveBeenCalled();
});

test('tryFavorite skips favorite when no pixiv.net tab is opened', () => {
  mockSettings.autoFavoriteAfterDownload = true;
  mockTabsQuery.mockClear();
  mockTabsConnect.mockClear();
  mockTabsQuery.mockImplementation((options, callback) => callback([]));

  AutoFavorite.tryFavorite({ type: 'PIXIV_ILLUST', context: { id: '123' } });

  expect(mockTabsQuery).toHaveBeenCalledWith({ url: 'https://www.pixiv.net/*' }, expect.any(Function));
  expect(mockTabsConnect).not.toHaveBeenCalled();
});

test('tryFavorite posts all actions to the pixiv.net tab port and disconnects after all results', () => {
  mockSettings.autoFavoriteAfterDownload = true;
  mockSettings.autoLikeAfterDownload = true;
  mockTabsQuery.mockClear();
  mockTabsConnect.mockClear();
  mockTabsQuery.mockImplementation((options, callback) => callback([{ id: 7 }]));

  const postMessage = jest.fn();
  const disconnect = jest.fn();
  let onMessageListener = null;
  mockTabsConnect.mockReturnValue({
    onMessage: { addListener: listener => { onMessageListener = listener; } },
    postMessage: postMessage,
    disconnect: disconnect
  });

  AutoFavorite.tryFavorite({ type: 'PIXIV_ILLUST', context: { id: '123' } });

  expect(mockTabsConnect).toHaveBeenCalledWith(7, { name: 'auto-favorite' });
  expect(postMessage).toHaveBeenNthCalledWith(1, { type: 'favorite', favKind: 'illusts', idKey: 'illust_id', id: '123' });
  expect(postMessage).toHaveBeenNthCalledWith(2, { type: 'like', id: '123' });

  onMessageListener({ favorite: { ok: true } });
  expect(disconnect).not.toHaveBeenCalled();

  onMessageListener({ like: { ok: false, message: 'rate limited' } });
  expect(disconnect).toHaveBeenCalledTimes(1);
});
