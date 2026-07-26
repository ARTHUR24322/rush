import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/admin/check-auth
 * Vérification légère de la session admin — utilisée par le client
 * pour détecter une déconnexion après navigation arrière (bfcache).
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('rushvault_admin_token');

  if (!token || token.value !== 'true') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
