import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.cache',
  'coverage',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
];

/**
 * Compresse le dossier courant en ZIP (en excluant les dossiers ignorés et .env).
 * Retourne le chemin vers le fichier ZIP temporaire et le contenu du .env si présent.
 */
export async function zipCurrentDirectory(
  sourceDir: string,
  outputPath: string,
  ignorePatterns: string[] = [],
): Promise<{ zipPath: string; envContent: string | null }> {

  const allIgnore = [...DEFAULT_IGNORE, ...ignorePatterns];

  // Lire .env si présent (avant la compression)
  let envContent: string | null = null;
  const envPath = path.join(sourceDir, '.env');
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve({ zipPath: outputPath, envContent }));
    archive.on('error', reject);

    archive.pipe(output);

    // Ajout des fichiers en excluant les patterns ignorés
    archive.glob('**/*', {
      cwd: sourceDir,
      dot: true, // inclure les fichiers cachés (sauf .env)
      ignore: [
        ...allIgnore,
        '.env',       // exclu — envoyé séparément et chiffré
        '.env.*',     // exclure aussi .env.local, .env.production, etc.
        'rushvault-*.zip',
      ],
    });

    void archive.finalize();
  });
}

/** Retourne la taille lisible d'un fichier */
export function getFileSize(filePath: string): string {
  const bytes = fs.statSync(filePath).size;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Supprime un fichier temporaire */
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Ignore cleanup errors
  }
}
