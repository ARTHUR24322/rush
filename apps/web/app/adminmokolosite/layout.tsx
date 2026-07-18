import { LogOut, ShieldAlert } from 'lucide-react';
import { clearAdminSession } from './actions';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <Link href="/adminmokolosite" className="font-bold text-white tracking-wider uppercase text-sm">
            RushVault <span className="text-red-500">SuperAdmin</span>
          </Link>
        </div>
        
        <form action={clearAdminSession}>
          <button type="submit" className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded border border-zinc-800">
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </form>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
