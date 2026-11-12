/**
 * 各ダウンロードボタン別: リネーム規則（プレースホルダ展開）が保存ファイル名に適用されるか。
 * 実物の NameFormatter / pathjoin / MimeType / config default 規則を使い、
 * タスククラスの保存コードが渡す filename をモック保存APIで捕捉して検証する。
 */
const mockSettings = {};
const mockSendMessage = jest.fn(async () => 1);
const mockSaveFileBackground = jest.fn(async () => 2);

jest.mock('@/modules/GlobalSettings', () => () => mockSettings);
jest.mock('@/modules/Extension/browser', () => ({ runtime: { sendMessage: mockSendMessage } }));
jest.mock('@/options_page/modules/FileSystem', () => ({
  getDefault: () => ({ saveFileInBackground: mockSaveFileBackground }),
}));
jest.mock('@/modules/Net/Downloader', () => class Downloader {
  files = [];
  addListener() {}
  appendFile() {}
});
jest.mock('@/modules/Util', () => ({ fixFilename: (f) => f }));
jest.mock('@/modules/Parser/PixivComic/ImageDecrypte', () => ({ decrypteImage: jest.fn() }));

const defaults = require('@/config/default').default;
const IllustDownloadTask = require('@/options_page/modules/DownloadTasks/Pixiv/IllustDownloadTask').default;
const MangaDownloadTask = require('@/options_page/modules/DownloadTasks/Pixiv/MangaDownloadTask').default;
const PostDownloadTask = require('@/options_page/modules/DownloadTasks/Fanbox/PostDownloadTask').default;
const EpisodeDownloadTask = require('@/options_page/modules/DownloadTasks/PixivComic/EpisodeDownloadTask').default;
const UgoiraDownloadTask = require('@/options_page/modules/DownloadTasks/Pixiv/UgoiraDownloadTask').default;
const NovelDownloadTask = require('@/options_page/modules/DownloadTasks/Pixiv/NovelDownloadTask').default;

URL.createObjectURL = jest.fn(() => 'blob:mock');
URL.revokeObjectURL = jest.fn();
global.Blob = class {};

const context = {
  id: '123',
  illustId: '123',
  illustTitle: 'タイトル',
  title: 'タイトル',
  userName: '作者',
  userId: '9',
  totalPages: 2,
  numberingTitle: '第3話',
  workTitle: '作品A',
  pageNum: 1,
};

function makeBaseTask(Cls, options, type) {
  // shortcut: constructor skipped (JSZip global not available in jest). Only onItemFinish/onFinish fields are set.
  const task = Object.create(Cls.prototype);
  task.options = options;
  task.context = options.context;
  task.title = options.context.title;
  task.type = type;
  task.events = {};
  task.progress = 0;
  task.now = new Date();
  task.downloader = { files: options.pages };
  task.zipMultipleImages = mockSettings.globalZipMultipleImages;
  return task;
}

function folderModeSettings() {
  mockSettings.downloadRelativeLocation = '';
  mockSettings.downloadSaveMode = 1;
  mockSettings.dontCreateWorkFolder = 0;
  mockSettings.combinWRRuleAndIRRuleWhenDontCreateWorkFolder = 0;
  mockSettings.enableDownloadMetadata = false;
}

beforeEach(() => {
  mockSendMessage.mockClear();
  mockSaveFileBackground.mockClear();
  folderModeSettings();
});

async function savedFilenameOfMultiplePages(task) {
  await task.onItemFinish({ blob: {}, args: { index: 0 }, mimeType: 'image/jpeg' });
  return mockSendMessage.mock.calls[0][0].args.filename;
}

test('イラストボタン: illustRenameRule + illustRenameImageRule が展開される', async () => {
  const task = makeBaseTask(IllustDownloadTask, {
    pages: ['a', 'b'],
    renameRule: defaults.illustRenameRule,
    renameImageRule: defaults.illustRenameImageRule,
    context,
  }, 'PIXIV_ILLUST');

  expect(await savedFilenameOfMultiplePages(task)).toBe('123_タイトル/p0.jpg');
});

test('漫画ボタン: mangaRenameRule が展開される（既定値末尾の `}` はリテラル残存＝上流タイポの現行挙動）', async () => {
  const task = makeBaseTask(MangaDownloadTask, {
    pages: ['a'],
    renameRule: defaults.mangaRenameRule,
    renameImageRule: defaults.mangaRenameImageRule,
    context,
  }, 'PIXIV_MANGA');

  expect(await savedFilenameOfMultiplePages(task)).toBe('123_タイトル}/p0.jpg');
});

test('Fanboxボタン: fanboxPostRenameRule の {pageNum} も展開されフォルダになる（pageNumはbuildPageNum由来＝0-based既定）', async () => {
  const task = makeBaseTask(PostDownloadTask, {
    pages: ['a'],
    renameRule: defaults.fanboxPostRenameRule,
    renameImageRule: defaults.fanboxPostRenameImageRule,
    context,
  }, 'FANBOX_POST');

  expect(await savedFilenameOfMultiplePages(task)).toBe('123_タイトル/0/p0.jpg');
});

test('zipモード: zip内ファイル名=画像規則、zip名=作業規則が展開される', async () => {
  mockSettings.downloadSaveMode = 0;
  mockSettings.globalZipMultipleImages = 1;

  const zipFile = jest.fn();
  const task = makeBaseTask(IllustDownloadTask, {
    pages: ['a', 'b'],
    renameRule: defaults.illustRenameRule,
    renameImageRule: defaults.illustRenameImageRule,
    context,
  }, 'PIXIV_ILLUST');
  task.zipMultipleImages = 1;
  task.zip = { file: zipFile, generateAsync: async () => ({}) };

  await task.onItemFinish({ blob: {}, args: { index: 0 }, mimeType: 'image/jpeg' });
  expect(zipFile.mock.calls[0][0]).toBe('p0.jpg');

  await task.onFinish();
  expect(mockSendMessage.mock.calls[0][0].args.filename).toBe('123_タイトル.zip');
});

test('作品フォルダなし（combinWRRule=0）: 画像規則のみ適用される', async () => {
  mockSettings.dontCreateWorkFolder = 2;

  const task = makeBaseTask(IllustDownloadTask, {
    pages: ['a'],
    renameRule: defaults.illustRenameRule,
    renameImageRule: defaults.illustRenameImageRule,
    context,
  }, 'PIXIV_ILLUST');

  expect(await savedFilenameOfMultiplePages(task)).toBe('p0.jpg');
});

test('Pixiv漫画ボタン: numberingTitle / workTitle が episodeRenameRule で展開される', async () => {
  const task = makeBaseTask(EpisodeDownloadTask, {
    pages: [{ key: 'k' }],
    renameRule: defaults.pixivComicEpisodeRenameRule,
    renameImageRule: defaults.pixivComicEpisodeRenameImageRule,
    context,
  }, 'PIXIV_COMIC_EPISODE');

  await task.onItemFinish({ blob: {}, args: { index: 0 }, mimeType: 'image/jpeg' });

  expect(mockSaveFileBackground.mock.calls[0][0].filename).toBe('123_タイトル/第3話_作品A/p0.jpg');
});

test('うごーらボタン: ugoiraRenameRule が zip 保存名に展開される', async () => {
  global.JSZip = class {
    file() {}
    async loadAsync() {}
    async generateAsync() { return {}; }
  };

  const task = Object.create(UgoiraDownloadTask.prototype);
  task.options = { uid: 'u1', packAnimationJsonType: 0, renameRule: defaults.ugoiraRenameRule, context };
  task.context = context;
  task.events = {};
  task.progress = 0;

  await task.onItemFinish({ blob: {}, mimeType: 'application/zip' });

  expect(mockSendMessage.mock.calls[0][0].args.filename).toBe('123_タイトル.zip');
});

test('小説ボタン: novelRenameRule が .txt 保存名に展開される', async () => {
  const task = Object.create(NovelDownloadTask.prototype);
  task.options = { renameRule: defaults.novelRenameRule, includeDescription: false };
  task.context = { id: '123', title: 'タイトル', userName: '作者', sections: [] };
  task.title = 'タイトル';
  task.url = 'https://www.pixiv.net/novel/show.php?id=123';
  task.events = {};

  await task.makeTxtBook();

  expect(mockSaveFileBackground.mock.calls[0][0].filename).toBe('123_タイトル.txt');
});

test('規則が空ならプレースホルダ展開されずフォールバック名になる', async () => {
  const task = makeBaseTask(IllustDownloadTask, {
    pages: ['a'],
    renameRule: '',
    renameImageRule: '',
    context,
  }, 'PIXIV_ILLUST');

  expect(await savedFilenameOfMultiplePages(task)).toBe('123/p0.jpg');
});

test('不明プレースホルダ {unknown} は置換されずリテラルのまま残る（現行挙動の記録）', async () => {
  const task = makeBaseTask(IllustDownloadTask, {
    pages: ['a'],
    renameRule: '{unknown}_{id}',
    renameImageRule: defaults.illustRenameImageRule,
    context,
  }, 'PIXIV_ILLUST');

  expect(await savedFilenameOfMultiplePages(task)).toBe('{unknown}_123/p0.jpg');
});
