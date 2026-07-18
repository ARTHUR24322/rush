import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // eslint and typescript config removed
  // Nécessaire pour parser les multipart/form-data dans les API routes
  serverExternalPackages: ['@rushvault/crypto'],
};

export default nextConfig;
