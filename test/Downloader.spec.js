/**
 * Downloader の同時進行管理（項目1の修正）を検証する。
 * browser.runtime.connect をモックし、port の complete/error/abort を手工的に発火して
 * downloadFilePorts の台帳が正しく保たれることを確認する。fetch を伴う complete は使わず
 * error/abort 経路で removeDownloadFromCollection を検証する。
 */
const mockPorts = [];
const mockConnect = jest.fn(() => {
  const listeners = [];
  const port = {
    onMessage: {
      addListener: (fn) => listeners.push(fn)
    },
    postMessage: jest.fn(),
    _emit(event, data) {
      listeners.slice().forEach(fn => fn({ event, data }));
    }
  };

  mockPorts.push(port);

  return port;
});

jest.mock('@/modules/Extension/browser', () => ({
  runtime: {
    connect: (...args) => mockConnect(...args)
  }
}));

import Downloader from '@/modules/Net/Downloader';

beforeEach(() => {
  mockPorts.length = 0;
  mockConnect.mockClear();
});

test('removeDownloadFromCollection: 指定portのみを破壊的に削除する', () => {
  const dl = new Downloader({ processors: 3 });
  dl.downloadFilePorts = ['a', 'b', 'c'];

  dl.removeDownloadFromCollection('b');

  expect(dl.downloadFilePorts).toEqual(['a', 'c']);
});

test('removeDownloadFromCollection: 見つからないportは無視する', () => {
  const dl = new Downloader({ processors: 3 });
  dl.downloadFilePorts = ['a', 'b'];

  dl.removeDownloadFromCollection('x');

  expect(dl.downloadFilePorts).toEqual(['a', 'b']);
});

test('download→error: 失敗portは台帳から除去され次のファイルが開始される（参照喪失・errorMessage crash の回帰防止）', () => {
  const dl = new Downloader({ processors: 2 });
  dl.appendFile('http://example.test/1.jpg', { index: 0 });
  dl.appendFile('http://example.test/2.jpg', { index: 1 });

  dl.download();

  // 1ファイル目が開始（downloadNextは1件ずつ開始する設計）
  expect(mockPorts).toHaveLength(1);
  expect(dl.downloadFilePorts).toEqual([mockPorts[0]]);

  // background は { error: error.message }（文字列）を送る
  mockPorts[0]._emit('error', { error: 'boom' });

  // 失敗portが台帳に残っていると後続の同時数が狂う（旧バグでは[失敗port]に置換されていた）
  expect(dl.downloadFilePorts).not.toContain(mockPorts[0]);
  expect(dl.downloadFilePorts).toEqual([mockPorts[1]]);
  // エラー経路が ReferenceError で停止せず、失敗記録と item-error が届く
  expect(dl.failedDownloadFiles).toHaveLength(1);
});
