import type { LocationQuery, LocationQueryRaw } from 'vue-router';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;

const PAGE_SIZES = new Set([20, 50, 100]);

function firstQueryValue(value: LocationQuery[string]) {
  return Array.isArray(value) ? value[0] : value;
}

export function readQueryString(query: LocationQuery, key: string) {
  return firstQueryValue(query[key]) ?? '';
}

export function readQueryStrings(query: LocationQuery, key: string) {
  const value = query[key];
  if (Array.isArray(value)) return value.filter((item) => item !== null);
  return value === null || value === undefined ? [] : [value];
}

export function readPage(query: LocationQuery) {
  const value = Number.parseInt(readQueryString(query, 'page'), 10);
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_PAGE;
}

export function readPageSize(query: LocationQuery) {
  const value = Number.parseInt(readQueryString(query, 'pageSize'), 10);
  return PAGE_SIZES.has(value) ? value : DEFAULT_PAGE_SIZE;
}

export function writePagination(
  query: LocationQueryRaw,
  page: number,
  pageSize: number,
) {
  if (page !== DEFAULT_PAGE) query.page = String(page);
  if (pageSize !== DEFAULT_PAGE_SIZE) query.pageSize = String(pageSize);
}

function formatLocalDate(timestamp: number) {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function readCreatedRange(query: LocationQuery) {
  const start = parseLocalDate(readQueryString(query, 'createdFrom'));
  const end = parseLocalDate(readQueryString(query, 'createdTo'));
  return start !== null && end !== null && start <= end
    ? ([start, end] as [number, number])
    : null;
}

export function writeCreatedRange(
  query: LocationQueryRaw,
  range: [number, number] | null,
) {
  if (!range) return;
  query.createdFrom = formatLocalDate(range[0]);
  query.createdTo = formatLocalDate(range[1]);
}
