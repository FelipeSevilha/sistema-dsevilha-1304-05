'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/financeiro': 'Financeiro',
  '/orcamentos': 'Orçamentos',
  '/produtos': 'Produtos',
  '/pedidos': 'Pedidos',
  '/clientes': 'Clientes',
  '/comissoes': 'Comissões',
  '/metas': 'Metas',
  '/estoque': 'Estoque',
  '/painel-estrategico': 'Painel Estratégico',
};

const today = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function Header() {
  const pathname = usePathname();
  const label = pageLabels[pathname] ?? 'ERP';
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-slate-800">{label}</h1>
        <p className="text-xs text-slate-400 capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-2">
        {showSearch && (
          <input
            autoFocus
            onBlur={() => setShowSearch(false)}
            placeholder="Buscar..."
            className="h-8 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48 transition-all"
          />
        )}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="relative">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold" title={user?.name ?? ''}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
