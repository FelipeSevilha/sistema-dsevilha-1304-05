'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Produto } from '@/lib/supabase';
import { Plus, Search, Package } from 'lucide-react';
import ProdutoForm from '@/components/produtos/ProdutoForm';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ProdutosPage() {
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  const [lista, setLista] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);

  const fetchProdutos = useCallback(async () => {
    const { data } = await supabase.from('produtos').select('*').order('nome');
    if (data) setLista(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProdutos();

    const channel = supabase
      .channel('produtos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => {
        fetchProdutos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProdutos]);

  const categorias = ['Todas', ...Array.from(new Set(lista.map(p => p.categoria)))];

  const filtered = lista.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategoria === 'Todas' || p.categoria === filterCategoria;
    return matchSearch && matchCat;
  });

  const avgMargem = lista.length > 0 ? (lista.reduce((s, p) => s + p.margem, 0) / lista.length).toFixed(1) : '0';

  const handleSave = async (data: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => {
    if (editando) {
      await supabase.from('produtos').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editando.id);
    } else {
      await supabase.from('produtos').insert(data);
    }
    setFormOpen(false);
    setEditando(null);
  };

  const handleEdit = (p: Produto) => {
    setEditando(p);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total de Produtos</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{lista.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Ativos</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{lista.filter(p => p.ativo).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Categorias</p>
          <p className="text-3xl font-bold text-sky-600 mt-1">{categorias.length - 1}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Margem Média</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{avgMargem}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
              />
            </div>
            <select
              value={filterCategoria}
              onChange={e => setFilterCategoria(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-slate-600"
            >
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setEditando(null); setFormOpen(true); }}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Produto', 'Categoria', 'Custo Unit.', 'Preço Unit.', 'Margem', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-sky-500" />
                      </div>
                      <div>
                        <span className="text-slate-800 font-medium block">{p.nome}</span>
                        {p.descricao && <span className="text-xs text-slate-400">{p.descricao.slice(0, 50)}{p.descricao.length > 50 ? '...' : ''}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{p.categoria}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{fmt(p.custo)}</td>
                  <td className="px-5 py-3 text-slate-800 font-semibold">{fmt(p.preco)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-16">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(p.margem, 100)}%` }} />
                      </div>
                      <span className="text-emerald-600 font-semibold text-xs">{p.margem}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleEdit(p)} className="text-xs text-sky-600 hover:text-sky-700 font-medium">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProdutoForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null); }}
        onSave={handleSave}
        produto={editando ? {
          id: editando.id,
          nome: editando.nome,
          categoria: editando.categoria,
          descricao: editando.descricao,
          custo: editando.custo,
          preco: editando.preco,
          margem: editando.margem,
          unidade: editando.unidade,
          ativo: editando.ativo,
        } : null}
      />
    </div>
  );
}
