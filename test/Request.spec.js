/**
 * Request.readData のチャンク再構成（arrayBuffer をバイト毎でなくチャンク連結で組み立てる）。
 * send()/fetch は通さず、readData に偽の ReadableStream reader を渡して onload の出力を検証する。
 */
import Request from '@/modules/Net/Request';

function makeReader(chunks) {
  let i = 0;

  return {
    read() {
      if (i < chunks.length) {
        return Promise.resolve({ done: false, value: chunks[i++] });
      }

      return Promise.resolve({ done: true, value: undefined });
    }
  };
}

function collectOnload(request, chunks) {
  return new Promise((resolve, reject) => {
    request.addListener('onload', resolve);
    request.addListener('onerror', reject);
    request.readData(makeReader(chunks));
  });
}

test('readData: arrayBuffer を複数チャンク分割でも全バイト順通りに再構成する', async () => {
  const request = new Request('https://example.com/img.jpg');
  request.responseChunks = [];

  const data = await collectOnload(request, [new Uint8Array([1, 2, 3, 4]), new Uint8Array([5, 6, 7])]);

  expect(Array.from(data)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test('readData: 空応答は 0 バイトの Uint8Array になる', async () => {
  const request = new Request('https://example.com/empty');
  request.responseChunks = [];

  const data = await collectOnload(request, []);

  expect(data).toBeInstanceOf(Uint8Array);
  expect(data.length).toBe(0);
});

test('readData: plain はチャンクを連結した文字列を返す', async () => {
  const request = new Request('https://example.com/text.txt');
  request.responseType = 'plain';
  request.responseData = '';

  const data = await collectOnload(request, [new TextEncoder().encode('ab'), new TextEncoder().encode('c')]);

  expect(data).toBe('abc');
});
