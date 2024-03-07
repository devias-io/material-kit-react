'use client';

import * as React from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import createCache from '@emotion/cache';
import type { EmotionCache, Options as OptionsOfCreateCache } from '@emotion/cache';
import { CacheProvider as DefaultCacheProvider } from '@emotion/react';

interface Registry {
  cache: EmotionCache;
  flush: () => { name: string; isGlobal: boolean }[];
}

export interface NextAppDirEmotionCacheProviderProps {
  options: Omit<OptionsOfCreateCache, 'insertionPoint'>;
  CacheProvider?: (props: { value: EmotionCache; children: React.ReactNode }) => React.JSX.Element | null;
  children: React.ReactNode;
}

// Adapted from https://github.com/garronej/tss-react/blob/main/src/next/appDir.tsx
export default function NextAppDirEmotionCacheProvider(props: NextAppDirEmotionCacheProviderProps): React.JSX.Element {
  const { options, CacheProvider = DefaultCacheProvider, children } = props;

  const [registry] = React.useState<Registry>(() => {
    const cache = createCache(options);
    cache.compat = true;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Expected
    const prevInsert = cache.insert;
    let inserted: { name: string; isGlobal: boolean }[] = [];
    cache.insert = (...args) => {
      const [selector, serialized] = args;

      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({ name: serialized.name, isGlobal: !selector });
      }

      return prevInsert(...args);
    };
    const flush = (): { name: string; isGlobal: boolean }[] => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML((): React.JSX.Element | null => {
    const inserted = registry.flush();

    if (inserted.length === 0) {
      return null;
    }

    let styles = '';
    let dataEmotionAttribute = registry.cache.key;

    const globals: { name: string; style: string }[] = [];

    inserted.forEach(({ name, isGlobal }) => {
      const style = registry.cache.inserted[name];

      if (typeof style !== 'boolean') {
        if (isGlobal) {
          globals.push({ name, style });
        } else {
          styles += style;
          dataEmotionAttribute += ` ${name}`;
        }
      }
    });

    return (
      <React.Fragment>
        {globals.map(
          ({ name, style }): React.JSX.Element => (
            <style
              dangerouslySetInnerHTML={{ __html: style }}
              data-emotion={`${registry.cache.key}-global ${name}`}
              key={name}
            />
          )
        )}
        {styles ? <style dangerouslySetInnerHTML={{ __html: styles }} data-emotion={dataEmotionAttribute} /> : null}
      </React.Fragment>
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}
