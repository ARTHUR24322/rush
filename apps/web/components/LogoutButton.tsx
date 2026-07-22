'use client';

import { useState, useRef } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

export default function LogoutButton() {
  const [showModal, setShowModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const confirmLogout = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  return (
    <>
      <form ref={formRef} action="/api/auth/signout" method="post">
        <button 
          onClick={handleLogoutClick}
          type="button" 
          className="btn-ghost p-2 hover:bg-red-500/10 hover:text-red-400 transition-colors" 
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </form>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">
                Déconnexion
              </h3>
              <p className="text-center text-zinc-400 text-sm mb-6">
                Voulez-vous vraiment vous déconnecter de votre compte RushVault ?
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
