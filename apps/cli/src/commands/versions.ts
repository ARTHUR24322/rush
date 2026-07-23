import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';
import {
  readGlobalConfig,
  readProjectConfig,
  writeProjectConfig,
  getApiUrl,
  isAuthenticated,
} from '../lib/config.js';

/**
 * `rush versions` — Affiche l'historique des snapshots du projet courant
 */
export async function versionsCommand() {
  console.log('');

  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Non connecté. Lancez : rushvault login'));
    process.exit(1);
  }

  const projectConfig = readProjectConfig();
  if (!projectConfig.projectId) {
    console.log(chalk.red('❌ Aucun projet lié. Lancez : rush init'));
    process.exit(1);
  }

  const { accessToken } = readGlobalConfig();
  const apiUrl = getApiUrl();
  const spinner = ora(chalk.gray('Chargement des versions...')).start();

  try {
    const res = await fetch(
      `${apiUrl}/api/projects/${projectConfig.projectId}/versions`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as {
      project: { name: string };
      versions: Array<{
        id: string;
        version_number: number;
        message: string | null;
        file_size_bytes: number;
        created_at: string;
      }>;
    };

    spinner.stop();

    console.log(chalk.bold.white(`📁 ${data.project.name}`));
    console.log(chalk.gray(`   ${data.versions.length} snapshot(s)\n`));

    if (data.versions.length === 0) {
      console.log(chalk.gray('   Aucun snapshot encore. Lancez : rush-save "Mon message"'));
    } else {
      data.versions.forEach((v, i) => {
        const isLatest = i === 0;
        const date = new Date(v.created_at).toLocaleString('fr-FR');
        const size = formatBytes(v.file_size_bytes);
        const tag = isLatest ? chalk.green(' ← dernière') : '';

        console.log(
          chalk.bold(isLatest ? chalk.white(`  v${v.version_number}`) : chalk.gray(`  v${v.version_number}`)) +
          tag,
        );
        console.log(chalk.gray(`     Message : ${v.message ?? '—'}`));
        console.log(chalk.gray(`     Date    : ${date}  · ${size}`));
        console.log('');
      });
    }
  } catch (err) {
    spinner.fail(chalk.red('Erreur'));
    console.error(chalk.gray((err as Error).message));
    process.exit(1);
  }
}

/**
 * `rush init [projectId]` — Lie le dossier courant à un projet RushVault
 */
export async function initCommand(projectId?: string) {
  console.log('');

  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Non connecté. Lancez : rushvault login'));
    process.exit(1);
  }

  const { accessToken } = readGlobalConfig();
  const apiUrl = getApiUrl();

  if (!projectId) {
    // Liste les projets disponibles
    const spinner = ora(chalk.gray('Chargement de vos projets...')).start();
    try {
      const res = await fetch(`${apiUrl}/api/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json() as {
        projects: Array<{ id: string; name: string; versions: { count: number }[] }>;
      };
      spinner.stop();
      console.log(chalk.bold.white('📦 Vos projets :'));
      data.projects.forEach((p) => {
        const count = p.versions?.[0]?.count ?? 0;
        console.log(
          chalk.gray(`  ${p.id}`) +
          chalk.white(`  ${p.name}`) +
          chalk.gray(`  (${count} versions)`),
        );
      });
      console.log('');
      console.log(chalk.gray('Lancez : rush init <project-id>'));
    } catch (err) {
      spinner.fail();
      console.error((err as Error).message);
    }
    return;
  }

  // Vérification du projet
  const spinner = ora(chalk.gray('Vérification du projet...')).start();
  try {
    const res = await fetch(`${apiUrl}/api/projects/${projectId}/versions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Projet introuvable');
    const data = await res.json() as { project: { id: string; name: string } };

    writeProjectConfig({ projectId: data.project.id, projectName: data.project.name });
    spinner.succeed(chalk.gray('rushvault.json créé'));

    console.log('');
    console.log(chalk.green('✅ Projet lié avec succès !'));
    console.log(chalk.gray(`   Projet  : ${chalk.white(data.project.name)}`));
    console.log(chalk.gray(`   Vous pouvez maintenant lancer : rush-save "Mon message"`));
    console.log('');
  } catch (err) {
    spinner.fail(chalk.red('Projet introuvable'));
    console.error(chalk.gray((err as Error).message));
    process.exit(1);
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
