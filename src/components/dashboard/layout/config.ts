import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  // --- Renamed Items ---
  { key: 'dashboard', title: 'Dashboard', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'donations', title: 'Donations', href: paths.dashboard.customers, icon: 'gift' },
  { key: 'pooja', title: 'Pooja', href: paths.dashboard.integrations, icon: 'hands-praying' },
  { key: 'prasad', title: 'Prasad', href: paths.dashboard.engagement, icon: 'bowl-food' },
  { key: 'events', title: 'Events', href: paths.dashboard.account, icon: 'calendar' },
  // --- UPDATED THIS LINE ---
  { key: 'campaigns', title: 'Campaigns', href: paths.dashboard.campaigns, icon: 'megaphone' },

  // --- Added New Items ---
  { key: 'media', title: 'Media', href: paths.dashboard.media, icon: 'image' },
  { key: 'engagement', title: 'Engagement', href: paths.dashboard.engagement, icon: 'chats-circle' },
  { key: 'system-settings', title: 'System Settings', href: paths.dashboard.systemSettings, icon: 'gear-six' },
] satisfies NavItemConfig[];