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
 * `rush rollback <versionNumber>` — Télécharge une version spécifique
 *
 * Génère un lien sécurisé (15 min) et télécharge le ZIP + .env déchiffré
 */
export async function rollbackCommand(versionTarget: string) {
  console.log('');

  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Non connecté. Lancez : rush login'));
    process.exit(1);
  }

  const projectConfig = readProjectConfig();
  if (!projectConfig.projectId) {
    console.log(chalk.red('❌ Aucun projet lié. Lancez : rush init'));
    process.exit(1);
  }

  const { accessToken } = readGlobalConfig();
  const apiUrl = getApiUrl();
  const projectId = projectConfig.projectId;

  // Résoudre le numéro de version (ex: "v3" ou "3")
  const versionNumber = parseInt(versionTarget.replace(/^v/, ''), 10);
  if (isNaN(versionNumber)) {
    console.log(chalk.red(`❌ Numéro de version invalide : "${versionTarget}"`));
    console.log(chalk.gray('   Exemple : rush rollback v3'));
    process.exit(1);
  }

  const spinner = ora(chalk.gray(`Chargement de la version v${versionNumber}...`)).start();

  try {
    // 1. Trouver l'ID de la version par son numéro
    const versionsRes = await fetch(`${apiUrl}/api/projects/${projectId}/versions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!versionsRes.ok) throw new Error('Impossible de charger les versions');
    const versionsData = await versionsRes.json() as {
      versions: Array<{ id: string; version_number: number }>;
    };

    const targetVersion = versionsData.versions.find(
      (v) => v.version_number === versionNumber,
    );

    if (!targetVersion) {
      spinner.fail(chalk.red(`Version v${versionNumber} introuvable`));
      process.exit(1);
    }

    // 2. Appel du rollback pour obtenir l'URL signée + .env déchiffré
    const rollbackRes = await fetch(
      `${apiUrl}/api/projects/${projectId}/rollback/${targetVersion.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!rollbackRes.ok) throw new Error('Rollback impossible');
    const rollbackData = await rollbackRes.json() as {
      downloadUrl: string;
      envContent: string | null;
      version: { number: number; fileSizeBytes: number };
    };

    spinner.text = chalk.gray('Téléchargement du snapshot...');

    // 3. Téléchargement du ZIP
    const zipRes = await fetch(rollbackData.downloadUrl);
    if (!zipRes.ok) throw new Error('Échec du téléchargement');

    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const zipFileName = `rollback-v${versionNumber}.zip`;
    fs.writeFileSync(path.join(process.cwd(), zipFileName), zipBuffer);

    // 4. Sauvegarde du .env déchiffré si présent
    if (rollbackData.envContent) {
      const envFileName = `.env.v${versionNumber}`;
      fs.writeFileSync(path.join(process.cwd(), envFileName), rollbackData.envContent, 'utf-8');
      spinner.succeed(chalk.gray(`Snapshot v${versionNumber} téléchargé + .env déchiffré`));
      console.log('');
      console.log(chalk.green(`✅ Rollback v${versionNumber} terminé !`));
      console.log(chalk.gray(`   Code   : ${chalk.white(zipFileName)}`));
      console.log(chalk.gray(`   .env   : ${chalk.white(envFileName)} `) + chalk.green('(déchiffré ✓)'));
    } else {
      spinner.succeed(chalk.gray(`Snapshot v${versionNumber} téléchargé`));
      console.log('');
      console.log(chalk.green(`✅ Rollback v${versionNumber} terminé !`));
      console.log(chalk.gray(`   Code   : ${chalk.white(zipFileName)}`));
      console.log(chalk.gray(`   .env   : aucun`));
    }

    console.log('');
    console.log(chalk.yellow('⚠️  Renommez le .env en ".env" avant de lancer votre app.'));
    console.log('');

  } catch (err) {
    spinner.fail(chalk.red('Erreur lors du rollback'));
    console.error(chalk.gray((err as Error).message));
    process.exit(1);
  }
}
