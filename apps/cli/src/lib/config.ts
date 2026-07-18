import os from 'os';
import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(os.homedir(), '.rushvault');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface RushConfig {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  expiresAt: number;
  apiUrl: string;
}

export interface ProjectConfig {
  projectId: string;
  projectName: string;
}

const PROJECT_CONFIG_FILE = 'rushvault.json';

/** Lit la configuration globale (~/.rushvault/config.json) */
export function readGlobalConfig(): Partial<RushConfig> {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as Partial<RushConfig>;
  } catch {
    return {};
  }
}

/** Sauvegarde la configuration globale */
export function writeGlobalConfig(config: Partial<RushConfig>): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/** Supprime la configuration globale (déconnexion) */
export function clearGlobalConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
}

/** Lit la config du projet courant (rushvault.json dans le dossier courant) */
export function readProjectConfig(): Partial<ProjectConfig> {
  try {
    const filePath = path.join(process.cwd(), PROJECT_CONFIG_FILE);
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Partial<ProjectConfig>;
  } catch {
    return {};
  }
}

/** Sauvegarde la config du projet courant */
export function writeProjectConfig(config: ProjectConfig): void {
  const filePath = path.join(process.cwd(), PROJECT_CONFIG_FILE);
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

/** Vérifie si l'utilisateur est connecté */
export function isAuthenticated(): boolean {
  const config = readGlobalConfig();
  if (!config.accessToken) return false;
  // Vérifie si le token n'est pas expiré (avec 60s de marge)
  if (config.expiresAt && Date.now() / 1000 > config.expiresAt - 60) {
    return false; // Token expiré — à rafraîchir
  }
  return true;
}

/** Retourne le token d'accès ou null */
export function getAccessToken(): string | null {
  const config = readGlobalConfig();
  return config.accessToken ?? null;
}

/** Retourne l'URL de l'API */
export function getApiUrl(): string {
  const config = readGlobalConfig();
  return config.apiUrl ?? process.env.RUSHVAULT_API_URL ?? 'http://localhost:3000';
}
