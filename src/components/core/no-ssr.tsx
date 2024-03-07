'use client';

import * as React from 'react';
import useEnhancedEffect from '@mui/utils/useEnhancedEffect';

export interface NoSsrProps {
  children?: React.ReactNode;
  defer?: boolean;
  fallback?: React.ReactNode;
}

// https://github.com/mui/material-ui/blob/master/packages/mui-base/src/NoSsr/NoSsr.tsx
// without prop-types
export function NoSsr(props: NoSsrProps): React.JSX.Element {
  const { children, defer = false, fallback = null } = props;
  const [mountedState, setMountedState] = React.useState(false);

  useEnhancedEffect((): void => {
    if (!defer) {
      setMountedState(true);
    }
  }, [defer]);

  React.useEffect((): void => {
    if (defer) {
      setMountedState(true);
    }
  }, [defer]);

  return <React.Fragment>{mountedState ? children : fallback}</React.Fragment>;
}
