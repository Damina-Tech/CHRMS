export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const DEFAULT_PAGE_SIZE = 10;

export function buildPageParams(opts: {
  page: number;
  pageSize?: number;
  extra?: Record<string, string | undefined>;
}): string {
  const p = new URLSearchParams();
  p.set("page", String(opts.page));
  p.set("pageSize", String(opts.pageSize ?? DEFAULT_PAGE_SIZE));
  if (opts.extra) {
    for (const [k, v] of Object.entries(opts.extra)) {
      if (v != null && v !== "" && v !== "all") p.set(k, v);
    }
  }
  return p.toString();
}
