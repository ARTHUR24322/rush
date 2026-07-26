import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protection des pages admin (hors page login)
  if (
    pathname.startsWith('/adminmokolosite') &&
    !pathname.startsWith('/adminmokolosite/login')
  ) {
    const adminToken = request.cookies.get('rushvault_admin_token');

    // Si pas de cookie valide → redirection vers le login
    if (!adminToken || adminToken.value !== 'true') {
      return NextResponse.redirect(new URL('/adminmokolosite/login', request.url));
    }
  }

  // Ajout des headers no-cache sur toutes les pages admin
  // Cela empêche le navigateur de montrer une version mise en cache après déconnexion
  if (pathname.startsWith('/adminmokolosite')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/adminmokolosite/:path*'],
};
