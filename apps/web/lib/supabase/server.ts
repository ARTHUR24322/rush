import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase pour les Server Components et Route Handlers.
 * Lit et écrit les cookies de session via next/headers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll peut être appelé depuis un Server Component — ignoré en lecture seule
          }
        },
      },
    },
  );
}

/**
 * Client Supabase Admin (service role) — pour les opérations serveur sans RLS.
 * Ne JAMAIS exposer côté client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Récupère l'utilisateur connecté via les cookies, ou via le header Authorization si fourni (utile pour le CLI).
 */
export async function getAuthenticatedUser(request?: Request) {
  const supabase = await createClient();
  
  if (request) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (token) {
      return supabase.auth.getUser(token);
    }
  }
  
  return supabase.auth.getUser();
}
