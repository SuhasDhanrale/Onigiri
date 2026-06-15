const PUBLIC_BASE_URL = import.meta.env.BASE_URL || './';

export function getPublicAssetUrl(path) {
  const base = PUBLIC_BASE_URL.endsWith('/') ? PUBLIC_BASE_URL : `${PUBLIC_BASE_URL}/`;
  return `${base}${path.replace(/^\/+/, '')}`;
}
