import type { Components } from '@mui/material/styles';

import type { Theme } from '../types';
import { MuiAvatar } from './avatar';
import { MuiButton } from './button';
import { MuiCard } from './card';
import { MuiCardContent } from './card-content';
import { MuiCardHeader } from './card-header';
import { MuiLink } from './link';
import { MuiStack } from './stack';
import { MuiTab } from './tab';
import { MuiTableBody } from './table-body';
import { MuiTableCell } from './table-cell';
import { MuiTableHead } from './table-head';

export const components = {
  MuiAvatar,
  MuiButton,
  MuiCard,
  MuiCardContent,
  MuiCardHeader,
  MuiLink,
  MuiStack,
  MuiTab,
  MuiTableBody,
  MuiTableCell,
  MuiTableHead,
} satisfies Components<Theme>;
