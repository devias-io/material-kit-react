export type ViesOverride = 'AUTO' | 'MANTER';

export const DEFAULT_VIES_OVERRIDE: ViesOverride = 'AUTO';

export interface ViesBadgePalette {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

const DEFAULT_BADGE_PALETTE: ViesBadgePalette = {
  backgroundColor: '#fef3c7',
  textColor: '#d97706',
  borderColor: '#fde68a'
};

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

export const getViesBadgePalette = (vies: string | null | undefined): ViesBadgePalette => {
  const normalized = (vies ?? '').trim().toLowerCase();

  if (normalized === 'compra') {
    return {
      backgroundColor: '#dcfce7',
      textColor: '#059669',
      borderColor: '#bbf7d0'
    };
  }

  if (normalized.startsWith('manter')) {
    return {
      backgroundColor: '#e5e7eb',
      textColor: '#1f2937',
      borderColor: '#d1d5db'
    };
  }

  return DEFAULT_BADGE_PALETTE;
};
