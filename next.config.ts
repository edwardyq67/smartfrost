// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Deshabilitar ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // También puedes ignorar errores TypeScript si quieres
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;