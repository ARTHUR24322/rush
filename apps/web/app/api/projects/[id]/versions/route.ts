import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/projects/[id]/versions — Historique des versions d'un projet
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérification propriété
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: versions, error } = await supabase
      .from('versions')
      .select('id, version_number, message, file_size_bytes, created_at')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ project, versions });

  } catch (err) {
    console.error('[GET /api/projects/:id/versions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
