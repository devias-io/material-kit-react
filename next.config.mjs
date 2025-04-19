/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_XPIPS_LOGIN_URL: process.env.NEXT_XPIPS_LOGIN_URL,
    NEXT_XPIPS_REGISTER_URL: process.env.NEXT_XPIPS_REGISTER_URL
  }
};

export default nextConfig;
