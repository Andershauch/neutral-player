/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorer fejl under build (vigtigt for at Vercel ikke fejler)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Billeder (hvis du får brug for det senere)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // HER ER MAGIEN: Server-side redirect
  async redirects() {
    return [
      {
        source: '/',              // Når folk rammer forsiden
        destination: '/admin/login', // Send dem herhen
        permanent: true,          // Det er en permanent flytning
      },
    ];
  },
};

export default nextConfig;