import { createAdminClient } from '@/lib/supabase/server';
import { Users, FolderOpen, HardDrive, Database, Activity, ShieldCheck, Globe } from 'lucide-react';
import { AdminCharts } from '../AdminCharts';

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
  
  // Analytics
  const { data: visits } = await adminSupabase.from('visits').select('*').order('created_at', { ascending: false });
  const uniqueIPs = new Set((visits || []).map(v => v.ip));
  const totalVisitors = uniqueIPs.size;
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Utilisateurs Inscrits', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Projets Hébergés', value: totalProjects, icon: FolderOpen, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          { label: 'Snapshots Sauvegardés', value: totalSnapshots, icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Stockage Utilisé', value: formatBytes(totalStorageBytes), icon: HardDrive, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
          { label: 'Visiteurs Uniques', value: totalVisitors, icon: Globe, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
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

      <AdminCharts visits={visits || []} projects={projects || []} />

      <div className="grid grid-cols-1 gap-8">
        {/* Analytics List - Dernières Visites */}
        <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col h-[400px]">
          <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-400" />
              Dernières Visites Enregistrées
            </h2>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {(visits || []).slice(0, 50).map((v) => (
              <div key={v.id} className="p-3 border border-zinc-800 rounded-lg bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white truncate">
                    {v.ip}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {v.country}
                  </span>
                  <span className="font-mono text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">
                    {v.path}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 flex-shrink-0">
                  {formatDate(v.created_at)}
                </div>
              </div>
            ))}
            {(!visits || visits.length === 0) && (
              <div className="text-center text-zinc-600 text-sm py-10">Aucune visite enregistrée.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
