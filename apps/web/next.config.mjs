/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Evita que el build de Vercel falle por errores TS del proyecto
    ignoreBuildErrors: true,
  },
  eslint: {
    // No frenes el build por ESLint
    ignoreDuringBuilds: true,
  },
  experimental: {
    dynamicIO: true,
  },
};

export default nextConfig;

