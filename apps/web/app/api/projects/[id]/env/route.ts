import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { deriveServerKey, encrypt, decrypt } from '@rushvault/crypto';

/**
 * GET  /api/projects/[id]/env  — Liste les clés .env (valeurs MASQUÉES)
 * POST /api/projects/[id]/env  — Ajoute ou met à jour une variable .env
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

    // Vérification propriété
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Retourne les clés SANS les valeurs déchiffrées
    const { data: vars, error } = await supabase
      .from('env_variables')
      .select('id, key_name, updated_at')
      .eq('project_id', projectId)
      .order('key_name');

    if (error) throw error;

    return NextResponse.json({ variables: vars });

  } catch (err) {
    console.error('[GET /api/projects/:id/env]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérification propriété
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json() as { keyName?: string; value?: string };
    const { keyName, value } = body;

    if (!keyName?.trim() || value === undefined) {
      return NextResponse.json(
        { error: 'keyName and value are required' },
        { status: 400 },
      );
    }

    // Chiffrement avec clé dérivée du projet
    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    const encryptionKey = deriveServerKey(masterKey, projectId);
    const encrypted = encrypt(value, encryptionKey);

    const { data: envVar, error } = await supabase
      .from('env_variables')
      .upsert({
        project_id: projectId,
        key_name: keyName.trim().toUpperCase(),
        encrypted_value: encrypted.encryptedValue,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
      }, { onConflict: 'project_id,key_name' })
      .select('id, key_name, updated_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ variable: envVar }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/projects/:id/env]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/env?keyName=MY_KEY
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const keyName = searchParams.get('keyName');

    if (!keyName) {
      return NextResponse.json({ error: 'keyName query param required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: { user }, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérification propriété
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('env_variables')
      .delete()
      .eq('project_id', projectId)
      .eq('key_name', keyName);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[DELETE /api/projects/:id/env]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
