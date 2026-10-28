export type PaginationQuery = {
  page?: number | string;
  pageSize?: number | string;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function parsePagination(query: PaginationQuery): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const page = Math.max(
    1,
    Number.parseInt(String(query.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE,
  );
  const rawSize =
    Number.parseInt(String(query.pageSize ?? DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
  };
}
