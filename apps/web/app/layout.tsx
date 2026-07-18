import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import MatrixSplash from '@/components/MatrixSplash';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RushVault — Sauvegarde de code simplifiée',
    template: '%s | RushVault',
  },
  description:
    'Snapshots de code en 1 clic et coffre-fort ultra-sécurisé pour vos variables .env. La simplicité de Git sans sa complexité.',
  keywords: ['code backup', 'snapshot', 'env vault', 'developer tools'],
  authors: [{ name: 'RushVault' }],
  openGraph: {
    type: 'website',
    title: 'RushVault',
    description: 'Le disque dur des développeurs',
    siteName: 'RushVault',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="font-sans">
        <MatrixSplash />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fafafa',
              border: '1px solid #2a2a2a',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#000000' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fafafa' },
            },
          }}
        />
      </body>
    </html>
  );
}
