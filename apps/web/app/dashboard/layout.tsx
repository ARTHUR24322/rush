import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Vault, LogOut } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rush-gradient flex items-center justify-center shadow-glow">
                <Vault className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold gradient-text text-sm">RushVault</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="nav-link text-xs">
                Projets
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 hidden sm:flex">
              {user.user_metadata?.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profil" 
                  className="w-7 h-7 rounded-full border border-border/50 shadow-sm"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-border/50 flex items-center justify-center shadow-sm">
                  <span className="text-xs text-zinc-400 font-medium uppercase">
                    {user.email?.[0] || '?'}
                  </span>
                </div>
              )}
              <span className="text-xs text-zinc-400 font-medium truncate max-w-40">
                {user.email}
              </span>
            </div>
            <div className="w-px h-4 bg-border/50 hidden sm:block"></div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
