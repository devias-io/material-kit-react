import type { NavItemConfig } from '@/types/nav';

export function isNavItemActive({
  disabled,
  external,
  href,
  matcher,
  pathname,
}: Pick<NavItemConfig, 'disabled' | 'external' | 'href' | 'matcher'> & { pathname: string }): boolean {
  if (disabled || !href || external) {
    return false;
  }

  if (matcher) {
    if (matcher.type === 'startsWith') {
      return pathname.startsWith(matcher.href);
    }

    if (matcher.type === 'equals') {
      return pathname === matcher.href;
    }

    return false;
  }

  return pathname === href;
}
