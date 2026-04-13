'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Printer, Eye, EyeOff, CircleAlert as AlertCircle, ChevronDown } from 'lucide-react';

const DEMO_USERS = [
  { label: 'Felipe Sevilha (Admin)', email: 'felipe@graficadesevilha.com.br', role: 'Acesso total' },
  { label: 'Wanessa Castro (Admin)', email: 'wanessa@graficadesevilha.com.br', role: 'Acesso total' },
  { label: 'Robson Moreno (Vendedor)', email: 'robson@graficadesevilha.com.br', role: 'Clientes, Orçamentos, Pedidos + ver Produtos' },
  { label: 'Roberta Moreno (Vendedor)', email: 'roberta@graficadesevilha.com.br', role: 'Clientes, Orçamentos, Pedidos + ver Produtos' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('felipe@graficadesevilha.com.br');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(email, password);
    if (ok) {
      router.push('/dashboard');
    } else {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-500 rounded-2xl mb-4 shadow-xl shadow-sky-500/30">
            <Printer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{"Gráfica D'Sevilha"}</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema ERP</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="seu@email.com.br"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 pr-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/30 text-sm mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              <span>Usuários de demonstração (senha: 123456)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
            </button>
            {showDemo && (
              <div className="mt-3 space-y-2">
                {DEMO_USERS.map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => { setEmail(u.email); setPassword('123456'); }}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
                  >
                    <p className="text-xs text-slate-200 font-medium">{u.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{u.role}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 Gráfica D&apos;Sevilha. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
