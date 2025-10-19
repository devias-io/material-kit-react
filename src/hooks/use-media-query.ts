'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const updateMatch = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches);
    };

    updateMatch(mediaQuery);

    if ('addEventListener' in mediaQuery) {
      const handler = (event: MediaQueryListEvent) => updateMatch(event);
      mediaQuery.addEventListener('change', handler);

      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    }

    const legacyHandler = (event: MediaQueryListEvent) => updateMatch(event);
    mediaQuery.addListener(legacyHandler);

    return () => {
      mediaQuery.removeListener(legacyHandler);
    };
  }, [query]);

  return matches;
}
