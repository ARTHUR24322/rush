import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Middleware Next.js — Rafraîchit la session Supabase à chaque requête.
 * Redirige les utilisateurs non authentifiés vers la page de connexion.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Rafraîchit le token de session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes protégées — redirection si non authentifié
  const protectedPaths = ['/dashboard', '/projects'];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // ─── ADMIN ROUTE PROTECTION ───
  if (request.nextUrl.pathname.startsWith('/adminmokolosite')) {
    // Empêche l'indexation par les moteurs de recherche
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
    
    // Si ce n'est pas la page de login, on vérifie la présence du token
    if (!request.nextUrl.pathname.startsWith('/adminmokolosite/login')) {
      const adminToken = request.cookies.get('rushvault_admin_token');
      if (!adminToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/adminmokolosite/login';
        return NextResponse.redirect(url);
      }
    }
  }

  // ─── ANALYTICS TRACKING ───
  if (request.nextUrl.pathname === '/') {
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'Unknown';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const origin = request.nextUrl.origin;
    fetch(`${origin}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip, country, userAgent, path: request.nextUrl.pathname }),
    }).catch(console.error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
