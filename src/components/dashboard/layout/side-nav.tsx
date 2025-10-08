'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { Logo } from '@/components/core/logo';
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { useAuthAccess } from '@/hooks/use-auth-access';

import { navItems } from './config';
import { navIcons } from './nav-icons';

function filterNavItems(
  items: NavItemConfig[],
  hasAccessSync: (page: string) => boolean,
  isAdmin: boolean
): NavItemConfig[] {
  return items
    .map(item => {
      if (item.requiresAdmin && !isAdmin) {
        return null;
      }

      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items
          .map(subItem => {
            if (subItem.requiresAdmin && !isAdmin) {
              return null;
            }

            if (!subItem.page) {
              return subItem;
            }

            return hasAccessSync(subItem.page) ? subItem : null;
          })
          .filter((subItem): subItem is NavItemConfig => subItem !== null);

        const hasMainAccess = !item.page || hasAccessSync(item.page);
        const hasSubItems = filteredSubItems.length > 0;

        if (hasMainAccess || hasSubItems) {
          return {
            ...item,
            items: filteredSubItems,
          };
        }

        return null;
      }

      if (!item.page) {
        return item;
      }

      return hasAccessSync(item.page) ? item : null;
    })
    .filter((item): item is NavItemConfig => item !== null);
}

export function SideNav(): React.JSX.Element {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});
  const { planInfo, loading, hasAccessSync } = useAuthAccess();

  const filteredNavItems = React.useMemo(
    () => filterNavItems([...navItems], hasAccessSync, planInfo.isAdmin),
    [hasAccessSync, planInfo.isAdmin]
  );

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Box
      sx={{
        '--SideNav-background': 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%) !important',
        '--SideNav-color': 'var(--mui-palette-common-white)',
        '--NavItem-color': 'var(--mui-palette-neutral-300)',
        '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
        '--NavItem-active-background': '#4dfb01',
        '--NavItem-active-color': '#000000',
        '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
        '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
        '--NavItem-icon-active-color': '#000000',
        '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
        background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        color: 'var(--SideNav-color)',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        height: '100%',
        left: 0,
        maxWidth: '100%',
        position: 'fixed',
        scrollbarWidth: 'none',
        top: 0,
        width: 'var(--SideNav-width)',
        zIndex: 'var(--SideNav-zIndex)',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <Box
          component={RouterLink}
          href={paths.home}
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Logo color="light" height={64} width={64} />
        </Box>

        <Box
          sx={{
            alignItems: 'center',
            border: '1px solid #333333',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            p: '4px 12px',
          }}
        >
          <Box sx={{ flex: '1 1 auto' }}>
            <Typography color="var(--mui-palette-neutral-400)" variant="body2">
              Plano
            </Typography>
            <Typography color="inherit" variant="subtitle1">
              {planInfo.displayName || 'Carregando...'}
              {planInfo.isAdmin && (
                <Typography
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    bgcolor: '#4dfb01',
                    color: '#000',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                  }}
                >
                  ADMIN
                </Typography>
              )}
            </Typography>
          </Box>
        </Box>
      </Stack>

      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />

      <Box
        component="nav"
        sx={{
          flex: '1 1 auto',
          p: '12px',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(100vh - 200px)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.5)',
            },
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)',
        }}
      >
        {loading ? (
          <Typography color="var(--mui-palette-neutral-400)" variant="body2" sx={{ p: 2 }}>
            Carregando menu...
          </Typography>
        ) : (
          renderNavItems({
            pathname,
            items: filteredNavItems,
            expandedItems,
            toggleExpanded,
          })
        )}
      </Box>
    </Box>
  );
}

function renderNavItems({
  items = [],
  pathname,
  expandedItems,
  toggleExpanded,
}: {
  items?: NavItemConfig[];
  pathname: string;
  expandedItems: Record<string, boolean>;
  toggleExpanded: (key: string) => void;
}): React.JSX.Element {
  const children = items.reduce(
    (acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
      const { key, ...item } = curr;
      acc.push(
        <NavItem
          key={key}
          itemKey={key}
          pathname={pathname}
          expandedItems={expandedItems}
          toggleExpanded={toggleExpanded}
          {...item}
        />
      );
      return acc;
    },
    []
  );

  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Stack>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'key'> {
  pathname: string;
  itemKey: string;
  expandedItems: Record<string, boolean>;
  toggleExpanded: (key: string) => void;
}

function NavItem({
  disabled,
  external,
  href,
  icon,
  matcher,
  pathname,
  title,
  items,
  itemKey,
  expandedItems,
  toggleExpanded,
}: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon ? navIcons[icon] : null;
  const hasChildren = items && items.length > 0;
  const isExpanded = expandedItems[itemKey] || false;

  if (href && hasChildren) {
    return (
      <li>
        <Box sx={{ position: 'relative' }}>
          <Box
            component={external ? 'a' : RouterLink}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            sx={{
              alignItems: 'center',
              borderRadius: 1,
              color: 'var(--NavItem-color)',
              cursor: 'pointer',
              display: 'flex',
              flex: '0 0 auto',
              gap: 1,
              p: '6px 16px',
              pr: '40px',
              position: 'relative',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              ...(disabled && {
                bgcolor: 'var(--NavItem-disabled-background)',
                color: 'var(--NavItem-disabled-color)',
                cursor: 'not-allowed',
              }),
              ...(active && {
                bgcolor: 'var(--NavItem-active-background)',
                color: 'var(--NavItem-active-color)',
              }),
              '&:hover': {
                bgcolor: active ? 'var(--NavItem-active-background)' : 'var(--NavItem-hover-background)',
              },
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              {Icon ? (
                <Icon
                  fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
                  fontSize="var(--icon-fontSize-md)"
                  weight={active ? 'fill' : undefined}
                />
              ) : null}
            </Box>
            <Box sx={{ flex: '1 1 auto' }}>
              <Typography
                component="span"
                sx={{
                  color: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  lineHeight: '28px',
                }}
              >
                {title}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleExpanded(itemKey);
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--NavItem-icon-color)',
              width: 24,
              height: 24,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CaretDown
              size={16}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ pl: 2, mt: 1 }}>
            {renderNavItems({
              pathname,
              items: items,
              expandedItems,
              toggleExpanded,
            })}
          </Box>
        </Collapse>
      </li>
    );
  }

  return (
    <li>
      <Box
        {...(href
          ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
          : { role: 'button' })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '6px 16px',
          position: 'relative',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && {
            bgcolor: 'var(--NavItem-disabled-background)',
            color: 'var(--NavItem-disabled-color)',
            cursor: 'not-allowed',
          }),
          ...(active && {
            bgcolor: 'var(--NavItem-active-background)',
            color: 'var(--NavItem-active-color)',
          }),
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          {Icon ? (
            <Icon
              fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
              fontSize="var(--icon-fontSize-md)"
              weight={active ? 'fill' : undefined}
            />
          ) : null}
        </Box>
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography
            component="span"
            sx={{
              color: 'inherit',
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: '28px',
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
    </li>
  );
}
