import { createAdminClient } from '@/lib/supabase/server';
import { FolderOpen } from 'lucide-react';
import Link from 'next/link';

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

export default async function AdminProjectsPage() {
  const adminSupabase = createAdminClient();
  
  // Fetch users for mapping
  const { data: usersData } = await adminSupabase.auth.admin.listUsers();
  const users = usersData?.users || [];
  
  // Fetch projects
  const { data: projects } = await adminSupabase.from('projects').select('*').order('created_at', { ascending: false });
  
  // Fetch versions to calculate size per project
  const { data: versions } = await adminSupabase.from('versions').select('project_id, file_size_bytes');
  
  // Calculate sizes
  const sizesByProject = (versions || []).reduce((acc, version) => {
    acc[version.project_id] = (acc[version.project_id] || 0) + (Number(version.file_size_bytes) || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Registre des Projets</h1>
        <p className="text-zinc-500 text-sm">Supervision de tous les projets sauvegardés par les utilisateurs.</p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
        <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-zinc-400" />
            Tous les Projets ({(projects || []).length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/50 text-zinc-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nom du Projet</th>
                <th className="px-6 py-4 font-medium">Propriétaire</th>
                <th className="px-6 py-4 font-medium">Stockage Utilisé</th>
                <th className="px-6 py-4 font-medium">Date de création</th>
                <th className="px-6 py-4 font-medium">Dernière mise à jour</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(projects || []).map((p) => {
                const owner = users.find(u => u.id === p.user_id);
                const size = sizesByProject[p.id] || 0;
                
                return (
                  <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{p.name}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[250px] mt-0.5">
                        {p.description || 'Aucune description'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{owner?.email || 'Inconnu'}</div>
                      <div className="text-xs font-mono text-zinc-600 mt-0.5">{p.user_id.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full">
                        {formatBytes(size)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {formatDate(p.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/projects/${p.id}`}
                        target="_blank"
                        className="text-xs font-medium text-red-500 hover:text-red-400 hover:underline"
                      >
                        Voir le projet
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!projects || projects.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-600">
                    Aucun projet n'a encore été créé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
