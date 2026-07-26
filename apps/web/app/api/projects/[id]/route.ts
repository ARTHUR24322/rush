import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';

export async function DELETE(
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

    // Delete project (cascade should handle related records if DB is configured, or we can manually delete them, but usually DB cascade does it. Assuming RLS and cascade on projects handles it, or we just rely on Supabase returning success).
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[DELETE /api/projects/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
