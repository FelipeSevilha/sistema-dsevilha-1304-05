'use client';

import Link from 'next/link';
import { useApp } from '@/lib/app-context';

export default function Sidebar() {
  const { user } = useApp();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const menu = [
    { name: 'Dashboard', href: '/dashboard', admin: true },
    { name: 'Financeiro', href: '/financeiro', admin: true },
    { name: 'Comissões', href: '/comissoes', admin: true },
    { name: 'Metas', href: '/metas', admin: true },
    { name: 'Estoque', href: '/estoque', admin: true },
    { name: 'Painel Estratégico', href: '/painel', admin: true },
    { name: 'Usuários', href: '/usuarios', admin: true },

    { name: 'Produtos', href: '/produtos', admin: false },
    { name: 'Orçamentos', href: '/orcamentos', admin: false },
    { name: 'Pedidos', href: '/pedidos', admin: false },
    { name: 'Clientes', href: '/clientes', admin: false },
  ];

  const filteredMenu = menu.filter((item) =>
    isAdmin ? true : !item.admin
  );

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-6">Gráfica D'Sevilha</h1>

      <nav className="flex flex-col gap-2">
        {filteredMenu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto text-sm opacity-70">
        {user.nome} ({user.role})
      </div>
    </aside>
  );
}
