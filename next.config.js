/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ✅ ADICIONAR ISSO - Force new bundle generation
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  
  experimental: {
    forceSwcTransforms: true,
    serverComponentsExternalPackages: ['sharp'],
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  
  images: {
    domains: [
      'raw.githubusercontent.com',
      'brapi.dev',
    ],
  },
  
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
    responseLimit: false,
  },
  
  serverRuntimeConfig: {
    maxFileSize: '12mb'
  },
  
  async headers() {
    return [
      {
        source: '/api/(auth|user|admin|carteiras|agenda|reports|relatorios|notifications|answers|questions|webhooks|hotmart|instagram-cadastro|meus-ativos|report-files|generate-pdf|cron|faq|check-admin)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/carteiras/upload',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ];
  },
}
module.exports = nextConfig;
