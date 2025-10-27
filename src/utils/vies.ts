export type ViesOverride = 'AUTO' | 'MANTER';

export const DEFAULT_VIES_OVERRIDE: ViesOverride = 'AUTO';

export const normalizeViesOverride = (
  override: ViesOverride | null | undefined
): ViesOverride => {
  if (override === 'MANTER') {
    return 'MANTER';
  }

  return DEFAULT_VIES_OVERRIDE;
};

export const aplicarViesOverride = (
  override: ViesOverride | null | undefined,
  viesAutomatico: string,
  manterLabel = 'Manter'
): string => {
  return normalizeViesOverride(override) === 'MANTER' ? manterLabel : viesAutomatico;
};

export const isViesManual = (override: ViesOverride | null | undefined): boolean => {
  return normalizeViesOverride(override) === 'MANTER';
};
