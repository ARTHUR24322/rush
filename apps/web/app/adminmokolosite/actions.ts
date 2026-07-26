'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
    path: '/adminmokolosite',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  redirect('/adminmokolosite');
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete('rushvault_admin_token');
  redirect('/adminmokolosite/login');
}
