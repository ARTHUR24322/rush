'use client';

import { useState } from 'react';
import { Shield, Mail, Key } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { verifyMasterPassword, setAdminSession } from '../actions';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const adminEmail = 'arthuradmindev@gmail.com';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Validate master password on server
    const result = await verifyMasterPassword(password);
    
    if (result.success) {
      // 2. Trigger Supabase OTP to the admin email
      const { error } = await supabase.auth.signInWithOtp({
        email: adminEmail,
      });
      
      if (error) {
        toast.error("Erreur lors de l'envoi du code OTP : " + error.message);
      } else {
        toast.success(`Code envoyé à ${adminEmail}`);
        setStep(2);
      }
    } else {
      toast.error(result.error || "Une erreur est survenue");
    }
    
    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 3. Verify the 6-digit OTP
    const { error } = await supabase.auth.verifyOtp({
      email: adminEmail,
      token: otp,
      type: 'email',
    });
    
    if (error) {
      toast.error("Code incorrect ou expiré.");
      setLoading(false);
    } else {
      // 4. Set secure cookie and redirect
      toast.success("Authentification réussie !");
      await setAdminSession();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
        
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">Accès Restreint</h1>
        <p className="text-zinc-400 text-center text-sm mb-8">
          Espace d'administration super utilisateur.
        </p>

        {step === 1 ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
                Mot de passe maître
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="w-4 h-4 text-zinc-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? "Vérification..." : "Continuer"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500" />
                Un code de sécurité a été envoyé à <br/><span className="font-mono text-white">a************v@gmail.com</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">
                Code de vérification (OTP)
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.2em] font-mono text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder="000000"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? "Validation..." : "Accéder au Dashboard"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
