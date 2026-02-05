/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorer TypeScript fejl under build
  typescript: {
    ignoreBuildErrors: true,
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