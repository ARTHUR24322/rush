import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';
import {
  readGlobalConfig,
  readProjectConfig,
  getApiUrl,
  isAuthenticated,
} from '../lib/config.js';

/**
 * `rushvault env push` — Envoie le fichier .env local vers le coffre-fort cloud
 */
export async function envPushCommand() {
  console.log('');

  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Non connecté. Lancez : rushvault login'));
    process.exit(1);
  }

  const globalConfig = readGlobalConfig();
  const projectConfig = readProjectConfig();

  if (!projectConfig.projectId) {
    console.log(chalk.red('❌ Aucun projet lié à ce dossier.'));
    process.exit(1);
  }

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log(chalk.yellow('⚠️ Aucun fichier .env trouvé dans le dossier courant.'));
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (!envContent.trim()) {
    console.log(chalk.yellow('⚠️ Le fichier .env est vide.'));
    process.exit(1);
  }

  const apiUrl = getApiUrl();
  const projectId = projectConfig.projectId;
  const token = globalConfig.accessToken!;

  const spinner = ora(chalk.gray('Synchronisation des variables .env vers le cloud...')).start();

  try {
    const res = await fetch(`${apiUrl}/api/projects/${projectId}/env/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ envContent }),
    });

    if (!res.ok) {
      let errMsg: string;
      try {
        const errData = await res.json() as { error?: string };
        errMsg = errData.error ?? `HTTP ${res.status}`;
      } catch {
        errMsg = `HTTP ${res.status}`;
      }
      throw new Error(errMsg);
    }

    const data = await res.json() as { success: boolean; variablesCount: number };
    
    spinner.succeed(chalk.green(`Synchronisation réussie : ${data.variablesCount} variable(s) poussée(s).`));
    console.log('');

  } catch (err) {
    spinner.fail(chalk.red('Erreur lors du push des variables d\'environnement.'));
    console.error(chalk.gray((err as Error).message));
    process.exit(1);
  }
}

/**
 * `rushvault env pull` — Télécharge les variables .env depuis le coffre-fort cloud
 */
export async function envPullCommand() {
  console.log('');

  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Non connecté. Lancez : rushvault login'));
    process.exit(1);
  }

  const globalConfig = readGlobalConfig();
  const projectConfig = readProjectConfig();

  if (!projectConfig.projectId) {
    console.log(chalk.red('❌ Aucun projet lié à ce dossier.'));
    process.exit(1);
  }

  const apiUrl = getApiUrl();
  const projectId = projectConfig.projectId;
  const token = globalConfig.accessToken!;

  const spinner = ora(chalk.gray('Téléchargement des variables .env depuis le cloud...')).start();

  try {
    const res = await fetch(`${apiUrl}/api/projects/${projectId}/env/pull`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      let errMsg: string;
      try {
        const errData = await res.json() as { error?: string };
        errMsg = errData.error ?? `HTTP ${res.status}`;
      } catch {
        errMsg = `HTTP ${res.status}`;
      }
      throw new Error(errMsg);
    }

    const data = await res.json() as { envContent: string | null };

    if (!data.envContent) {
      spinner.info(chalk.yellow('Aucune variable d\'environnement stockée pour ce projet.'));
      return;
    }

    spinner.succeed(chalk.green('Variables .env téléchargées et déchiffrées avec succès.'));

    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      const backupPath = path.join(process.cwd(), `.env.backup-${Date.now()}`);
      fs.renameSync(envPath, backupPath);
      console.log(chalk.gray(`   L'ancien fichier .env a été renommé en ${path.basename(backupPath)}`));
    }

    fs.writeFileSync(envPath, data.envContent, 'utf-8');
    console.log(chalk.green('✅ Fichier .env mis à jour !'));
    console.log('');

  } catch (err) {
    spinner.fail(chalk.red('Erreur lors du pull des variables d\'environnement.'));
    console.error(chalk.gray((err as Error).message));
    process.exit(1);
  }
}
