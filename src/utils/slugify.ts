export function slugify(value: string): string {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .trim();
}

export function ensureSlug(base: string, suffix?: string | number): string {
  const baseSlug = slugify(base);
  if (!suffix) {
    return baseSlug;
  }

  const suffixSlug = typeof suffix === 'string' ? slugify(suffix) : String(suffix);
  if (!suffixSlug) {
    return baseSlug;
  }

  return `${baseSlug}-${suffixSlug}`.replace(/-+/g, '-');
}
