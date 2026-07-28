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
    let mounted = true;

    const checkAuth = async (isMount = false) => {
      try {
        // On mount, add a small grace delay to avoid false positives during
        // server cold starts or slow hydration
        if (isMount) {
          await new Promise((r) => setTimeout(r, 800));
        }
        if (!mounted) return;

        const res = await fetch('/api/admin/check-auth', {
          cache: 'no-store',
          // Set a timeout so a slow network doesn't trigger a false logout
          signal: AbortSignal.timeout(5000),
        });

        // ONLY redirect on an explicit 401 from the server.
        // Any other error (network failure, timeout, 500…) is ignored.
        if (res.status === 401 && mounted) {
          window.location.replace('/adminmokolosite/login');
        }
      } catch {
        // Network error / timeout → do NOT logout the admin.
        // The server-side layout already protects every request.
      }
    };

    // Check on mount (with grace delay)
    checkAuth(true);

    // Re-check when tab becomes visible again (e.g. after using back button)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth(false);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      mounted = false;
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
