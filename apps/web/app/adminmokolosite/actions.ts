'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function verifyMasterPassword(password: string) {
  if (password === 'ArthurAdmin243@@') {
    return { success: true };
  }
  return { success: false, error: 'Mot de passe incorrect' };
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set('rushvault_admin_token', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // 'strict' = protection CSRF maximale (aucune requête cross-site)
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  redirect('/adminmokolosite');
}

export async function clearAdminSession() {
  // Supprime le cookie admin
  const cookieStore = await cookies();
  cookieStore.delete('rushvault_admin_token');

  // Déconnexion complète de Supabase (session utilisateur)
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignorer les erreurs de déconnexion Supabase
  }

  revalidatePath('/adminmokolosite', 'layout');
  redirect('/adminmokolosite/login');
}
