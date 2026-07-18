import { createAdminClient } from '@/lib/supabase/server';
import { Users, FolderOpen, HardDrive, Database, Activity, ShieldCheck } from 'lucide-react';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
}

export default async function AdminDashboardPage() {
  const adminSupabase = createAdminClient();
  
  // Fetch platform data using service role
  const { data: usersData } = await adminSupabase.auth.admin.listUsers();
  const users = usersData?.users || [];
  
  const { data: projects } = await adminSupabase.from('projects').select('*').order('created_at', { ascending: false });
  const { data: versions } = await adminSupabase.from('versions').select('file_size_bytes');
  
  const totalProjects = projects?.length || 0;
  const totalSnapshots = versions?.length || 0;
  const totalStorageBytes = (versions || []).reduce((acc, v) => acc + (Number(v.file_size_bytes) || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Vue d'ensemble de la Plateforme</h1>
        <p className="text-zinc-500 text-sm">Supervision globale de l'infrastructure RushVault.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs Inscrits', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Projets Hébergés', value: totalProjects, icon: FolderOpen, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          { label: 'Snapshots Sauvegardés', value: totalSnapshots, icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Stockage Total Utilisé', value: formatBytes(totalStorageBytes), icon: HardDrive, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-xl border bg-zinc-950 flex flex-col ${stat.border}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <Activity className="w-4 h-4 text-zinc-700" />
            </div>
            <div className="mt-auto">
              <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-sm text-zinc-500 mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List */}
        <div className="lg:col-span-1 border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              Base Utilisateurs
            </h2>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {users.map((u) => (
              <div key={u.id} className="p-3 border border-zinc-800 rounded-lg bg-black flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate pr-2">
                    {u.email}
                  </span>
                  {u.email_confirmed_at ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  ) : null}
                </div>
                <div className="text-xs text-zinc-600">
                  ID: <span className="font-mono">{u.id.split('-')[0]}...</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Inscrit le {formatDate(u.created_at)}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center text-zinc-600 text-sm py-10">Aucun utilisateur.</div>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="lg:col-span-2 border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-zinc-400" />
              Registre des Projets
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/50 text-zinc-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">Projet</th>
                  <th className="px-4 py-3 font-medium">Propriétaire (ID)</th>
                  <th className="px-4 py-3 font-medium">Création</th>
                  <th className="px-4 py-3 font-medium">Dernière Modif.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {(projects || []).map((p) => {
                  const owner = users.find(u => u.id === p.user_id);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-xs text-zinc-600 truncate max-w-[200px]">{p.description || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-300">{owner?.email || 'Utilisateur inconnu'}</div>
                        <div className="text-xs font-mono text-zinc-600">{p.user_id.split('-')[0]}...</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {formatDate(p.updated_at)}
                      </td>
                    </tr>
                  );
                })}
                {(!projects || projects.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-zinc-600">
                      Aucun projet hébergé pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
