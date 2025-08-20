export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    account: '/dashboard/account',
    customers: '/dashboard/customers',
    integrations: '/dashboard/integrations',
    campaigns: '/dashboard/campaigns',
   
    media: '/dashboard/media',
    engagement: '/dashboard/engagement',
    systemSettings: '/dashboard/system-settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;