-- ============================================================
-- RushVault — Schéma PostgreSQL Initial
-- Migration: 001_initial.sql
-- ============================================================

-- Extension pour UUID v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur user_id pour accélérer les requêtes par utilisateur
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Trigger pour auto-update de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: versions
-- Chaque snapshot sauvegardé par "rush-save"
-- ============================================================
CREATE TABLE IF NOT EXISTS versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number  INTEGER     NOT NULL,           -- Auto-incrémenté : 1, 2, 3...
  message         TEXT,                           -- "Mon message de sauvegarde"
  storage_path    TEXT        NOT NULL,           -- "projects/{project_id}/v3.zip"
  file_size_bytes BIGINT      DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un seul numéro de version par projet
  UNIQUE(project_id, version_number)
);

CREATE INDEX idx_versions_project_id ON versions(project_id);

-- ============================================================
-- TABLE: env_variables
-- Variables .env chiffrées avec AES-256-GCM
-- ============================================================
CREATE TABLE IF NOT EXISTS env_variables (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_id      UUID        REFERENCES versions(id) ON DELETE SET NULL,
  key_name        TEXT        NOT NULL,
  -- Valeur chiffrée AES-256-GCM, stockée en base64
  encrypted_value TEXT        NOT NULL,
  iv              TEXT        NOT NULL,   -- Initialization Vector (base64, 16 bytes)
  auth_tag        TEXT        NOT NULL,   -- GCM Authentication Tag (base64, 16 bytes)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Une seule entrée par clé par projet (upsert sur (project_id, key_name))
  UNIQUE(project_id, key_name)
);

CREATE INDEX idx_env_variables_project_id ON env_variables(project_id);

CREATE TRIGGER env_variables_updated_at
  BEFORE UPDATE ON env_variables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne voit que ses propres données
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE env_variables ENABLE ROW LEVEL SECURITY;

-- Policies pour projects
CREATE POLICY "projects: users manage their own"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour versions (via project owner)
CREATE POLICY "versions: owner via project"
  ON versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = versions.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Policies pour env_variables (via project owner)
CREATE POLICY "env_variables: owner via project"
  ON env_variables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = env_variables.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER FUNCTION: next_version_number
-- Calcule automatiquement le prochain numéro de version
-- ============================================================
CREATE OR REPLACE FUNCTION next_version_number(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0)
  INTO max_version
  FROM versions
  WHERE project_id = p_project_id;
  
  RETURN max_version + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
