import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { deriveServerKey, encryptEnvFile } from '@rushvault/crypto';

/**
 * POST /api/projects/[id]/snapshot
 *
 * Reçoit une archive ZIP + variables .env en multipart/form-data.
 * 1. Vérifie l'authentification et la propriété du projet
 * 2. Calcule le prochain numéro de version
 * 3. Upload du ZIP vers Supabase Storage
 * 4. Chiffre les variables .env avec AES-256-GCM
 * 5. Insère la version en BDD + variables chiffrées
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

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

    // ── Parse multipart/form-data ─────────────────────────────────────────────
    const formData = await request.formData();
    const archiveFile = formData.get('archive') as File | null;
    const envContent = formData.get('env') as string | null;
    const message = (formData.get('message') as string | null) ?? 'Snapshot';

    if (!archiveFile) {
      return NextResponse.json({ error: 'archive file is required' }, { status: 400 });
    }

    // ── Calcul du prochain numéro de version ──────────────────────────────────
    const { data: versionData, error: versionError } = await supabase
      .rpc('next_version_number', { p_project_id: projectId });

    if (versionError) throw versionError;
    const nextVersion: number = versionData ?? 1;

    // ── Upload ZIP vers Supabase Storage ──────────────────────────────────────
    const storagePath = `projects/${projectId}/v${nextVersion}.zip`;
    const archiveBuffer = await archiveFile.arrayBuffer();

    const { error: uploadError } = await adminClient.storage
      .from('rushvault-snapshots')
      .upload(storagePath, archiveBuffer, {
        contentType: 'application/zip',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // ── Insertion de la version en BDD ────────────────────────────────────────
    const { data: version, error: insertVersionError } = await supabase
      .from('versions')
      .insert({
        project_id: projectId,
        version_number: nextVersion,
        message,
        storage_path: storagePath,
        file_size_bytes: archiveBuffer.byteLength,
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

        // Upsert : met à jour si la clé existe déjà
        const { error: envError } = await supabase
          .from('env_variables')
          .upsert(envRows, { onConflict: 'project_id,key_name' });

        if (envError) throw envError;
      }
    }

    // ── Mise à jour de updated_at sur le projet ───────────────────────────────
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
        fileSizeBytes: archiveBuffer.byteLength,
        createdAt: version.created_at,
      },
    }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/projects/:id/snapshot]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
