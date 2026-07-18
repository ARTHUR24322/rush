import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/cli-token
 *
 * Endpoint pour le flux OAuth CLI.
 * Le CLI ouvre un navigateur → l'utilisateur se connecte → Supabase redirige ici.
 * Cette route redirige vers localhost:{port}/callback?token=... pour que le CLI
 * capture le token via un serveur HTTP local temporaire.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callbackPort = searchParams.get('port') ?? '9876';
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    const redirectUrl = `http://localhost:${callbackPort}/callback?error=auth_failed`;
    return NextResponse.redirect(redirectUrl);
  }

  // Transmet le token d'accès et le refresh token au CLI
  const params = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: String(data.session.expires_at ?? 0),
    user_id: data.user?.id ?? '',
    email: data.user?.email ?? '',
  });

  return NextResponse.redirect(
    `http://localhost:${callbackPort}/callback?${params.toString()}`,
  );
}
