'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Plus, FolderOpen, Clock, Archive, ChevronRight,
  Search, Vault, X, Terminal, Zap, Copy
} from 'lucide-react';
import { UserActivityChart } from './UserActivityChart';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  versions: { count: number }[];
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json() as { projects: Project[] };
      setProjects(data.projects ?? []);
    } catch {
      toast.error('Impossible de charger les projets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Projet "${newName}" créé !`);
      setShowModal(false);
      setNewName('');
      setNewDesc('');
      void fetchProjects();
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Mes Projets</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {projects.length} projet{projects.length !== 1 ? 's' : ''} sauvegardé{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Nouveau projet
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          type="text"
          placeholder="Rechercher un projet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      <UserActivityChart />

      {/* Projects Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="font-medium text-zinc-300 mb-2">
            {search ? 'Aucun projet trouvé' : 'Aucun projet encore'}
          </h3>
          <p className="text-sm text-zinc-600 mb-6">
            {search
              ? 'Essayez un autre terme de recherche'
              : 'Créez votre premier projet et commencez à sauvegarder votre code'}
          </p>
          {!search && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Créer un projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
          {filtered.map((project) => {
            const versionCount = project.versions?.[0]?.count ?? 0;
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="card-hover p-5 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rush-gradient/20 border border-rush-500/20 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-rush-300" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-zinc-100 truncate">{project.name}</h3>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(project.id);
                        toast.success('ID copié !');
                      }}
                      className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
                      title="Copier l'ID du projet"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {project.description && (
                    <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{project.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                    <span className="badge-version">
                      <Archive className="w-3 h-3" />
                      {versionCount} version{versionCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(project.updated_at)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CLI Guide */}
      <div className="mt-12 p-6 rounded-2xl border border-rush-500/20 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rush-gradient/20 border border-rush-500/30 flex items-center justify-center shadow-lg shadow-rush-500/10">
            <Terminal className="w-5 h-5 text-rush-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Guide d'utilisation du CLI</h2>
            <p className="text-sm text-zinc-400">Sauvegardez votre code directement depuis votre terminal</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-rush-500/30 transition-colors">
            <div className="text-rush-400 text-sm font-bold mb-2">1. Installation</div>
            <p className="text-xs text-zinc-400 mb-4 h-8">Installez le CLI globalement sur votre machine.</p>
            <code className="block p-2 bg-zinc-900 rounded-lg text-xs text-rush-300 font-mono border border-zinc-800/80 truncate" title="npm i -g @rushvault/cli">
              npm i -g @rushvault/cli
            </code>
          </div>
          
          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-rush-500/30 transition-colors">
            <div className="text-rush-400 text-sm font-bold mb-2">2. Connexion</div>
            <p className="text-xs text-zinc-400 mb-4 h-8">Connectez-vous à votre compte RushVault.</p>
            <code className="block p-2 bg-zinc-900 rounded-lg text-xs text-rush-300 font-mono border border-zinc-800/80 truncate">
              rushvault login
            </code>
          </div>
          
          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-rush-500/30 transition-colors">
            <div className="text-rush-400 text-sm font-bold mb-2">3. Initialisation</div>
            <p className="text-[11px] leading-tight text-zinc-400 mb-4 h-8">Liez votre dossier au projet distant (crée le fichier rushvault.json).</p>
            <code className="block p-2 bg-zinc-900 rounded-lg text-xs text-rush-300 font-mono border border-zinc-800/80 truncate" title="rushvault init <project-id>">
              rushvault init &lt;id&gt;
            </code>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 relative overflow-hidden hover:border-rush-500/50 transition-colors">
            <div className="absolute inset-0 bg-rush-500/5 pointer-events-none" />
            <div className="relative">
              <div className="text-rush-400 text-sm font-bold mb-2 flex items-center gap-1.5">
                4. Sauvegarde <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
              </div>
              <p className="text-xs text-zinc-400 mb-4 h-8">Créez un snapshot en un clic.</p>
              <code className="block p-2 bg-zinc-900 rounded-lg text-xs text-white font-mono border border-rush-500/30 truncate shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                rush-save "message"
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Ideas Guide */}
      <div className="mt-8 p-6 rounded-2xl border border-blue-500/20 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Besoin d'idées ?</h2>
            <p className="text-sm text-zinc-400">Voici comment vous pouvez utiliser RushVault au quotidien</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-blue-500/30 transition-colors">
            <h3 className="text-blue-400 text-sm font-bold mb-2">Projets persos & TPs</h3>
            <p className="text-xs text-zinc-400">Sauvegardez vos projets d'école ou side-projects à chaque étape importante pour ne jamais rien perdre et pouvoir faire un "rollback" si besoin.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-blue-500/30 transition-colors">
            <h3 className="text-blue-400 text-sm font-bold mb-2">Protection des secrets</h3>
            <p className="text-xs text-zinc-400">Fini les clés d'API perdues ! Utilisez <code className="text-blue-300">rushvault env push</code> pour stocker vos fichiers .env en toute sécurité dans le coffre-fort cloud.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-blue-500/30 transition-colors">
            <h3 className="text-blue-400 text-sm font-bold mb-2">Expérimentations</h3>
            <p className="text-xs text-zinc-400">Prenez un snapshot avec <code className="text-blue-300">rush-save</code> juste avant de faire une refonte majeure de votre code ou de tester une nouvelle bibliothèque.</p>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-glow animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-100">Nouveau projet</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="input-label">Nom du projet *</label>
                <input
                  type="text"
                  placeholder="mon-super-projet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="input-label">Description (optionnel)</label>
                <textarea
                  placeholder="Une courte description de votre projet..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="input resize-none h-20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={creating || !newName.trim()} className="btn-primary flex-1">
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
