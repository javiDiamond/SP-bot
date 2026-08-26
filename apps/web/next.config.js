/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    // Only injected when explicitly set; the client otherwise uses the
    // same-origin /api proxy below (safe behind Codespaces/tunnel forwarding).
    ...(process.env.API_URL ? { API_URL: process.env.API_URL } : {}),
  },
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
