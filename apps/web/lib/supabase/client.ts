import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase pour les composants React côté client (Client Components).
 * Gère automatiquement les cookies de session.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
