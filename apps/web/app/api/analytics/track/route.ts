import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip, country, userAgent, path } = body;

    const supabase = await createAdminClient();

    // Insertion de la visite (ignorer les erreurs pour ne pas crasher)
    // Assurez-vous d'avoir créé la table `visits` dans Supabase !
    await supabase.from('visits').insert([
      {
        ip: ip || 'Unknown',
        country: country || 'Unknown',
        path: path || '/',
        user_agent: userAgent || 'Unknown',
      }
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Analytics] Error tracking visit:', err);
    // Return 200 anyway so we don't spam errors on the client
    return NextResponse.json({ success: false });
  }
}
