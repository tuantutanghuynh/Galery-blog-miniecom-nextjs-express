import { describe, it, expect } from 'vitest';
import { parsePagination } from './pagination';

const opts = { defaultSize: 10, maxSize: 50 };

describe('parsePagination', () => {
  it('không có tham số thì trang 1, cỡ mặc định', () => {
    expect(parsePagination({}, opts)).toEqual({ page: 1, take: 10, skip: 0 });
  });
  it('tham số hợp lệ giữ nguyên', () => {
    expect(parsePagination({ page: '3', pageSize: '20' }, opts)).toEqual({ page: 3, take: 20, skip: 40 });
  });
  it('pageSize âm hoặc 0 về mặc định', () => {
    expect(parsePagination({ pageSize: '-2' }, opts).take).toBe(10);
    expect(parsePagination({ pageSize: '0' }, opts).take).toBe(10);
  });
  it('pageSize lẻ làm tròn xuống, nhỏ hơn 1 sau làm tròn thì về mặc định', () => {
    expect(parsePagination({ pageSize: '2.5' }, opts).take).toBe(2);
    expect(parsePagination({ pageSize: '0.5' }, opts).take).toBe(10);
  });
  it('pageSize vượt trần thì bằng trần', () => {
    expect(parsePagination({ pageSize: '1000' }, opts).take).toBe(50);
  });
  it('page không phải số, âm, hoặc lẻ', () => {
    expect(parsePagination({ page: 'abc' }, opts).page).toBe(1);
    expect(parsePagination({ page: '-4' }, opts).page).toBe(1);
    expect(parsePagination({ page: '2.9' }, opts).page).toBe(2);
  });
  it('giá trị dạng mảng (?page=1&page=2) coi như không hợp lệ', () => {
    expect(parsePagination({ page: ['1', '2'], pageSize: ['5'] }, opts)).toEqual({ page: 1, take: 10, skip: 0 });
  });
  it('NaN và Infinity về mặc định', () => {
    expect(parsePagination({ pageSize: 'Infinity', page: 'NaN' }, opts)).toEqual({ page: 1, take: 10, skip: 0 });
  });
});
