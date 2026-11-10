const mockSettings = {};

jest.mock('@/modules/GlobalSettings', () => () => mockSettings);
jest.mock('@/modules/Extension/browser', () => ({ default: {} }));
jest.mock('@/modules/Net/Downloader', () => class Downloader {
  files = [];
  addListener() {}
  appendFile() {}
});
jest.mock('@/options_page/modules/FileSystem', () => ({}));
jest.mock('@/modules/Util/NameFormatter', () => ({}));
jest.mock('@/modules/Util/MimeType', () => ({}));
jest.mock('@/modules/Util/pathjoin', () => ({}));
jest.mock('@/modules/Util', () => ({ fixFilename: (f) => f }));

const MultipleDownloadTask = require('@/options_page/modules/DownloadTasks/MultiplePagesDownloadTask').default;

// shortcut: unit test builds the task without running the constructor (JSZip global not available in jest). Add a fixture if constructor behavior needs testing.
function makeTask(options) {
  const task = Object.create(MultipleDownloadTask.prototype);
  task.options = options;
  task.downloader = { files: options.pages };
  task.zipMultipleImages = mockSettings.globalZipMultipleImages;
  return task;
}

test('saveMode override folder: follows settings is ignored, no zip and work folder created', () => {
  mockSettings.downloadSaveMode = 0;
  mockSettings.globalZipMultipleImages = 1;
  mockSettings.dontCreateWorkFolder = 2;

  const task = makeTask({ pages: [1, 2], saveMode: 'folder' });

  expect(task.shouldZipFile()).toBe(false);
  expect(task.dontCreateWorkFolder()).toBe(false);
});

test('saveMode override perImage: no zip and no work folder', () => {
  mockSettings.downloadSaveMode = 0;
  mockSettings.globalZipMultipleImages = 1;
  mockSettings.dontCreateWorkFolder = 1;

  const task = makeTask({ pages: [1, 2], saveMode: 'perImage' });

  expect(task.shouldZipFile()).toBe(false);
  expect(task.dontCreateWorkFolder()).toBe(true);
});

test('no override follows settings (zip mode)', () => {
  mockSettings.downloadSaveMode = 0;
  mockSettings.globalZipMultipleImages = 1;
  mockSettings.dontCreateWorkFolder = 2;

  const task = makeTask({ pages: [1, 2] });

  expect(task.shouldZipFile()).toBe(true);
  expect(task.dontCreateWorkFolder()).toBe(false);
});

test('no override follows settings (folder mode, dontCreateWorkFolder=2)', () => {
  mockSettings.downloadSaveMode = 1;
  mockSettings.globalZipMultipleImages = 1;
  mockSettings.dontCreateWorkFolder = 2;

  const task = makeTask({ pages: [1, 2] });

  expect(task.shouldZipFile()).toBe(false);
  expect(task.dontCreateWorkFolder()).toBe(true);
});
