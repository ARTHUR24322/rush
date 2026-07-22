import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Vault, LogOut } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rush-gradient flex items-center justify-center shadow-glow">
                <Vault className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold gradient-text text-sm">RushVault</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block truncate max-w-32">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
