'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Download, Archive, Clock, Shield,
  ChevronRight, FileArchive, Info, Vault
} from 'lucide-react';

interface Version {
  id: string;
  version_number: number;
  message: string | null;
  file_size_bytes: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ProjectPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/versions`);
        const data = await res.json() as { project: Project; versions: Version[] };
        setProject(data.project);
        setVersions(data.versions ?? []);
      } catch {
        toast.error('Impossible de charger les versions');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [projectId]);

  const handleRollback = async (version: Version) => {
    setDownloading(version.id);
    try {
      const res = await fetch(`/api/projects/${projectId}/rollback/${version.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as {
        downloadUrl: string;
        envContent: string | null;
        version: { number: number };
      };

      // Téléchargement du ZIP
      window.open(data.downloadUrl, '_blank');

      // Affichage du .env si présent
      if (data.envContent) {
        const blob = new Blob([data.envContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `.env.v${data.version.number}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`v${data.version.number} téléchargé + .env déchiffré !`, { duration: 4000 });
      } else {
        toast.success(`v${data.version.number} téléchargé !`);
      }
    } catch {
      toast.error('Erreur lors du rollback');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-32" />
        <div className="space-y-3 mt-8">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Projets
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-300 font-medium">{project?.name}</span>
      </div>

      {/* Project header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">{project?.name}</h1>
          <p className="text-sm text-zinc-500">
            {versions.length} snapshot{versions.length !== 1 ? 's' : ''} · Dernière version :{' '}
            <span className="text-rush-300 font-mono">
              v{versions[0]?.version_number ?? '—'}
            </span>
          </p>
        </div>
        <Link href={`/projects/${projectId}/env`} className="btn-secondary gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          Coffre-fort .env
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button className="pb-3 px-1 text-sm font-medium text-zinc-100 border-b-2 border-rush-500 -mb-px">
          Historique des versions
        </button>
      </div>

      {/* Version Timeline */}
      {versions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="font-medium text-zinc-300 mb-2">Aucune version encore</h3>
          <p className="text-sm text-zinc-600 mb-6 max-w-sm mx-auto">
            Lancez votre premier snapshot depuis le terminal avec la commande ci-dessous
          </p>
          <div className="code-block max-w-sm mx-auto text-left">
            <p>
              <span className="text-zinc-500">$</span>{' '}
              <span className="text-rush-300">rush-save</span>{' '}
              <span className="text-yellow-300">&quot;Premier snapshot&quot;</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="card p-5 flex items-center gap-5 group hover:border-rush-500/20 transition-all duration-200"
            >
              {/* Version badge */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${
                  index === 0
                    ? 'bg-rush-500/20 border-rush-500/30'
                    : 'bg-surface-overlay border-border'
                }`}>
                  <span className="text-[10px] text-zinc-500 font-mono leading-none">v</span>
                  <span className={`text-lg font-bold leading-none font-mono ${
                    index === 0 ? 'text-rush-300' : 'text-zinc-300'
                  }`}>
                    {version.version_number}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-200 truncate">
                  {version.message ?? `Snapshot v${version.version_number}`}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Vault className="w-5 h-5" />
                    {formatDate(version.created_at)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                    <FileArchive className="w-3 h-3" />
                    {formatBytes(version.file_size_bytes)}
                  </span>
                  {index === 0 && (
                    <span className="badge-success text-xs">
                      Dernière version
                    </span>
                  )}
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={() => void handleRollback(version)}
                disabled={!!downloading}
                className="btn-secondary gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {downloading === version.id ? (
                  <span className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Télécharger v{version.version_number}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="mt-8 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          Le téléchargement génère un lien sécurisé valable <strong className="text-zinc-400">15 minutes</strong>.
          Le fichier <code className="text-rush-300 font-mono">.env</code> est automatiquement déchiffré et téléchargé séparément.
        </p>
      </div>
    </div>
  );
}
