import type { NextConfig } from 'next';

const securityHeaders = [
  // Empêche le navigateur de deviner le type MIME (protection contre les attaques MIME sniffing)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Empêche l'inclusion de la page dans une iframe (protection contre le clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Force HTTPS (HSTS) — 1 an, inclut les sous-domaines
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Contrôle les informations envoyées dans le Referer header
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Désactive les fonctionnalités sensibles du navigateur non utilisées
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy — limite les sources de contenu autorisées
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts : soi-même + inline (nécessaire pour Next.js) + Supabase
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles : soi-même + inline (nécessaire pour Tailwind/CSS-in-JS)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Polices
      "font-src 'self' https://fonts.gstatic.com",
      // Images : soi-même + data URIs + GitHub avatars + Google avatars + Supabase Storage
      "img-src 'self' data: blob: https://*.supabase.co https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://lh4.googleusercontent.com https://lh5.googleusercontent.com https://lh6.googleusercontent.com",
      // Connexions API : soi-même + Supabase
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`,
      // Frames : aucune autorisée
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ['@rushvault/crypto'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        // Applique les headers de sécurité à toutes les routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
