/**
 * HistoryRepo の uid 重複照会（項目3の修正）を検証する。
 * Dexie テーブルを最小モックし、getItem が uid 索引で引くこと、
 * saveItem が既存uid時は update を使い add しないことを確認する。
 */
import HistoryRepo from '@/modules/Db/Repository/HistoryRepo';

test('getItem: uid を where/equals/first 経由で検索する', async () => {
  const table = {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 7, uid: 'u1' })
  };
  const repo = new HistoryRepo(table);

  const item = await repo.getItem({ uid: 'u1' });

  expect(table.where).toHaveBeenCalledWith('uid');
  expect(table.equals).toHaveBeenCalledWith('u1');
  expect(item).toEqual({ id: 7, uid: 'u1' });
});

test('saveItem: 既存uidがあれば update を使い add しない（重複抑止）', async () => {
  const table = {
    count: jest.fn(async () => 0),
    add: jest.fn(),
    update: jest.fn(),
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    first: jest.fn(async () => ({ id: 5, uid: 'u1' }))
  };
  const repo = new HistoryRepo(table);

  await repo.saveItem({ uid: 'u1', title: 't', url: 'u', cover: 'c', userName: 'n', type: 'pixiv_illust', r: 'r' });

  expect(table.update).toHaveBeenCalledWith(5, expect.objectContaining({ uid: 'u1' }));
  expect(table.add).not.toHaveBeenCalled();
});
