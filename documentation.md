# 📦 RushVault — Documentation Complète du Projet

## 🎯 Qu'est-ce que RushVault ?

**RushVault** est un outil de sauvegarde de code source en ligne de commande (CLI), couplé à une application web. En une seule commande (`rush-save`), le développeur crée un **snapshot** (une archive ZIP) de son projet, le charge sur le cloud, et garde l'historique de toutes ses versions. Les variables d'environnement (`.env`) sont chiffrées et stockées séparément dans un **coffre-fort sécurisé**.

---

## 🗂️ Architecture du Projet — Monorepo

Le projet est organisé en **monorepo** avec la structure suivante :

```
rush/
├── apps/
│   ├── web/          → Application web Next.js (interface utilisateur + API)
│   └── cli/          → Outil en ligne de commande (npm package publié)
├── packages/
│   └── crypto/       → Module de chiffrement partagé (AES-256-GCM)
├── supabase/
│   └── migrations/   → Schéma de base de données PostgreSQL
├── turbo.json        → Configuration Turborepo
└── pnpm-workspace.yaml
```

---

## ⚙️ Technologies & Frameworks

### 🏗️ Gestionnaire de monorepo
| Outil | Version | Rôle |
|-------|---------|------|
| **Turborepo** | ^2.0.0 | Orchestration des builds et tâches entre les packages |
| **pnpm** | 9.4.0 | Gestionnaire de paquets (workspaces) |

---

### 🌐 Application Web (`apps/web`)

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Next.js** | 16.2.10 (Turbopack) | Framework React fullstack (pages + API routes) |
| **React** | 18+ | Bibliothèque UI |
| **TypeScript** | ^5.5 | Langage principal (typage statique) |
| **Tailwind CSS** | latest | Framework CSS utilitaire |
| **Supabase JS** | latest | Client SDK pour l'authentification et la base de données |
| **@supabase/ssr** | latest | Intégration Supabase côté serveur (cookies, middleware) |
| **Lucide React** | latest | Bibliothèque d'icônes |
| **React Hot Toast** | latest | Notifications UI |
| **Recharts** | ^3.10.0 | Graphiques pour le dashboard super admin |
| **Archiver** | latest | Création d'archives ZIP côté serveur |

---

### 💻 CLI (`apps/cli`)

| Technologie | Version | Rôle |
|-------------|---------|------|
| **TypeScript** | ^5.5 | Langage principal |
| **esbuild** | ^0.21 | Bundler ultra-rapide (compile le CLI en un seul fichier JS) |
| **Commander** | ^12.1 | Parsing des arguments de la ligne de commande |
| **Chalk** | ^5.3 | Coloration du terminal |
| **Ora** | ^8.1 | Spinners de chargement dans le terminal |
| **Node-fetch** | ^3.3 | Requêtes HTTP depuis le CLI |
| **Archiver** | ^7.0 | Création des archives ZIP des projets |
| **Form-data** | ^4.0 | Envoi de fichiers via multipart/form-data |

---

### 🔐 Package Crypto (`packages/crypto`)

| Technologie | Rôle |
|-------------|------|
| **Node.js `crypto` (natif)** | Chiffrement AES-256-GCM, dérivation de clé PBKDF2 |
| **TypeScript** | Langage principal |

---

### 🗄️ Base de données & Backend

| Technologie | Rôle |
|-------------|------|
| **Supabase** | Backend-as-a-Service (Auth + PostgreSQL + Storage) |
| **PostgreSQL** | Base de données relationnelle |
| **Supabase Storage** | Stockage des archives ZIP (snapshots) |
| **Row Level Security (RLS)** | Isolation des données par utilisateur au niveau BDD |

---

## 📊 Schéma de la base de données

```
auth.users (Supabase Auth)
    │
    └── projects (id, user_id, name, description)
            │
            ├── versions (id, project_id, version_number, storage_path, file_size_bytes)
            │       → Chaque snapshot = 1 ligne
            │
            └── env_variables (id, project_id, key_name, encrypted_value, iv, auth_tag)
                    → Variables .env chiffrées AES-256-GCM
```

**Row Level Security** : chaque utilisateur ne peut lire/écrire que ses propres données.

---

## 🔑 Langages utilisés

| Langage | Où |
|---------|-----|
| **TypeScript** | Partout (web, CLI, crypto) |
| **TSX** | Composants React (`.tsx`) |
| **SQL (PostgreSQL)** | Migrations base de données |
| **JavaScript** | Scripts bash/bin du CLI |
| **CSS** | Styles Tailwind |

---

## 🔒 Sécurité — Chiffrement AES-256-GCM

Le module `@rushvault/crypto` implémente une stratégie **Zero-Knowledge** :

1. **Clé dérivée par projet** : `SHA-256(MASTER_KEY || project_id)` — jamais stockée en BDD.
2. **Chiffrement** : `AES-256-GCM` avec IV aléatoire de 128 bits à chaque opération.
3. **Authentification** : `Auth Tag` de 128 bits (protection contre la corruption).
4. **Seuls** `encrypted_value`, `iv` et `auth_tag` sont persistés — **inutilisables sans la MASTER_KEY**.
5. La `MASTER_KEY` est une variable d'environnement serveur (`process.env.MASTER_ENCRYPTION_KEY`).

---

## 🚀 Comment ça fonctionne — Flux Complet

### 1. Sauvegarde d'un projet (CLI)
```
Développeur → rush-save "mon message"
    → Compression du dossier en ZIP (archiver)
    → Upload sur Supabase Storage (pré-signed URL)
    → Enregistrement du snapshot en BDD (versions table)
    → Les variables .env sont chiffrées et stockées séparément
```

### 2. Coffre-fort .env (Web)
```
Utilisateur → Colle ses variables dans l'interface web
    → Chaque variable est chiffrée côté serveur (AES-256-GCM)
    → Stockée dans env_variables (jamais en clair en BDD)
    → Import en masse possible via copier-coller du fichier .env entier
```

### 3. Rollback (CLI)
```
Développeur → rush rollback v3
    → Récupère la liste des versions depuis l'API
    → Génère une URL signée (15 min) pour le ZIP
    → Télécharge le ZIP + déchiffre le .env → fichier .env.v3 local
```

### 4. Authentification Web (Supabase Auth)
```
Utilisateur → Login avec email/password
    → Supabase JWT géré côté serveur via cookies HttpOnly
    → Middleware Next.js vérifie le token à chaque requête protégée
```

### 5. Super Admin (`/adminmokolosite`)
```
Admin → Mot de passe maître → OTP Supabase par email
    → Cookie HttpOnly `rushvault_admin_token` (24h)
    → Layout serveur vérifie le cookie à chaque requête
    → AdminGuard côté client vérifie au montage + visibilitychange
    → Déconnexion : suppression du cookie + revalidation du cache Next.js
```

---

## 📡 API Routes (Next.js App Router)

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/projects` | GET, POST | Lister / créer des projets |
| `/api/projects/[id]` | GET, DELETE | Détail / supprimer un projet |
| `/api/projects/[id]/env` | GET, POST, DELETE | Gérer les variables .env chiffrées |
| `/api/projects/[id]/versions` | GET | Lister les versions d'un projet |
| `/api/projects/[id]/snapshot` | POST | Recevoir un snapshot ZIP |
| `/api/projects/[id]/snapshot-register` | POST | Enregistrer un snapshot en BDD |
| `/api/projects/[id]/upload-url` | GET | Génère une URL signée Supabase pour l'upload |
| `/api/projects/[id]/rollback/[versionId]` | GET | Télécharger + déchiffrer une version |
| `/api/auth/callback` | GET | Callback OAuth Supabase |
| `/api/auth/cli-token` | POST | Échange token pour le CLI |
| `/api/auth/signout` | POST | Déconnexion Supabase |
| `/api/admin/check-auth` | GET | Vérification session admin (client-side) |
| `/api/activity` | GET | Logs d'activité |
| `/api/analytics/track` | POST | Tracking analytique |

---

## 🛠️ Commandes CLI disponibles

```bash
rushvault login          # Se connecter avec son compte
rush-save "message"      # Sauvegarder le projet en cours
rush rollback v3         # Restaurer la version 3
rush versions            # Lister toutes les versions
```

---

## 📦 Déploiement

- **Web** : Vercel (Next.js) — configuration dans `vercel.json`
- **CLI** : Publié sur npm (`@rushvault/cli`)
- **Base de données** : Supabase cloud (PostgreSQL managé)
- **Stockage** : Supabase Storage (S3-compatible)
