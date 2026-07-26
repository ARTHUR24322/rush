import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Limite la longueur d'une chaîne pour éviter la pollution de la DB
function sanitize(value: unknown, maxLen = 256): string {
  if (typeof value !== 'string') return 'Unknown';
  return value.trim().slice(0, maxLen) || 'Unknown';
}

// Valide que le path ressemble bien à un chemin URL (protection SSRF/injection)
function sanitizePath(value: unknown): string {
  const path = sanitize(value, 512);
  // Accepte uniquement les chemins commençant par /
  return /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/.test(path) ? path : '/';
}

export async function POST(req: NextRequest) {
  try {
    // Bloque les appels externes (CSRF/SSRF) — seule l'origine interne est autorisée
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { ip, country, userAgent, path } = body;

    const supabase = createAdminClient();

    await supabase.from('visits').insert([
      {
        ip: sanitize(ip, 64),
        country: sanitize(country, 8),
        path: sanitizePath(path),
        user_agent: sanitize(userAgent, 512),
      }
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Analytics] Error tracking visit:', err);
    return NextResponse.json({ success: false });
  }
}
