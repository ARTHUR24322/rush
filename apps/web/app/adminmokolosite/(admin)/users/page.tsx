import { createAdminClient } from '@/lib/supabase/server';
import { Users, ShieldCheck } from 'lucide-react';

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
}

export default async function AdminUsersPage() {
  const adminSupabase = createAdminClient();
  const { data: usersData } = await adminSupabase.auth.admin.listUsers();
  const users = usersData?.users || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Base Utilisateurs</h1>
        <p className="text-zinc-500 text-sm">Gérez et consultez les comptes inscrits sur la plateforme.</p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
        <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            Liste Complète ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/50 text-zinc-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Utilisateur (Email)</th>
                <th className="px-6 py-4 font-medium">ID Supabase</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Date d'inscription</th>
                <th className="px-6 py-4 font-medium">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded inline-block">
                      {u.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.email_confirmed_at ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full">
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'Jamais'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-600">
                    Aucun utilisateur trouvé.
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
