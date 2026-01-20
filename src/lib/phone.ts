const PHONE_KEYS = [
  'phone',
  'phone_number',
  'phoneNumber',
  'cellphone',
  'cell_phone',
  'mobile',
  'mobile_phone',
  'mobilePhone',
  'whatsapp',
  'whatsapp_number',
  'whatsappNumber',
];

const NESTED_KEYS = ['phone', 'buyer', 'customer', 'client', 'billing', 'contact', 'payer'];

const normalizePrimitive = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return value ? String(value) : null;
  }

  return null;
};

const formatPhoneParts = (
  country?: string | null,
  area?: string | null,
  number?: string | null,
): string | null => {
  if (!number) {
    return null;
  }

  const parts = [country, area, number].filter(Boolean) as string[];
  const combined = parts.join('');

  return combined.length > 0 ? combined : number;
};

const extractFromObject = (source: Record<string, unknown>): string | null => {
  for (const key of PHONE_KEYS) {
    const candidate = normalizePrimitive(source[key]);
    if (candidate) {
      return candidate;
    }
  }

  for (const key of NESTED_KEYS) {
    if (source[key]) {
      const nested = extractPhone(source[key]);
      if (nested) {
        return nested;
      }
    }
  }

  const country = normalizePrimitive(source.country_code ?? source.countryCode ?? source.ddi);
  const area = normalizePrimitive(source.area_code ?? source.areaCode ?? source.ddd);
  const number = normalizePrimitive(
    source.number ?? source.local_number ?? source.phone_number ?? source.phoneNumber,
  );

  return formatPhoneParts(country, area, number);
};

export const extractPhone = (...sources: unknown[]): string | null => {
  for (const source of sources) {
    const direct = normalizePrimitive(source);
    if (direct) {
      return direct;
    }

    if (source && typeof source === 'object') {
      const fromObject = extractFromObject(source as Record<string, unknown>);
      if (fromObject) {
        return fromObject;
      }
    }
  }

  return null;
};

export const normalizeBrazilPhone = (raw: string | null | undefined): string | null => {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.startsWith('55') && digits.length > 10) {
    return `+${digits}`;
  }

  return `+55${digits}`;
};

export const getHotmartBuyerPhone = (webhookData: any, buyerData?: any): string | null => {
  const phoneRaw =
    buyerData?.checkout_phone ??
    webhookData?.data?.buyer?.checkout_phone ??
    webhookData?.buyer?.checkout_phone ??
    webhookData?.checkout_phone;

  return normalizeBrazilPhone(typeof phoneRaw === 'string' ? phoneRaw : null);
};

export const getKiwifyBuyerPhone = (webhookData: any): string | null => {
  const phoneRaw =
    webhookData?.order?.Customer?.mobile ??
    webhookData?.order?.customer?.mobile ??
    webhookData?.Customer?.mobile ??
    webhookData?.customer?.mobile ??
    webhookData?.mobile;

  return normalizeBrazilPhone(typeof phoneRaw === 'string' ? phoneRaw : null);
};
