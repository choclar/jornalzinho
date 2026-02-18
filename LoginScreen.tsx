
import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Conta criada! Verifique seu e-mail ou faça login.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocorreu um erro na autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFD700] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Estética CHOC-LAR */}
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-white">
        <div className="p-10">
          <div className="text-center mb-10">
             <div className="inline-block p-4 rounded-full bg-blue-50 mb-4">
               <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
             </div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
               CHOC-LAR <span className="text-blue-500">PORTAL</span>
             </h1>
             <p className="text-gray-400 text-xs font-bold tracking-widest mt-2 uppercase">
               Sistema de Design Profissional
             </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-bold uppercase text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-sm"
                placeholder="E-mail"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-pink-500 transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-pink-500 outline-none transition-all font-bold text-sm"
                placeholder="Senha"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : (isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />)}
              {isSignUp ? "Criar Minha Conta" : "Acessar Sistema"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              {isSignUp ? "Já tenho conta? Entrar" : "Novo por aqui? Cadastre-se"}
            </button>
          </div>
        </div>
        <div className="h-4 bg-gradient-to-r from-blue-500 via-pink-500 to-green-500"></div>
      </div>
    </div>
  );
};

export default LoginScreen;
