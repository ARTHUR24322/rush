import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { deriveServerKey, encryptEnvFile } from '@rushvault/crypto';

/**
 * POST /api/projects/[id]/snapshot-register
 *
 * Enregistre une version après que le CLI a uploadé directement vers Supabase Storage.
 * Reçoit : { storagePath, nextVersion, message, envContent, fileSizeBytes }
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

    // ── Vérification propriété du projet ─────────────────────────────────────
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json() as {
      storagePath: string;
      nextVersion: number;
      message?: string;
      envContent?: string;
      fileSizeBytes: number;
    };

    const { storagePath, nextVersion, message = 'Snapshot', envContent, fileSizeBytes } = body;

    if (!storagePath || !nextVersion || !fileSizeBytes) {
      return NextResponse.json({ error: 'storagePath, nextVersion and fileSizeBytes are required' }, { status: 400 });
    }

    // ── Vérifie que le fichier existe bien dans le storage ────────────────────
    const { data: fileData, error: fileError } = await supabase.storage
      .from('rushvault-snapshots')
      .list(`projects/${projectId}`, {
        search: `v${nextVersion}.zip`,
      });

    if (fileError || !fileData?.length) {
      return NextResponse.json({ error: 'Archive not found in storage. Upload it first.' }, { status: 400 });
    }

    // ── Insertion de la version en BDD ────────────────────────────────────────
    const { data: version, error: insertVersionError } = await supabase
      .from('versions')
      .insert({
        project_id: projectId,
        version_number: nextVersion,
        message,
        storage_path: storagePath,
        file_size_bytes: fileSizeBytes,
      })
      .select()
      .single();

    if (insertVersionError) throw insertVersionError;

    // ── Chiffrement et stockage des variables .env ────────────────────────────
    if (envContent && envContent.trim()) {
      const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
      const encryptionKey = deriveServerKey(masterKey, projectId);
      const encryptedVars = encryptEnvFile(envContent, encryptionKey);

      if (encryptedVars.length > 0) {
        const envRows = encryptedVars.map(({ keyName, encryptedValue, iv, authTag }) => ({
          project_id: projectId,
          version_id: version.id,
          key_name: keyName,
          encrypted_value: encryptedValue,
          iv,
          auth_tag: authTag,
        }));

        const { error: envError } = await supabase
          .from('env_variables')
          .upsert(envRows, { onConflict: 'project_id,key_name' });

        if (envError) throw envError;
      }
    }

    // ── Mise à jour de updated_at ─────────────────────────────────────────────
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId);

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        number: nextVersion,
        message,
        storagePath,
        fileSizeBytes,
        createdAt: version.created_at,
      },
    }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/projects/:id/snapshot-register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
