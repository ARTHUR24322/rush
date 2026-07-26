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
import { zipCurrentDirectory, getFileSize, getFileSizeBytes, cleanupTempFile } from '../lib/zipper.js';

/**
 * `rush-save "Mon message"` — La commande principale de RushVault.
 *
 * Flux (upload direct Supabase Storage pour contourner la limite Vercel 4.5MB) :
 * 1. Vérifie l'authentification
 * 2. Lit la config du projet (rushvault.json)
 * 3. Scan + compression du dossier courant
 * 4. Demande une URL signée à l'API → GET /api/projects/:id/upload-url
 * 5. Upload direct vers Supabase Storage (pas de limite de taille !)
 * 6. Enregistre la version → POST /api/projects/:id/snapshot-register
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

  // ── Step 1: Compression ────────────────────────────────────────────────────
  const spinner = ora(chalk.gray('Analyse et compression du projet...')).start();

  let zipPath: string;
  let envContent: string | null;
  let fileSizeBytes: number;

  try {
    const result = await zipCurrentDirectory(process.cwd(), tmpZip);
    zipPath = result.zipPath;
    envContent = result.envContent;
    const size = getFileSize(zipPath);
    fileSizeBytes = getFileSizeBytes(zipPath);
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

  // ── Step 2: Obtenir l'URL signée ──────────────────────────────────────────
  const urlSpinner = ora(chalk.gray('Préparation de l\'upload...')).start();
  let signedUrl: string;
  let storagePath: string;
  let nextVersion: number;

  try {
    const res = await fetch(`${apiUrl}/api/projects/${projectId}/upload-url`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}`);
    }

    const data = await res.json() as {
      signedUrl: string;
      storagePath: string;
      nextVersion: number;
    };

    signedUrl = data.signedUrl;
    storagePath = data.storagePath;
    nextVersion = data.nextVersion;
    urlSpinner.succeed(chalk.gray(`Version v${nextVersion} préparée`));
  } catch (err) {
    urlSpinner.fail(chalk.red('Erreur lors de la préparation'));
    console.error(chalk.gray((err as Error).message));
    cleanupTempFile(tmpZip);
    process.exit(1);
  }

  // ── Step 3: Upload direct vers Supabase Storage ───────────────────────────
  const uploadSpinner = ora(chalk.gray(`Upload direct (${getFileSize(zipPath!)})...`)).start();

  try {
    const fileStream = fs.createReadStream(zipPath!);
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': String(fileSizeBytes!),
      },
      body: fileStream,
    });

    if (!uploadRes.ok) {
      const txt = await uploadRes.text();
      throw new Error(`Upload échoué (HTTP ${uploadRes.status}): ${txt.slice(0, 120)}`);
    }

    uploadSpinner.succeed(chalk.gray('Fichier uploadé vers le stockage'));
  } catch (err) {
    uploadSpinner.fail(chalk.red('Erreur lors de l\'upload'));
    console.error(chalk.gray((err as Error).message));
    cleanupTempFile(tmpZip);
    process.exit(1);
  }

  // ── Step 4: Enregistrement de la version ─────────────────────────────────
  const registerSpinner = ora(chalk.gray('Enregistrement de la version...')).start();

  try {
    const res = await fetch(`${apiUrl}/api/projects/${projectId}/snapshot-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        storagePath,
        nextVersion,
        message: message || 'Snapshot',
        envContent: envContent ?? undefined,
        fileSizeBytes: fileSizeBytes!,
      }),
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

    const data = await res.json() as {
      version: {
        number: number;
        id: string;
        fileSizeBytes: number;
        createdAt: string;
      };
    };

    registerSpinner.succeed(chalk.gray('Snapshot enregistré !'));

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
    registerSpinner.fail(chalk.red('Erreur lors de l\'enregistrement'));
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
