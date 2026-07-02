export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeEndpointPath(value: string) {
  const clean = value.trim().replace(/^\/+/, "");
  return `/${clean}`.replace(/\/+/g, "/");
}
