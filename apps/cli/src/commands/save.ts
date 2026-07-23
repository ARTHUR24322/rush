import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';
import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';
import {
  readGlobalConfig,
  readProjectConfig,
  getApiUrl,
  isAuthenticated,
} from '../lib/config.js';
import { zipCurrentDirectory, getFileSize, cleanupTempFile } from '../lib/zipper.js';

/**
 * `rush-save "Mon message"` — La commande principale de RushVault.
 *
 * Flux :
 * 1. Vérifie l'authentification
 * 2. Lit la config du projet (rushvault.json)
 * 3. Scan + compression du dossier courant (excluant node_modules, .git, etc.)
 * 4. Isolation du .env (envoyé séparément pour chiffrement côté serveur)
 * 5. Envoi multipart/form-data vers POST /api/projects/:id/snapshot
 * 6. Affichage du résultat
 */
export async function saveCommand(message: string) {
  console.log('');

  // ── Auth check ──────────────────────────────────────────────────────────────
  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Non connecté. Lancez : rushvault login'));
    process.exit(1);
  }

  const globalConfig = readGlobalConfig();
  const projectConfig = readProjectConfig();

  if (!projectConfig.projectId) {
    console.log(chalk.red('❌ Aucun projet lié à ce dossier.'));
    console.log(chalk.gray('   Lancez : rush init  pour lier un projet existant'));
    console.log(chalk.gray('   Ou créez un projet sur : ' + chalk.white(getApiUrl() + '/dashboard')));
    process.exit(1);
  }

  const apiUrl = getApiUrl();
  const projectId = projectConfig.projectId;
  const token = globalConfig.accessToken!;
  const tmpZip = path.join(os.tmpdir(), `rushvault-${Date.now()}.zip`);

  console.log(chalk.bold.white('💾 RushVault — Sauvegarde en cours'));
  console.log(chalk.gray(`   Projet  : ${chalk.white(projectConfig.projectName ?? projectId)}`));
  console.log(chalk.gray(`   Message : ${chalk.white(message || 'Snapshot')}`));
  console.log('');

  // ── Step 1: Compression ───────────────────────────────────────────────────
  const spinner = ora(chalk.gray('Analyse et compression du projet...')).start();

  let zipPath: string;
  let envContent: string | null;

  try {
    const result = await zipCurrentDirectory(process.cwd(), tmpZip);
    zipPath = result.zipPath;
    envContent = result.envContent;
    const size = getFileSize(zipPath);
    spinner.succeed(
      chalk.gray(`Archive créée : `) +
      chalk.white(size) +
      (envContent ? chalk.gray(' · .env détecté (') + chalk.green('chiffrement AES-256-GCM') + chalk.gray(')') : ''),
    );
  } catch (err) {
    spinner.fail(chalk.red('Erreur lors de la compression'));
    console.error(err);
    process.exit(1);
  }

  // ── Step 2: Upload ────────────────────────────────────────────────────────
  const uploadSpinner = ora(chalk.gray('Upload vers RushVault...')).start();

  try {
    const form = new FormData();
    form.append('archive', fs.createReadStream(zipPath), {
      filename: 'archive.zip',
      contentType: 'application/zip',
    });
    form.append('message', message || 'Snapshot');
    if (envContent) {
      form.append('env', envContent);
    }

    const response = await fetch(`${apiUrl}/api/projects/${projectId}/snapshot`, {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errData = await response.json() as { error?: string };
      throw new Error(errData.error ?? `HTTP ${response.status}`);
    }

    const data = await response.json() as {
      version: {
        number: number;
        id: string;
        fileSizeBytes: number;
        createdAt: string;
      };
    };

    uploadSpinner.succeed(chalk.gray('Snapshot uploadé avec succès !'));

    console.log('');
    console.log(
      chalk.green('✅ Snapshot ') +
      chalk.bold.white(`v${data.version.number}`) +
      chalk.green(' sauvegardé !'),
    );
    console.log(chalk.gray(`   ID       : ${data.version.id}`));
    console.log(chalk.gray(`   Taille   : ${formatBytes(data.version.fileSizeBytes)}`));
    console.log(chalk.gray(`   .env     : ${envContent ? chalk.green('chiffré ✓') : chalk.gray('absent')}`));
    console.log(chalk.gray(`   Dashboard: ${chalk.white(`${apiUrl}/projects/${projectId}`)}`));
    console.log('');

  } catch (err) {
    uploadSpinner.fail(chalk.red('Erreur lors de l\'upload'));
    console.error(chalk.gray((err as Error).message));
    process.exit(1);
  } finally {
    cleanupTempFile(tmpZip);
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
