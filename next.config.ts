/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorer TypeScript fejl under build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorer ESLint fejl under build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Tillad billeder fra alle steder (hvis du bruger det senere)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;