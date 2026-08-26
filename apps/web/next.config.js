/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    // Only injected when explicitly set; the client otherwise derives the
    // API origin at runtime from window.location (Codespaces/tunnel aware).
    ...(process.env.API_URL ? { API_URL: process.env.API_URL } : {}),
  },
};

export default nextConfig;
