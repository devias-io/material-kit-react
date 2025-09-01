/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    forceSwcTransforms: true,
    serverComponentsExternalPackages: ['sharp']
  },
  
  images: {
    domains: [
      'raw.githubusercontent.com',
      'brapi.dev',
    ],
  },
  
  // Configurações para upload de arquivos
  serverRuntimeConfig: {
    maxFileSize: '10mb'
  },
  
  async headers() {
    return [
      // Headers para APIs financeiras (sem cache)
      {
        source: '/api/financial/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
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
          }
        ]
      }
    ];
  },
}

module.exports = nextConfig;