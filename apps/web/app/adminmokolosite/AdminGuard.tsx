'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, AlertTriangle } from 'lucide-react';

/**
 * AdminGuard — Composant client qui :
 * 1. Détecte la restauration depuis le bfcache (bouton retour)
 *    et vérifie si la session admin est toujours valide.
 * 2. Affiche un dialog de confirmation avant la déconnexion.
 */
export function AdminGuard({ onLogout }: { onLogout: () => Promise<void> }) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Détection du bfcache : "pageshow" avec event.persisted = true
    // signifie que la page a été restaurée depuis le cache mémoire du navigateur
    const handlePageShow = async (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Vérifier si la session admin est toujours valide
        try {
          const res = await fetch('/api/admin/check-auth', { cache: 'no-store' });
          if (!res.ok) {
            // Session expirée — rediriger vers le login immédiatement
            router.replace('/adminmokolosite/login');
          }
        } catch {
          router.replace('/adminmokolosite/login');
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router]);

  const handleLogoutClick = () => {
    setShowDialog(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onLogout();
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  return (
    <>
      {/* Bouton déconnexion */}
      <button
        onClick={handleLogoutClick}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Déconnexion
      </button>

      {/* Dialog de confirmation */}
      {showDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">Déconnexion</h2>
                <p className="text-zinc-400 text-sm">Voulez-vous vous déconnecter ?</p>
              </div>
            </div>

            <p className="text-zinc-500 text-sm mb-6">
              Vous serez redirigé vers la page de connexion et votre session sera entièrement supprimée.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {loading ? 'Déconnexion...' : 'Déconnecter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
