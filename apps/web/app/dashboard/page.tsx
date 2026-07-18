'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Plus, FolderOpen, Clock, Archive, ChevronRight,
  Search, Vault, X
} from 'lucide-react';

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

                  <h3 className="font-semibold text-zinc-100 mb-1 truncate">{project.name}</h3>
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

      {/* CLI hint */}
      <div className="mt-12 p-4 rounded-xl border border-rush-500/20 bg-rush-500/5 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-rush-500/20 flex items-center justify-center flex-shrink-0">
          <Vault className="w-4 h-4 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-300">Sauvegarder depuis le terminal</p>
          <code className="text-xs text-rush-300 font-mono">rush-save &quot;Mon message&quot;</code>
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
