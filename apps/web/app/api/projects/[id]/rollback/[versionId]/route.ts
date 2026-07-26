import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { deriveServerKey, decryptEnvFile } from '@rushvault/crypto';

/**
 * GET /api/projects/[id]/rollback/[versionId]
 *
 * Génère un lien de téléchargement sécurisé (URL signée 15 min)
 * et retourne les variables .env déchiffrées.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const { id: projectId, versionId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Récupération de la version (avec vérification propriété) ──────────────
    const { data: version, error: versionError } = await supabase
      .from('versions')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', versionId)
      .eq('project_id', projectId)
      .eq('projects.user_id', user.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // ── Génération URL signée (15 minutes) ────────────────────────────────────
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from('rushvault-snapshots')
      .createSignedUrl(version.storage_path, 15 * 60); // 900 secondes

    if (signedUrlError || !signedUrlData) {
      throw signedUrlError ?? new Error('Failed to generate signed URL');
    }

    // ── Déchiffrement des variables .env ──────────────────────────────────────
    const { data: encryptedVars } = await supabase
      .from('env_variables')
      .select('key_name, encrypted_value, iv, auth_tag')
      .eq('project_id', projectId)
      .eq('version_id', versionId);

    let envContent: string | null = null;

    if (encryptedVars && encryptedVars.length > 0) {
      const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
      const encryptionKey = deriveServerKey(masterKey, projectId);

      const payloads = encryptedVars.map(
        ({ key_name, encrypted_value, iv, auth_tag }) => ({
          keyName: key_name as string,
          encryptedValue: encrypted_value as string,
          iv: iv as string,
          authTag: auth_tag as string,
        }),
      );

      envContent = decryptEnvFile(payloads, encryptionKey);
    }

    return NextResponse.json({
      version: {
        id: version.id,
        number: version.version_number,
        message: version.message,
        fileSizeBytes: version.file_size_bytes,
        createdAt: version.created_at,
      },
      downloadUrl: signedUrlData.signedUrl,
      expiresInSeconds: 900,
      envContent, // null si aucune variable .env
    });

  } catch (err) {
    console.error('[GET /api/projects/:id/rollback/:versionId]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
