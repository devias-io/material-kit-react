'use client';
import React from 'react';

const ResponsiveContext = React.createContext(null);

function compute() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;
  const screenSize = width <= 480 ? 'mobile' : width <= 768 ? 'tablet' : width <= 1024 ? 'laptop' : 'desktop';
  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isLaptop: screenSize === 'laptop',
    isDesktop: screenSize === 'desktop',
    isMobileOrTablet: screenSize === 'mobile' || screenSize === 'tablet',
    width,
    height,
    breakpoints: { mobile: 480, tablet: 768, laptop: 1024, desktop: 1200 },
  };
}

export function ResponsiveProvider({ children }) {
  const [state, setState] = React.useState(compute);

  React.useEffect(() => {
    let timeoutId;
    const onResize = () => {
      clearTimeout(timeoutId);
      const delay = window.innerWidth <= 768 ? 300 : 150;
      timeoutId = setTimeout(() => setState(compute()), delay);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return <ResponsiveContext.Provider value={state}>{children}</ResponsiveContext.Provider>;
}

export function useResponsive() {
  const ctx = React.useContext(ResponsiveContext);
  return ctx || compute(); // fallback SSR
}