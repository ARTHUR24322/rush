# RushVault — Le Disque Dur des Développeurs

> **Snapshots de code en 1 clic · Coffre-fort .env chiffré AES-256-GCM**

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Un projet Supabase (gratuit sur [supabase.com](https://supabase.com))

### 1. Installation

```bash
# Cloner le repo
git clone https://github.com/youruser/rushvault
cd rushvault

# Installer les dépendances
cd packages/crypto && npm install && npm run build && cd ../..
cd apps/web && npm install && cd ../..
cd apps/cli && npm install && npm run build && cd ../..
```

### 2. Configuration Supabase

```bash
# Copier les variables d'environnement
cp apps/web/.env.example apps/web/.env.local
```

Remplir `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MASTER_ENCRYPTION_KEY=<64-chars-hex>   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Migrations BDD

Dans le dashboard Supabase → SQL Editor :
```sql
-- Coller le contenu de supabase/migrations/001_initial.sql
```

Créer le bucket Supabase Storage :
- Nom : `rushvault-snapshots`
- Accès : **Privé**

### 4. Lancer l'app

```bash
cd apps/web
npm run dev       # → http://localhost:3000
```

### 5. Installer le CLI

```bash
cd apps/cli
npm run build
npm install -g @rushvault/cli # installe "rushvault" et "rush-save" globalement

rushvault login        # Connexion OAuth (GitHub / Google)
```

---

## 📦 Structure du Projet

```
rushvault/
├── apps/
│   ├── web/          # Next.js 14 App Router (UI + API Routes serverless)
│   └── cli/          # CLI Node.js — rushvault / rush-save
├── packages/
│   └── crypto/       # Module AES-256-GCM partagé (zero dépendance externe)
└── supabase/
    └── migrations/   # Schéma PostgreSQL
```

---

## 💻 Utilisation du CLI

### Initialiser un projet
Pour lier un projet distant à votre dossier local, utilisez la commande `init`. 
Cela créera un fichier `rushvault.json` à la racine de votre dossier contenant la configuration, ce qui permet au CLI de savoir à quel projet distant ce dossier correspond.

```bash
rushvault init <project-id>
```

### Autres commandes courantes

```bash
# Sauvegarder (snapshot)
rush-save "Ajout authentification JWT"
# ou
rushvault save "Ajout authentification JWT"

# Voir l'historique
rushvault versions

# Rollback vers une version
rushvault rollback v3

# Compte
rushvault whoami
rushvault logout
```

---

## 🔐 Sécurité & Chiffrement

### AES-256-GCM
- Chaque valeur `.env` est chiffrée individuellement avec `AES-256-GCM`
- Un **IV aléatoire de 16 bytes** est généré pour chaque chiffrement
- Le **GCM Auth Tag** protège contre toute altération des données

### Dérivation de clé (côté serveur)
```
MASTER_ENCRYPTION_KEY (variable d'env serveur)
          │
          ▼ SHA-256(masterKey ‖ project_id)   [HKDF simplifié]
     Clé AES-256 unique par projet
          │
          ├── Chiffrement des valeurs .env
          └── Stockée NULLE PART — recalculée à chaque requête
```

### Zero-Knowledge
- La valeur en clair **ne passe jamais** dans la BDD
- Seuls `encrypted_value`, `iv`, `auth_tag` sont persistés
- Sans `MASTER_ENCRYPTION_KEY`, les données sont illisibles

---

## 🛣️ API Reference

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/projects` | Lister les projets |
| `POST` | `/api/projects` | Créer un projet |
| `POST` | `/api/projects/:id/snapshot` | Upload ZIP + .env chiffré |
| `GET` | `/api/projects/:id/versions` | Historique des versions |
| `GET` | `/api/projects/:id/rollback/:versionId` | URL signée 15min + .env déchiffré |
| `GET` | `/api/projects/:id/env` | Lister les clés .env (masquées) |
| `POST` | `/api/projects/:id/env` | Ajouter/modifier une variable |
| `DELETE` | `/api/projects/:id/env?keyName=X` | Supprimer une variable |

---

## 🏗️ Architecture

```
CLI                    API (Next.js Route Handlers)         Supabase
 │                              │                         ┌──────────┐
 │  POST /snapshot (multipart)  │                         │PostgreSQL│
 │─────────────────────────────▶│ 1. Auth JWT             │  + RLS   │
 │                              │ 2. next_version_number()│          │
 │                              │ 3. Upload ZIP ──────────│─▶Storage │
 │                              │ 4. Encrypt .env (AES)   │          │
 │                              │ 5. INSERT versions ─────│─▶ DB     │
 │◀─────────────────────────────│ 6. Return { v: 7 }      └──────────┘
 │  "✅ Snapshot v7 sauvegardé"  │
```
