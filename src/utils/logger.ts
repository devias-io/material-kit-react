const isDebugEnabled = process.env.NODE_ENV !== 'production';

export const debugLog = (...args: unknown[]) => {
  if (isDebugEnabled) {
    console.log(...args);
  }
};

export const debugWarn = (...args: unknown[]) => {
  if (isDebugEnabled) {
    console.warn(...args);
  }
};

export const debugError = (...args: unknown[]) => {
  if (isDebugEnabled) {
    console.error(...args);
  }
};

