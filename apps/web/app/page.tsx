'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Vault, Shield, GitBranch, Lock, Clock, Download,
  Terminal, Package, Zap, CheckCircle2, ArrowRight,
  Code2, FolderOpen, Upload, Key, RotateCcw, Cpu,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGitHubLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard` },
    });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard` },
    });
  };

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden">
        {/* Glow orbs background */}
        <div className="glow-orb w-96 h-96 bg-rush-600 top-[-10%] left-[20%]" />
        <div className="glow-orb w-80 h-80 bg-zinc-800 bottom-[10%] right-[10%]" style={{ animationDelay: '3s' }} />

        {/* ───────────────────────────── HERO ───────────────────────────── */}
        <section className="relative z-10 text-center pt-20 pb-20 px-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rush-500/10 border border-rush-500/20 text-rush-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-rush-400 animate-pulse" />
            Le disque dur des développeurs
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-rush-gradient flex items-center justify-center shadow-glow animate-pulse">
              <Vault className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-400 leading-tight mb-4 text-balance tracking-tight">
            Votre code est en sécurité. <span className="gradient-text animate-pulse">Vous pouvez enfin souffler.</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-3xl mx-auto mb-10 text-balance leading-relaxed font-medium">
            Un seul clic pour capturer votre projet et chiffrer vos secrets <code className="text-rush-300 font-mono text-sm bg-rush-500/10 px-1.5 py-0.5 rounded border border-rush-500/20 shadow-inner">.env</code>. La puissance de la sauvegarde, la simplicité du ZIP.
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
                  options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard` },
                });
                if (error) alert('Erreur: ' + error.message);
                else alert('Lien magique envoyé ! Vérifiez votre boîte mail.');
                setLoading(false);
              }}
              className="flex flex-col gap-3 mb-6"
            >
              <div className="flex items-center gap-2">
                <input type="email" name="email" required placeholder="votre@email.com" className="input flex-1" disabled={loading} />
                <button type="submit" disabled={loading} className="btn-primary">S'inscrire / Connexion</button>
              </div>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-black px-2 text-zinc-500">Ou avec OAuth</span></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleGitHubLogin} disabled={loading} className="btn-secondary text-sm px-6 py-2.5 gap-2 w-full justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </button>
              <button onClick={handleGoogleLogin} disabled={loading} className="btn-secondary text-sm px-6 py-2.5 gap-2 w-full justify-center">
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

          <p className="text-xs text-zinc-600">Aucune carte bancaire requise · Gratuit pour commencer</p>
        </section>

        {/* ─────────────────────── CLI DEMO ─────────────────────────────── */}
        <section className="relative z-10 max-w-2xl mx-auto px-6 mb-28">
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

        {/* ─────────────────────── FEATURES ─────────────────────────────── */}
        <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <p className="text-xs text-rush-400 font-mono uppercase tracking-widest mb-3">À quoi ça sert</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Tout ce qu'il vous faut pour ne plus jamais perdre de code</h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
              RushVault combine snapshots de projet, coffre-fort de secrets et rollback instantané — dans un seul outil pensé pour les développeurs solo et les petites équipes.
            </p>
          </div>

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
              {
                icon: <Cpu className="w-5 h-5 text-purple-400" />,
                title: 'CLI puissant',
                desc: 'Intégrez RushVault dans vos scripts, vos hooks Git ou votre CI/CD. Tout en ligne de commande.',
              },
              {
                icon: <GitBranch className="w-5 h-5 text-yellow-400" />,
                title: 'Multi-projets',
                desc: 'Gérez autant de projets que vous le souhaitez. Dashboard clair pour naviguer entre vos snapshots.',
              },
              {
                icon: <Shield className="w-5 h-5 text-red-400" />,
                title: 'Chiffrement Zero-Knowledge',
                desc: 'Vos données sont chiffrées côté client avant tout envoi. Personne, pas même nous, ne peut y accéder.',
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

        {/* ──────────────────── HOW IT WORKS ────────────────────────────── */}
        <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <p className="text-xs text-rush-400 font-mono uppercase tracking-widest mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Simple comme un <code className="text-rush-300 font-mono text-2xl">git commit</code></h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
              Sous le capot, RushVault compresse votre code, chiffre vos secrets et les envoie sur nos serveurs sécurisés. Tout ça en moins de 5 secondes.
            </p>
          </div>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-rush-500/50 via-rush-500/20 to-transparent hidden md:block" />

            <div className="space-y-6 md:pl-16">
              {[
                {
                  step: '01',
                  icon: <FolderOpen className="w-5 h-5 text-rush-400" />,
                  title: 'Scan du projet',
                  desc: 'La CLI parcourt votre dossier, liste tous vos fichiers et détecte automatiquement votre fichier .env.',
                  code: '$ rush-save "Ma feature"',
                },
                {
                  step: '02',
                  icon: <Key className="w-5 h-5 text-green-400" />,
                  title: 'Chiffrement des secrets',
                  desc: 'Vos variables .env sont chiffrées localement avec AES-256-GCM avant de quitter votre machine.',
                  code: '→ .env chiffré (AES-256-GCM)',
                },
                {
                  step: '03',
                  icon: <Upload className="w-5 h-5 text-blue-400" />,
                  title: 'Compression et upload',
                  desc: 'Le projet est compressé en ZIP et envoyé vers le stockage sécurisé Supabase Storage.',
                  code: '→ Upload 2.3 MB en 1.4s',
                },
                {
                  step: '04',
                  icon: <RotateCcw className="w-5 h-5 text-purple-400" />,
                  title: 'Rollback en 1 clic',
                  desc: 'Depuis le dashboard, téléchargez n\'importe quelle version avec un lien sécurisé valable 15 minutes.',
                  code: '✅ Snapshot v7 restauré',
                },
              ].map(({ step, icon, title, desc, code }) => (
                <div key={step} className="relative card p-6 group flex gap-5">
                  <div className="absolute -left-[3.25rem] top-1/2 -translate-y-1/2 hidden md:flex w-6 h-6 rounded-full bg-black border border-rush-500/50 items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-rush-500" />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-overlay border border-border flex items-center justify-center shrink-0 group-hover:border-rush-500/30 transition-colors">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-zinc-600">ÉTAPE {step}</span>
                      <h3 className="font-semibold text-zinc-100">{title}</h3>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-3">{desc}</p>
                    <code className="text-xs text-rush-300 bg-rush-500/10 px-3 py-1.5 rounded-md font-mono border border-rush-500/20">{code}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────── GET STARTED ──────────────────────────────── */}
        <section id="get-started" className="relative z-10 max-w-5xl mx-auto px-6 pb-28">
          <div className="text-center mb-14">
            <p className="text-xs text-rush-400 font-mono uppercase tracking-widest mb-3">Par où commencer</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Opérationnel en 3 minutes</h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
              Pas de configuration complexe, pas de serveur à gérer. Créez votre compte et sauvegardez votre premier projet en moins de 3 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '1',
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: 'Créez votre compte',
                desc: 'Inscrivez-vous gratuitement avec GitHub, Google ou votre email. Aucune carte bancaire requise.',
                cta: 'S\'inscrire gratuitement',
                href: '#',
                onClick: handleGitHubLogin,
              },
              {
                num: '2',
                icon: <Package className="w-6 h-6 text-blue-400" />,
                title: 'Installez la CLI',
                desc: 'Un seul package npm. Fonctionne sur macOS, Linux et Windows. Compatible avec tous vos projets.',
                cta: 'Voir l\'installation',
                href: '#install',
              },
              {
                num: '3',
                icon: <CheckCircle2 className="w-6 h-6 text-rush-400" />,
                title: 'Sauvegardez',
                desc: 'Lancez rush-save dans n\'importe quel dossier. Votre projet est sauvegardé et vos secrets chiffrés.',
                cta: 'Voir la CLI',
                href: '#install',
              },
            ].map(({ num, icon, title, desc, cta, href, onClick }) => (
              <div key={num} className="card-hover p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-surface-overlay border border-border flex items-center justify-center">
                    {icon}
                  </div>
                  <span className="text-5xl font-extrabold text-zinc-800 font-mono">{num}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
                <a
                  href={href}
                  onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm text-rush-400 hover:text-rush-300 font-medium transition-colors"
                >
                  {cta} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────── INSTALL ──────────────────────────────── */}
        <section id="install" className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
          <div className="text-center mb-14">
            <p className="text-xs text-rush-400 font-mono uppercase tracking-widest mb-3">Installation</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">Installez la CLI RushVault</h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
              Disponible via npm. Fonctionne partout où Node.js est installé.
            </p>
          </div>

          <div className="space-y-4">
            {/* Étape 1 */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-rush-500/20 border border-rush-500/30 flex items-center justify-center text-rush-400 text-xs font-bold">1</span>
                <h3 className="font-semibold text-zinc-100">Installer la CLI globalement</h3>
              </div>
              <div className="code-block text-sm">
                <p><span className="text-zinc-500">$</span> <span className="text-rush-300">npm install -g @rushvault/cli</span></p>
              </div>
              <p className="text-xs text-zinc-600 mt-3">Nécessite Node.js ≥ 18. Fonctionne sur macOS, Linux et Windows.</p>
            </div>

            {/* Étape 2 */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-rush-500/20 border border-rush-500/30 flex items-center justify-center text-rush-400 text-xs font-bold">2</span>
                <h3 className="font-semibold text-zinc-100">Connexion à votre compte</h3>
              </div>
              <div className="code-block text-sm space-y-1">
                <p><span className="text-zinc-500">$</span> <span className="text-rush-300">rush login</span></p>
                <p className="text-zinc-500 pl-2">→ Ouverture du navigateur...</p>
                <p className="text-green-400 pl-2">✅ Connecté en tant que vous@email.com</p>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-rush-500/20 border border-rush-500/30 flex items-center justify-center text-rush-400 text-xs font-bold">3</span>
                <h3 className="font-semibold text-zinc-100">Sauvegarder votre premier projet</h3>
              </div>
              <div className="code-block text-sm space-y-1">
                <p><span className="text-zinc-500">$</span> <span className="text-zinc-400">cd</span> <span className="text-yellow-300">mon-projet</span></p>
                <p><span className="text-zinc-500">$</span> <span className="text-rush-300">rush-save</span> <span className="text-yellow-300">&quot;Premier snapshot 🚀&quot;</span></p>
                <p className="text-zinc-500 pl-2">→ 23 fichiers détectés</p>
                <p className="text-zinc-500 pl-2">→ .env chiffré et isolé</p>
                <p className="text-zinc-500 pl-2">→ Upload en cours...</p>
                <p className="text-green-400 pl-2">✅ Snapshot v1 créé !</p>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-rush-500/20 border border-rush-500/30 flex items-center justify-center text-rush-400 text-xs font-bold">4</span>
                <h3 className="font-semibold text-zinc-100">Commandes utiles</h3>
              </div>
              <div className="code-block text-sm space-y-2">
                <p><span className="text-rush-300">rush-save</span> <span className="text-yellow-300">&quot;message&quot;</span>    <span className="text-zinc-600"># Créer un snapshot</span></p>
                <p><span className="text-rush-300">rush list</span>                 <span className="text-zinc-600"># Lister les snapshots</span></p>
                <p><span className="text-rush-300">rush restore</span> <span className="text-blue-300">v3</span>        <span className="text-zinc-600"># Restaurer la version 3</span></p>
                <p><span className="text-rush-300">rush env</span>                  <span className="text-zinc-600"># Voir les secrets chiffrés</span></p>
                <p><span className="text-rush-300">rush --help</span>               <span className="text-zinc-600"># Aide complète</span></p>
              </div>
            </div>
          </div>

          {/* CTA final */}
          <div className="mt-12 text-center">
            <div className="card p-10">
              <div className="w-14 h-14 rounded-2xl bg-rush-gradient flex items-center justify-center shadow-glow mx-auto mb-5">
                <Vault className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-3">Prêt à sécuriser votre code ?</h3>
              <p className="text-zinc-500 text-sm mb-6">Rejoignez les développeurs qui ne perdent plus jamais leur travail.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleGitHubLogin} disabled={loading} className="btn-primary px-8 py-3 text-sm">
                  Commencer gratuitement <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={handleGoogleLogin} disabled={loading} className="btn-secondary px-8 py-3 text-sm">
                  Connexion avec Google
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/50 py-8 px-6 text-center">
          <p className="text-xs text-zinc-600">
            © 2025 RushVault · Fait avec ❤️ pour les développeurs · <span className="text-zinc-700">v0.1.0</span>
          </p>
        </footer>
      </main>
    </>
  );
}
