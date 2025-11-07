export function toWeakEtag(updatedAt) {
  if (!updatedAt) return undefined;
  const iso = typeof updatedAt === "string" ? updatedAt : updatedAt.toISOString();
  return `W/"${iso}"`;
}

export function isEtagMatch(ifMatchHeader, updatedAt) {
  if (!ifMatchHeader) return true;
  const current = toWeakEtag(updatedAt);
  if (!current) return false;
  return ifMatchHeader.replace(/\s/g, "") === current.replace(/\s/g, "");
}
