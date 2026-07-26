import { Shield, LayoutDashboard, Users, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { clearAdminSession } from '../actions';
import { AdminGuard } from '../AdminGuard';

// Force dynamic rendering — ensures every request checks the cookie (no caching)
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('rushvault_admin_token');
  if (!adminToken || adminToken.value !== 'true') {
    redirect('/adminmokolosite/login');
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono flex flex-col md:flex-row">
      {/* Sidebar Latérale */}
      <aside className="w-full md:w-64 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col sticky top-0 md:h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-bold text-white tracking-tight">SuperAdmin</span>
        </div>
        
        <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
          <Link href="/adminmokolosite" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors whitespace-nowrap">
            <LayoutDashboard className="w-4 h-4" />
            Vue d&apos;ensemble
          </Link>
          <Link href="/adminmokolosite/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors whitespace-nowrap">
            <Users className="w-4 h-4" />
            Utilisateurs
          </Link>
          <Link href="/adminmokolosite/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors whitespace-nowrap">
            <FolderOpen className="w-4 h-4" />
            Projets
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800 hidden md:block">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-zinc-500 truncate">Superviseur</p>
            </div>
          </div>
          {/* AdminGuard gère le dialog de confirmation + détection bfcache */}
          <AdminGuard onLogout={clearAdminSession} />
        </div>
      </aside>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
