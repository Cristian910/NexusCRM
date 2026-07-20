import { useState } from "react";

interface UsePaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
}

export function usePagination({ defaultPage = 1, defaultLimit = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(defaultPage);
  const [limit, setLimit] = useState(defaultLimit);

  const goToPage = (p: number) => setPage(p);
  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const reset = () => setPage(1);

  return { page, limit, setPage: goToPage, nextPage, prevPage, setLimit, reset };
}
