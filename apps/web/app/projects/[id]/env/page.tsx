'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Shield, Plus, Eye, EyeOff, Trash2,
  Key, ChevronRight, Lock, Save, X
} from 'lucide-react';

interface EnvVariable {
  id: string;
  key_name: string;
  updated_at: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function EnvVaultPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});

  const fetchVars = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/env`);
      const data = await res.json() as { variables: EnvVariable[] };
      setVariables(data.variables ?? []);
    } catch {
      toast.error('Impossible de charger le coffre-fort');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchVars(); }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || newValue === undefined) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyName: newKey, value: newValue }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${newKey.toUpperCase()} sauvegardé !`);
      setShowAdd(false);
      setNewKey('');
      setNewValue('');
      void fetchVars();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (keyName: string) => {
    if (!confirm(`Supprimer la variable ${keyName} ?`)) return;
    setDeleting(keyName);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/env?keyName=${encodeURIComponent(keyName)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error();
      toast.success(`${keyName} supprimé`);
      void fetchVars();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Projets
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/projects/${projectId}`} className="hover:text-zinc-300 transition-colors">
          Projet
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-300">Coffre-fort .env</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Coffre-fort .env</h1>
            <p className="text-xs text-zinc-500">Chiffrement AES-256-GCM · Zero-Knowledge</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Security notice */}
      <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5 flex items-start gap-3 mb-6">
        <Lock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          Vos variables sont chiffrées avec <strong className="text-zinc-300">AES-256-GCM</strong> avant d&apos;être stockées.
          Les valeurs ne sont jamais visibles dans notre base de données.
          Elles sont uniquement déchiffrées lors d&apos;un rollback.
        </p>
      </div>

      {/* Variables list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14" />)}
        </div>
      ) : variables.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <Key className="w-7 h-7 text-zinc-600" />
          </div>
          <h3 className="font-medium text-zinc-300 mb-2">Aucune variable encore</h3>
          <p className="text-sm text-zinc-600 mb-4">
            Ajoutez vos secrets .env et ils seront automatiquement attachés au prochain snapshot
          </p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Ajouter une variable
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {variables.map((v) => (
            <div key={v.id} className="env-row group">
              {/* Key name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-md bg-surface-overlay border border-border flex items-center justify-center flex-shrink-0">
                  <Key className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-zinc-200 truncate">
                    {v.key_name}
                  </p>
                  <p className="text-xs text-zinc-600">Modifié le {formatDate(v.updated_at)}</p>
                </div>
              </div>

              {/* Masked value */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-zinc-600 tracking-[0.2em]">
                  ••••••••••••
                </span>

                {/* Actions (visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(v.key_name)}
                    disabled={deleting === v.key_name}
                    className="btn-danger p-1.5"
                    title="Supprimer"
                  >
                    {deleting === v.key_name ? (
                      <span className="w-3.5 h-3.5 border border-red-500 border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Variable Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-glow animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Nouvelle variable secrète
              </h2>
              <button onClick={() => setShowAdd(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="input-label">Nom de la clé</label>
                <input
                  type="text"
                  placeholder="DATABASE_URL"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                  className="input font-mono"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="input-label">Valeur secrète</label>
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    placeholder="postgresql://user:pass@host/db"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="input font-mono pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                  >
                    {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Sera chiffrée immédiatement avec AES-256-GCM
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Chiffrement...' : 'Chiffrer & Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
