import { useInfiniteQuery } from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js";

export function usePaginatedResource({ key, listFn, params }) {
  return useInfiniteQuery({
    queryKey: [...key, params],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      listFn({
        ...params,
        cursor: pageParam ?? undefined,
        take: params?.take ?? DEFAULT_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage?.meta?.nextCursor ?? undefined,
    keepPreviousData: true,
  });
}
