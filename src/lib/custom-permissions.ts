export function normalizeCustomPermissions(rawValue: unknown): string[] {
  if (!rawValue) {
    return [];
  }

  const normalize = (value: unknown): string => String(value).trim();

  if (Array.isArray(rawValue)) {
    return Array.from(
      new Set(
        rawValue
          .map(normalize)
          .filter(permission => permission.length > 0)
      )
    );
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(
            parsed
              .map(normalize)
              .filter(permission => permission.length > 0)
          )
        );
      }
    } catch (error) {
      // Valor não é JSON válido – tratar como permissão única
    }

    const normalized = normalize(trimmed);
    return normalized ? [normalized] : [];
  }

  return [];
}

export function serializeCustomPermissions(rawValue: unknown): string {
  return JSON.stringify(normalizeCustomPermissions(rawValue));
}
