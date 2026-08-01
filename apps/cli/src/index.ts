#!/usr/bin/env node
/**
 * RushVault CLI — rushvault / rush-save
 *
 * Usage:
 *   rush-save "Mon message"       Sauvegarde le projet courant (snapshot)
 *   rushvault login                    Connexion OAuth (GitHub / Google)
 *   rushvault logout                   Déconnexion
 *   rushvault whoami                   Affiche l'utilisateur connecté
 *   rushvault init [projectId]         Lie le dossier courant à un projet
 *   rushvault versions                 Historique des versions
 *   rushvault rollback v3              Rollback vers une version spécifique
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand, logoutCommand, whoamiCommand } from './commands/login.js';
import { saveCommand } from './commands/save.js';
import { versionsCommand, initCommand } from './commands/versions.js';
import { rollbackCommand } from './commands/rollback.js';
import pkg from '../package.json';


const program = new Command();

// ─── Branding ─────────────────────────────────────────────────────────────────

program
  .name('rushvault')
  .description(
    chalk.bold.hex('#8b5cf6')('⚡ RushVault') +
    chalk.gray(' — Le disque dur des développeurs\n') +
    chalk.gray('   Snapshots de code en 1 clic · Coffre-fort .env chiffré'),
  )
  .version(pkg.version, '-v, --version', 'Afficher la version');

// ─── rush-save (raccourci) ────────────────────────────────────────────────────

// Si le CLI est invoqué comme "rush-save", on exécute save directement
const isSaveAlias =
  process.argv[1]?.endsWith('rush-save') ||
  process.argv[1]?.endsWith('rush-save.js');

if (isSaveAlias) {
  const message = process.argv.slice(2).join(' ') || 'Snapshot';
  saveCommand(message).catch((err: Error) => {
    console.error(chalk.red(err.message));
    process.exit(1);
  });
} else {
  // ─── Commandes ─────────────────────────────────────────────────────────────

  program
    .command('save [message]')
    .description('Sauvegarde le projet courant (snapshot en 1 clic)')
    .action(async (message: string = 'Snapshot') => {
      await saveCommand(message);
    });

  program
    .command('login')
    .description('Connexion OAuth (GitHub / Google) via le navigateur')
    .option('--api-url <url>', "URL de l'API RushVault", process.env.RUSHVAULT_API_URL || 'https://rush-web-beryl.vercel.app')
    .action(async (options: { apiUrl?: string }) => {
      await loginCommand(options);
    });

  program
    .command('logout')
    .description('Déconnexion et suppression du token local')
    .action(() => logoutCommand());

  program
    .command('whoami')
    .description("Affiche l'utilisateur actuellement connecté")
    .action(() => whoamiCommand());

  program
    .command('init [projectId]')
    .description('Lie le dossier courant à un projet RushVault (crée rushvault.json)')
    .action(async (projectId?: string) => {
      await initCommand(projectId);
    });

  program
    .command('versions')
    .alias('ls')
    .description('Affiche l\'historique des snapshots du projet courant')
    .action(async () => {
      await versionsCommand();
    });

  program
    .command('rollback <version>')
    .description('Télécharge une version spécifique (ex: rush rollback v3)')
    .action(async (version: string) => {
      await rollbackCommand(version);
    });

  const envCmd = program
    .command('env')
    .description('Gérer la synchronisation des variables d\'environnement');

  envCmd
    .command('push')
    .description('Envoie le fichier .env local vers le coffre-fort cloud (remplace les clés existantes)')
    .action(async () => {
      const { envPushCommand } = await import('./commands/env.js');
      await envPushCommand();
    });

  envCmd
    .command('pull')
    .description('Télécharge les variables .env depuis le coffre-fort cloud et les sauvegarde localement')
    .action(async () => {
      const { envPullCommand } = await import('./commands/env.js');
      await envPullCommand();
    });

  // ─── Commande par défaut : save ───────────────────────────────────────────

  // Si on lance "rush 'mon message'" directement (sans sous-commande), on save
  if (
    process.argv.length >= 3 &&
    !['save', 'login', 'logout', 'whoami', 'init', 'versions', 'ls', 'rollback', 'env', '--help', '-h', '--version', '-v'].includes(process.argv[2])
  ) {
    const message = process.argv.slice(2).join(' ');
    saveCommand(message).catch((err: Error) => {
      console.error(chalk.red(err.message));
      process.exit(1);
    });
  } else {
    program.parse(process.argv);
  }
}
