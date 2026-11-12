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

test('download→error: processorsまで同時に開始し、失敗portを除去して待機ファイルを補充する（item17修正＋errorMessage crash回帰防止）', () => {
  const dl = new Downloader({ processors: 2 });
  dl.appendFile('http://example.test/1.jpg', { index: 0 });
  dl.appendFile('http://example.test/2.jpg', { index: 1 });
  dl.appendFile('http://example.test/3.jpg', { index: 2 });

  dl.download();

  // processors=2 なので2ファイル同時に開始される（旧実装は常に1）
  expect(mockPorts).toHaveLength(2);
  expect(dl.downloadFilePorts).toEqual([mockPorts[0], mockPorts[1]]);

  // background は { error: error.message }（文字列）を送る
  mockPorts[0]._emit('error', { error: 'boom' });

  // 失敗portが台帳に残っていると同時数が狂う（旧バグでは[失敗port]に置換されていた）
  expect(dl.downloadFilePorts).not.toContain(mockPorts[0]);
  // 除去後、待機中の3つ目が開始されて slots=2 を維持する
  expect(dl.downloadFilePorts).toEqual([mockPorts[1], mockPorts[2]]);
  // エラー経路が ReferenceError で停止せず、失敗記録が届く
  expect(dl.failedDownloadFiles).toHaveLength(1);
});

test('download: processors を越えて開始せず、全ファイル完了（消化）まで finish を発火しない（item17同時進行の正しさ）', () => {
  const dl = new Downloader({ processors: 2 });
  dl.appendFile('http://example.test/a.jpg', { index: 0 });
  dl.appendFile('http://example.test/b.jpg', { index: 1 });
  dl.appendFile('http://example.test/c.jpg', { index: 2 });

  const finished = jest.fn();
  dl.addListener('finish', finished);

  dl.download();
  expect(mockPorts).toHaveLength(2); // 同時数は processors 以下で抑える

  // 進行中のportが残るうちは finish しない（旧実装はキューが空だと即 finish していた）
  mockPorts[0]._emit('error', { error: 'x' });
  expect(mockPorts).toHaveLength(3);
  expect(finished).not.toHaveBeenCalled();
  mockPorts[1]._emit('error', { error: 'x' });
  expect(finished).not.toHaveBeenCalled();

  // 最後に進行中だった port が消えて初めて finish
  mockPorts[2]._emit('error', { error: 'x' });
  expect(dl.downloadFilePorts).toHaveLength(0);
  expect(finished).toHaveBeenCalledTimes(1);
});
