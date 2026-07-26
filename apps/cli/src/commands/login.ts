import http from 'http';
import { spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import {
  writeGlobalConfig,
  clearGlobalConfig,
  readGlobalConfig,
  getApiUrl,
} from '../lib/config.js';

const CLI_PORT = 9876;

/**
 * `rushvault login` — Authentification OAuth via le navigateur.
 *
 * Flux :
 * 1. Lance un serveur HTTP local sur :9876
 * 2. Ouvre le navigateur sur la page OAuth Supabase
 * 3. Supabase redirige vers /api/auth/cli-token?port=9876
 * 4. L'API web redirige vers localhost:9876/callback?access_token=...
 * 5. Le CLI capture le token et le stocke dans ~/.rushvault/config.json
 */
export async function loginCommand(options: { apiUrl?: string }) {
  const apiUrl = options.apiUrl ?? getApiUrl();
  const spinner = ora();

  console.log('');
  console.log(chalk.bold.white('🔐 Connexion à RushVault'));
  console.log(chalk.gray(`   Ouverture du navigateur pour l'authentification OAuth...`));
  console.log('');

  // Construction de l'URL OAuth
  // La page web /login lance Supabase OAuth avec la bonne redirect_uri
  const oauthUrl = `${apiUrl}/login?cli=true&port=${CLI_PORT}`;

  // Ouverture du navigateur — utilise spawn() avec args séparés (pas de shell)
  // Protection contre l'injection OS si apiUrl était malveillant
  const openArgs: [string, string[]] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', oauthUrl]]
      : process.platform === 'darwin'
      ? ['open', [oauthUrl]]
      : ['xdg-open', [oauthUrl]];

  console.log(chalk.gray(`Si votre navigateur ne s'ouvre pas, visitez ce lien :`));
  console.log(chalk.cyan.underline(oauthUrl));
  console.log('');

  spawn(openArgs[0], openArgs[1], { detached: true, stdio: 'ignore' }).unref();

  // Serveur HTTP local pour capturer le callback
  await new Promise<void>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${CLI_PORT}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }

      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');
      const expiresAt = url.searchParams.get('expires_at');
      const userId = url.searchParams.get('user_id');
      const email = url.searchParams.get('email');
      const error = url.searchParams.get('error');

      // Page HTML de succès
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>RushVault CLI</title>
            <style>
              body { font-family: system-ui; background: #0a0a0a; color: #fafafa; 
                     display: flex; align-items: center; justify-content: center; 
                     height: 100vh; margin: 0; text-align: center; }
              .card { background: #111; border: 1px solid #222; border-radius: 16px; 
                      padding: 40px; max-width: 400px; }
              h1 { color: ${error ? '#ef4444' : '#8b5cf6'}; margin-bottom: 8px; }
              p { color: #71717a; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>${error ? '❌ Erreur' : '✅ Connecté !'}</h1>
              <p>${error ? 'Authentification échouée. Réessayez.' : 'Vous pouvez fermer cet onglet et retourner au terminal.'}</p>
            </div>
          </body>
        </html>
      `);

      server.close();

      if (error || !accessToken || !refreshToken) {
        reject(new Error(error ?? 'Missing tokens in callback'));
        return;
      }

      // Sauvegarde des tokens
      writeGlobalConfig({
        accessToken,
        refreshToken,
        userId: userId ?? '',
        email: email ?? '',
        expiresAt: parseInt(expiresAt ?? '0', 10),
        apiUrl,
      });

      resolve();
    });

    server.listen(CLI_PORT, () => {
      spinner.start(chalk.gray(`En attente du callback OAuth sur :${CLI_PORT}...`));
    });

    server.on('error', (err) => {
      spinner.fail();
      reject(err);
    });

    // Timeout après 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Timeout: aucune réponse OAuth après 5 minutes'));
    }, 5 * 60 * 1000);
  });

  spinner.stop();

  const config = readGlobalConfig();
  console.log(chalk.green('✅ Connecté avec succès !'));
  console.log(chalk.gray(`   Compte : ${chalk.white(config.email)}`));
  console.log(chalk.gray(`   Token stocké dans : ~/.rushvault/config.json`));
  console.log('');
}

/** `rush logout` — Déconnexion */
export function logoutCommand() {
  const config = readGlobalConfig();
  clearGlobalConfig();
  console.log('');
  console.log(chalk.green('✅ Déconnecté.'));
  if (config.email) {
    console.log(chalk.gray(`   Compte ${config.email} déconnecté`));
  }
  console.log('');
}

/** `rush whoami` — Affiche l'utilisateur connecté */
export function whoamiCommand() {
  const config = readGlobalConfig();
  console.log('');
  if (!config.accessToken || !config.email) {
    console.log(chalk.yellow('⚠️  Non connecté — lancez : rushvault login'));
  } else {
    console.log(chalk.bold.white('👤 Utilisateur connecté'));
    console.log(chalk.gray(`   Email  : ${chalk.white(config.email)}`));
    console.log(chalk.gray(`   API    : ${chalk.white(config.apiUrl)}`));
    const expires = config.expiresAt ? new Date(config.expiresAt * 1000).toLocaleString() : '?';
    console.log(chalk.gray(`   Expire : ${chalk.white(expires)}`));
  }
  console.log('');
}
