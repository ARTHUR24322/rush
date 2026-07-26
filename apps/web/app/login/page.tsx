'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, GitBranch, Mail, Loader2, Key } from 'lucide-react';
import Navbar from '@/components/Navbar';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const isCli = searchParams.get('cli') === 'true';
  const cliPort = searchParams.get('port') || '9876';

  const getRedirectUrl = () => {
    if (isCli) {
      return `${window.location.origin}/api/auth/cli-token?port=${cliPort}`;
    }
    return `${window.location.origin}/api/auth/callback?next=/dashboard`;
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: getRedirectUrl() },
    });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() },
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-rush-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-rush-800/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rush-600 to-rush-400 flex items-center justify-center shadow-lg shadow-rush-500/20">
            <Key className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          {isCli ? 'Connexion CLI RushVault' : 'Connexion à RushVault'}
        </h1>
        <p className="text-zinc-400 text-center mb-8">
          {isCli 
            ? 'Connectez-vous pour autoriser le terminal à accéder à votre compte.' 
            : 'Accédez à votre espace développeur.'}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-all border border-zinc-700"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GitBranch className="w-5 h-5" />}
            Continuer avec GitHub
          </button>
          
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-all border border-zinc-700"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
            Continuer avec Google
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-rush-500 animate-spin" />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </>
  );
}
