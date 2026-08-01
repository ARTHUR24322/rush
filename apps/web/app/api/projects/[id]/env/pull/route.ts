import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { deriveServerKey, decryptEnvFile } from '@rushvault/crypto';

/**
 * GET /api/projects/[id]/env/pull
 *
 * Retourne le contenu complet du fichier .env déchiffré.
 */
export async function GET(
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

    // ── Déchiffrement des variables .env ──────────────────────────────────────
    const { data: encryptedVars } = await supabase
      .from('env_variables')
      .select('key_name, encrypted_value, iv, auth_tag')
      .eq('project_id', projectId);

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

    return NextResponse.json({ envContent });

  } catch (err) {
    console.error('[GET /api/projects/:id/env/pull]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
