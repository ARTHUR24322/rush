import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';

/**
 * GET /api/projects/[id]/upload-url
 *
 * Génère une URL signée Supabase Storage pour que le CLI puisse uploader
 * directement sans passer par Vercel (qui limite les requêtes à 4.5 MB).
 *
 * Retourne : { signedUrl, token, storagePath, nextVersion }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = createAdminClient();

    const { data: { user }, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérification propriété du projet
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calcul du prochain numéro de version
    const { data: nextVersion, error: versionError } = await supabase
      .rpc('next_version_number', { p_project_id: projectId });

    if (versionError) throw versionError;
    const version: number = nextVersion ?? 1;

    // Génération de l'URL signée pour l'upload direct
    const storagePath = `projects/${projectId}/v${version}.zip`;
    const { data: signedData, error: signedError } = await supabase.storage
      .from('rushvault-snapshots')
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (signedError) throw signedError;

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      storagePath,
      nextVersion: version,
    });

  } catch (err) {
    console.error('[GET /api/projects/:id/upload-url]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
