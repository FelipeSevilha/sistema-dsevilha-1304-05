'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Wallet, FileText, Package, ShoppingCart, Users, Award, Target, Boxes, ChartBar as BarChart3, ChevronLeft, ChevronRight, Printer, LogOut, UserCog, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet, adminOnly: true },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText, adminOnly: false },
  { href: '/produtos', label: 'Produtos', icon: Package, adminOnly: false },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart, adminOnly: false },
  { href: '/clientes', label: 'Clientes', icon: Users, adminOnly: false },
  { href: '/comissoes', label: 'Comissões', icon: Award, adminOnly: true },
  { href: '/metas', label: 'Metas', icon: Target, adminOnly: true },
  { href: '/estoque', label: 'Estoque', icon: Boxes, adminOnly: true },
  { href: '/painel-estrategico', label: 'Painel Estratégico', icon: BarChart3, adminOnly: true },
  { href: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'admin';
  const navItems = ALL_NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const roleLabel = isAdmin ? 'Administrador' : 'Vendedor';

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-slate-900 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-700/50', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center">
          <Printer className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">Gráfica</p>
            <p className="text-sky-400 font-bold text-sm leading-tight">D'Sevilha ERP</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-slate-700 hover:bg-sky-500 rounded-full flex items-center justify-center text-white transition-colors z-10 shadow-lg border border-slate-600"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('flex-shrink-0 w-5 h-5', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn('border-t border-slate-700/50 p-3', collapsed && 'flex flex-col items-center gap-2')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <div className="flex items-center gap-1">
                {isAdmin ? <ShieldCheck className="w-3 h-3 text-sky-400" /> : null}
                <p className="text-slate-400 text-xs truncate">{roleLabel}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800" title="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
