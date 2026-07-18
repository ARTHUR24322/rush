'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Vault, Shield, GitBranch, Terminal, ArrowRight, Lock, Clock, Download } from 'lucide-react';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGitHubLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Glow orbs background */}
      <div className="glow-orb w-96 h-96 bg-rush-600 top-[-10%] left-[20%]" />
      <div
        className="glow-orb w-80 h-80 bg-zinc-800 bottom-[10%] right-[10%]"
        style={{ animationDelay: '3s' }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rush-gradient flex items-center justify-center shadow-glow">
            <Vault className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">RushVault</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono">v0.1.0</span>
          <button onClick={handleGitHubLogin} disabled={loading} className="btn-primary text-sm px-5">
            Se connecter
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center pt-24 pb-20 px-6 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rush-500/10 border border-rush-500/20 text-rush-300 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-rush-400 animate-pulse" />
          Le disque dur des développeurs
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-100 leading-tight mb-6 text-balance">
          Votre code est en sécurité.
          <br />
          <span className="gradient-text">Vous pouvez enfin souffler.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 text-balance">
          Un seul clic pour capturer votre projet entier. Un coffre-fort chiffré pour vos secrets{' '}
          <code className="text-rush-300 font-mono text-sm bg-rush-500/10 px-1.5 py-0.5 rounded">.env</code>.
          La puissance de la sauvegarde, la simplicité du ZIP.
        </p>

        {/* Login Forms */}
        <div className="max-w-md mx-auto mb-6">
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const email = (e.target as any).email.value;
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard` }
              });
              if (error) {
                alert("Erreur: " + error.message);
              } else {
                alert("Lien magique envoyé ! Vérifiez votre boîte mail.");
              }
              setLoading(false);
            }}
            className="flex flex-col gap-3 mb-6"
          >
            <div className="flex items-center gap-2">
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="votre@email.com" 
                className="input flex-1"
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="btn-primary">
                S'inscrire / Connexion
              </button>
            </div>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-black px-2 text-zinc-500">Ou avec OAuth</span></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="btn-secondary text-sm px-6 py-2.5 gap-2 w-full justify-center"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-secondary text-sm px-6 py-2.5 gap-2 w-full justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          Aucune carte bancaire requise · Gratuit pour commencer
        </p>
      </section>

      {/* CLI Demo */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 mb-24">
        <div className="code-block">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-zinc-600 text-xs">Terminal</span>
          </div>
          <div className="space-y-1.5">
            <p><span className="text-zinc-500">$</span> <span className="text-rush-300">rush-save</span> <span className="text-yellow-300">&quot;Ajout authentification JWT&quot;</span></p>
            <p className="text-zinc-500 pl-2">→ Scan du dossier...</p>
            <p className="text-zinc-500 pl-2">→ Isolement du .env (chiffrement AES-256-GCM)</p>
            <p className="text-zinc-500 pl-2">→ Compression (47 fichiers, 2.3 MB)</p>
            <p className="text-zinc-500 pl-2">→ Upload vers RushVault...</p>
            <p className="text-green-400 pl-2">✅ Snapshot <span className="text-rush-300">v7</span> sauvegardé avec succès !</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Clock className="w-5 h-5 text-rush-400" />,
              title: 'Snapshots en 1 clic',
              desc: 'Capturez l\'état entier de votre projet à tout moment. Revenez à n\'importe quelle version passée sans conflit.',
            },
            {
              icon: <Lock className="w-5 h-5 text-green-400" />,
              title: 'Coffre-fort .env',
              desc: 'Vos secrets chiffrés avec AES-256-GCM. Approche Zero-Knowledge — même nous ne pouvons pas les lire.',
            },
            {
              icon: <Download className="w-5 h-5 text-blue-400" />,
              title: 'Rollback instantané',
              desc: 'Lien de téléchargement sécurisé (15 min) avec le .env déchiffré. Retour à la version précédente en secondes.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card p-6 group">
              <div className="w-10 h-10 rounded-lg bg-surface-overlay border border-border flex items-center justify-center mb-4 group-hover:border-rush-500/30 transition-colors">
                {icon}
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
