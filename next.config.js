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
      bodySizeLimit: '50mb',
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
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
  
  // Configurações para upload de arquivos
  serverRuntimeConfig: {
    maxFileSize: '50mb' // ✅ AUMENTAR DE 10mb PARA 50mb
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
