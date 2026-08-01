import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { deriveServerKey, encryptEnvFile } from '@rushvault/crypto';

/**
 * POST /api/projects/[id]/env/push
 *
 * Reçoit un contenu .env (string) et effectue un upsert de chaque variable.
 * Si une clé existe déjà sur le serveur, elle est écrasée (upsert).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = createAdminClient();

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Vérification propriété ────────────────────────────────────────────────
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json() as { envContent?: string };
    const { envContent } = body;

    if (!envContent || !envContent.trim()) {
      return NextResponse.json({ error: 'envContent is required and cannot be empty' }, { status: 400 });
    }

    // ── Chiffrement et stockage des variables .env ────────────────────────────
    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    const encryptionKey = deriveServerKey(masterKey, projectId);
    const encryptedVars = encryptEnvFile(envContent, encryptionKey);

    if (encryptedVars.length > 0) {
      const envRows = encryptedVars.map(({ keyName, encryptedValue, iv, authTag }) => ({
        project_id: projectId,
        key_name: keyName,
        encrypted_value: encryptedValue,
        iv,
        auth_tag: authTag,
        // version_id is null since it's a direct push, not tied to a specific snapshot
      }));

      // L'upsert sur project_id, key_name permet d'écraser les variables existantes
      const { error: envError } = await supabase
        .from('env_variables')
        .upsert(envRows, { onConflict: 'project_id,key_name' });

      if (envError) throw envError;
    }

    // ── Mise à jour de updated_at ─────────────────────────────────────────────
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return NextResponse.json({ success: true, variablesCount: encryptedVars.length }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/projects/:id/env/push]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
