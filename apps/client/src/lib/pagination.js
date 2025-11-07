export function flattenPages(data) {
  if (!data?.pages?.length) return [];
  return data.pages.flatMap((page) => page?.data ?? []);
}
