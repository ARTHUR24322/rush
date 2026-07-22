import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer les ID des projets de l'utilisateur
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ activity: [] });
    }

    const projectIds = projects.map(p => p.id);

    // Récupérer toutes les versions (snapshots) créées pour ces projets
    const { data: versions, error } = await supabase
      .from('versions')
      .select('created_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ activity: versions || [] });
  } catch (err) {
    console.error('[GET /api/activity]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
