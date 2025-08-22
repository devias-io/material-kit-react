'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import { useColorScheme } from '@mui/material/styles';

import { NoSsr } from '@/components/core/no-ssr';

// --- CHANGE 1: LARGER LOGO SIZE ---
// I've increased these values to make the logo bigger.
// You can adjust these numbers further to get the perfect size.
const HEIGHT = 258; // Example: Increased height
const WIDTH = 521;  // Example: Proportional width


// The props interfaces are simplified for the single logo.
export interface LogoProps {
  height?: number;
  width?: number;
}

export function Logo({ height = HEIGHT, width = WIDTH }: LogoProps): React.JSX.Element {
  const url = '/assets/logo.png';

  // The sx={{ width: 'auto' }} here prevents the logo from ever being distorted.
  return <Box alt="logo" component="img" height={height} src={url} sx={{ width: 'auto' }} />;
}


// This wrapper component is kept for compatibility with your application.
export interface DynamicLogoProps {
  height?: number;
  width?: number;
}

export function DynamicLogo({
  height = HEIGHT,
  width = WIDTH,
  ...props
}: DynamicLogoProps): React.JSX.Element {
  const { colorScheme } = useColorScheme();

  return (
    // --- CHANGE 2: DARK FALLBACK BACKGROUND ---
    // The "bgcolor" property was added here to match your dark theme's background.
    // This removes the "white circular thing" during the initial load.
    <NoSsr fallback={<Box sx={{ height: `${height}px`, width: `${width}px`, bgcolor: '#090E23' }} />}>
      <Logo height={height} width={width} {...props} />
    </NoSsr>
  );
}