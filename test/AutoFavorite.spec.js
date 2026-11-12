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

test('illust/manga/ugoira map to illusts endpoint, novel to novels', () => {
  for (const type of ['PIXIV_ILLUST', 'PIXIV_MANGA', 'PIXIV_UGOIRA']) {
    expect(AutoFavorite.resolveTarget({ type, context: { id: '123' } }))
      .toEqual({ favKind: 'illusts', idKey: 'illust_id', id: '123' });
  }

  expect(AutoFavorite.resolveTarget({ type: 'PIXIV_NOVEL', context: { id: '456' } }))
    .toEqual({ favKind: 'novels', idKey: 'novel_id', id: '456' });
});

test('unsupported type or missing work id returns null', () => {
  expect(AutoFavorite.resolveTarget({ type: 'PIXIV_COMIC_EPISODE', context: { id: '1' } })).toBeNull();
  expect(AutoFavorite.resolveTarget({ type: 'FANBOX_POST', context: { id: '1' } })).toBeNull();
  expect(AutoFavorite.resolveTarget({ type: 'PIXIV_ILLUST', context: {} })).toBeNull();
  expect(AutoFavorite.resolveTarget({ type: 'PIXIV_ILLUST' })).toBeNull();
});

test('tryFavorite does nothing when the setting is disabled', () => {
  mockSettings.autoFavoriteAfterDownload = false;

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

test('tryFavorite posts favorite target to the pixiv.net tab port', () => {
  mockSettings.autoFavoriteAfterDownload = true;
  mockTabsQuery.mockClear();
  mockTabsConnect.mockClear();
  mockTabsQuery.mockImplementation((options, callback) => callback([{ id: 7 }]));

  const postMessage = jest.fn();
  const disconnect = jest.fn();
  mockTabsConnect.mockReturnValue({
    onMessage: { addListener: jest.fn() },
    onDisconnect: { addListener: jest.fn() },
    postMessage: postMessage,
    disconnect: disconnect
  });

  AutoFavorite.tryFavorite({ type: 'PIXIV_NOVEL', context: { id: '456' } });

  expect(mockTabsConnect).toHaveBeenCalledWith(7, { name: 'auto-favorite' });
  expect(postMessage).toHaveBeenCalledWith({ type: 'favorite', favKind: 'novels', idKey: 'novel_id', id: '456' });
});
