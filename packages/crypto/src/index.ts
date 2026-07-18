/**
 * @rushvault/crypto
 *
 * Module de chiffrement AES-256-GCM pour RushVault.
 * Utilise uniquement le module `crypto` natif de Node.js — aucune dépendance externe.
 *
 * Stratégie Zero-Knowledge :
 * - La clé de chiffrement n'est JAMAIS stockée en base de données.
 * - Elle est dérivée du mot de passe utilisateur via PBKDF2 à chaque session.
 * - Seuls le `iv`, `authTag` et `encryptedValue` sont persistés (inutilisables sans la clé).
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
  createHash,
} from 'crypto';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm' as const;
const KEY_LENGTH = 32;       // 256 bits
const IV_LENGTH = 16;        // 128 bits (recommandé pour GCM)
const AUTH_TAG_LENGTH = 16;  // 128 bits (maximum GCM)
const PBKDF2_ITERATIONS = 310_000; // OWASP 2024 recommandation
const PBKDF2_DIGEST = 'sha256';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  /** Valeur chiffrée, encodée en base64 */
  encryptedValue: string;
  /** Initialization Vector, base64 (16 bytes) */
  iv: string;
  /** GCM Authentication Tag, base64 (16 bytes) */
  authTag: string;
}

export interface ParsedEnvFile {
  [key: string]: string;
}

// ─── Dérivation de clé ────────────────────────────────────────────────────────

/**
 * Dérive une clé AES-256 depuis un mot de passe utilisateur via PBKDF2.
 * Le salt doit être unique par utilisateur (stocker en BDD, côté serveur).
 *
 * @param password  Mot de passe en clair de l'utilisateur
 * @param salt      Salt unique (32 bytes hex string recommandé)
 * @returns         Buffer de 32 bytes (clé AES-256)
 */
export function deriveKeyFromPassword(password: string, salt: string): Buffer {
  return pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST,
  );
}

/**
 * Génère un salt cryptographiquement aléatoire pour un nouvel utilisateur.
 * À stocker en base de données (n'est PAS un secret).
 */
export function generateSalt(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Dérive une clé depuis une MASTER_KEY serveur et un identifiant unique.
 * Utilisé pour le chiffrement côté serveur (API key, project-level encryption).
 *
 * @param masterKey   Variable d'environnement MASTER_KEY (64 hex chars = 32 bytes)
 * @param context     Identifiant unique (ex: project_id)
 */
export function deriveServerKey(masterKey: string, context: string): Buffer {
  const keyBuffer = Buffer.from(masterKey, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`MASTER_KEY must be exactly ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`);
  }
  // HKDF simplifié : SHA-256(masterKey || context)
  return createHash('sha256')
    .update(Buffer.concat([keyBuffer, Buffer.from(context, 'utf8')]))
    .digest();
}

// ─── Chiffrement ──────────────────────────────────────────────────────────────

/**
 * Chiffre une chaîne de texte avec AES-256-GCM.
 *
 * @param plaintext   Texte à chiffrer (ex: valeur d'une variable .env)
 * @param key         Clé AES-256 (Buffer de 32 bytes)
 * @returns           Payload chiffré : { encryptedValue, iv, authTag }
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedPayload {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes, got ${key.length}`);
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedValue: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Déchiffre un payload AES-256-GCM.
 * Lève une exception si le tag d'authentification ne correspond pas
 * (données corrompues ou clé incorrecte).
 *
 * @param payload   Payload chiffré (encryptedValue, iv, authTag en base64)
 * @param key       Clé AES-256 (Buffer de 32 bytes)
 * @returns         Texte déchiffré
 */
export function decrypt(payload: EncryptedPayload, key: Buffer): string {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes, got ${key.length}`);
  }

  const iv = Buffer.from(payload.iv, 'base64');
  const encryptedData = Buffer.from(payload.encryptedValue, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]).toString('utf8');
}

// ─── Fichiers .env ────────────────────────────────────────────────────────────

/**
 * Parse le contenu d'un fichier .env en objet clé/valeur.
 * Gère les commentaires, les lignes vides, et les valeurs avec guillemets.
 *
 * @param content   Contenu brut du fichier .env
 * @returns         Objet { KEY: 'value', ... }
 */
export function parseEnvFile(content: string): ParsedEnvFile {
  const result: ParsedEnvFile = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    // Ignorer les commentaires et lignes vides
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Supprimer les guillemets simples ou doubles
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) result[key] = value;
  }

  return result;
}

/**
 * Sérialise un objet clé/valeur en contenu de fichier .env.
 */
export function serializeEnvFile(vars: ParsedEnvFile): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
}

/**
 * Chiffre toutes les valeurs d'un fichier .env.
 * Retourne un tableau de payloads chiffrés avec la clé associée.
 *
 * @param envContent  Contenu brut du fichier .env
 * @param key         Clé AES-256
 */
export function encryptEnvFile(
  envContent: string,
  key: Buffer,
): Array<{ keyName: string } & EncryptedPayload> {
  const parsed = parseEnvFile(envContent);
  return Object.entries(parsed).map(([keyName, value]) => ({
    keyName,
    ...encrypt(value, key),
  }));
}

/**
 * Déchiffre un tableau de variables .env chiffrées.
 * Retourne le contenu du fichier .env en clair.
 *
 * @param encryptedVars   Tableau de variables chiffrées
 * @param key             Clé AES-256
 */
export function decryptEnvFile(
  encryptedVars: Array<{ keyName: string } & EncryptedPayload>,
  key: Buffer,
): string {
  const lines = encryptedVars.map(({ keyName, ...payload }) => {
    const value = decrypt(payload, key);
    return `${keyName}="${value}"`;
  });
  return lines.join('\n');
}
