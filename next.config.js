/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    forceSwcTransforms: true,
    serverComponentsExternalPackages: ['sharp'],
    // ✅ ADICIONAR ISSO
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
  
  // ✅ ADICIONAR ISSO
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
    responseLimit: false,
  },

  async rewrites() {
    return [
      {
        source: '/api/notifications/stream',
        destination: '/api/notifications/fluxo',
      },
    ];
  },

  // Configurações para upload de arquivos
  serverRuntimeConfig: {
    maxFileSize: '12mb'
  },
  
  async headers() {
    return [
      // Headers para rotas sensíveis que nunca devem ser cacheadas
      {
        source: '/api/(auth|user|admin|carteiras|agenda|reports|relatorios|notifications|answers|questions|webhooks|hotmart|instagram-cadastro|meus-ativos|report-files|generate-pdf|cron|faq|check-admin)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // Headers específicos para upload de carteiras
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
