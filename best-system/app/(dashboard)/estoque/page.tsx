'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, EstoqueItem } from '@/lib/supabase';
import { Plus, Search, TriangleAlert as AlertTriangle, Package, TrendingDown, Pencil, Trash2, RefreshCw } from 'lucide-react';
import EstoqueItemForm from '@/components/estoque/EstoqueItemForm';

type FormEstoqueItem = {
  id: string;
  item: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  estoqueMinimo: number;
  fornecedor: string;
  valorUnit: number;
  status: string;
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusConfig: Record<string, string> = {
  Normal: 'bg-emerald-100 text-emerald-700',
  Baixo: 'bg-amber-100 text-amber-700',
  Crítico: 'bg-red-100 text-red-700',
};

function calcStatus(quantidade: number, estoqueMinimo: number): string {
  if (quantidade === 0) return 'Crítico';
  if (quantidade < estoqueMinimo * 0.5) return 'Crítico';
  if (quantidade < estoqueMinimo) return 'Baixo';
  return 'Normal';
}

function toFormItem(e: EstoqueItem): FormEstoqueItem {
  return {
    id: e.id,
    item: e.item,
    categoria: e.categoria,
    quantidade: e.quantidade,
    unidade: e.unidade,
    estoqueMinimo: e.estoque_minimo,
    fornecedor: e.fornecedor,
    valorUnit: e.valor_unitario,
    status: calcStatus(e.quantidade, e.estoque_minimo),
  };
}

export default function EstoquePage() {
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [lista, setLista] = useState<FormEstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<FormEstoqueItem | null>(null);
  const [formMode, setFormMode] = useState<'edit' | 'qty'>('edit');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchEstoque = useCallback(async () => {
    const { data } = await supabase.from('estoque').select('*').order('item');
    if (data) setLista(data.map(toFormItem));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEstoque();

    const channel = supabase
      .channel('estoque_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, () => {
        fetchEstoque();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEstoque]);

  const categorias = ['Todas', ...Array.from(new Set(lista.map(e => e.categoria)))];

  const filtered = lista.filter(e => {
    const matchSearch = e.item.toLowerCase().includes(search.toLowerCase()) || e.fornecedor.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategoria === 'Todas' || e.categoria === filterCategoria;
    const matchStatus = filterStatus === 'Todos' || e.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalCritico = lista.filter(e => e.status === 'Crítico').length;
  const totalBaixo = lista.filter(e => e.status === 'Baixo').length;
  const totalValor = lista.reduce((s, e) => s + e.quantidade * e.valorUnit, 0);

  const handleSave = async (data: Omit<FormEstoqueItem, 'id' | 'status'>) => {
    const record = {
      item: data.item,
      categoria: data.categoria,
      quantidade: data.quantidade,
      unidade: data.unidade,
      estoque_minimo: data.estoqueMinimo,
      fornecedor: data.fornecedor,
      valor_unitario: data.valorUnit,
    };

    if (editando) {
      await supabase.from('estoque').update({ ...record, updated_at: new Date().toISOString() }).eq('id', editando.id);
    } else {
      await supabase.from('estoque').insert(record);
    }
    setFormOpen(false);
    setEditando(null);
  };

  const handleEdit = (e: FormEstoqueItem) => {
    setEditando(e);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleQty = (e: FormEstoqueItem) => {
    setEditando(e);
    setFormMode('qty');
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('estoque').delete().eq('id', id);
    setDeleteConfirm(null);
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
          <p className="text-xs font-medium text-slate-500">Total de Itens</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{lista.length}</p>
        </div>
        <div className="rounded-xl border border-red-200 p-4 shadow-sm bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-medium text-red-600">Críticos</p>
          </div>
          <p className="text-3xl font-bold text-red-600 mt-1">{totalCritico}</p>
        </div>
        <div className="rounded-xl border border-amber-200 p-4 shadow-sm bg-amber-50">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-medium text-amber-600">Estoque Baixo</p>
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-1">{totalBaixo}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Valor em Estoque</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{fmt(totalValor)}</p>
        </div>
      </div>

      {(totalCritico > 0 || totalBaixo > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {totalCritico} item(ns) em nível crítico e {totalBaixo} item(ns) com estoque baixo. Solicite reposição imediatamente.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar item..."
                className="pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 w-44"
              />
            </div>
            <select
              value={filterCategoria}
              onChange={e => setFilterCategoria(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-slate-600"
            >
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-slate-600"
            >
              {['Todos', 'Normal', 'Baixo', 'Crítico'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setEditando(null); setFormMode('edit'); setFormOpen(true); }}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Item', 'Categoria', 'Qtd', 'Unid.', 'Est. Mín.', 'Fornecedor', 'Valor Unit.', 'Total', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${e.status === 'Crítico' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${e.status === 'Crítico' ? 'bg-red-100' : e.status === 'Baixo' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                        <Package className={`w-4 h-4 ${e.status === 'Crítico' ? 'text-red-500' : e.status === 'Baixo' ? 'text-amber-500' : 'text-slate-500'}`} />
                      </div>
                      <span className="text-slate-800 font-medium text-xs">{e.item}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{e.categoria}</span>
                  </td>
                  <td className={`px-5 py-3 font-bold ${e.status === 'Crítico' ? 'text-red-600' : e.status === 'Baixo' ? 'text-amber-600' : 'text-slate-800'}`}>
                    {e.quantidade.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{e.unidade}</td>
                  <td className="px-5 py-3 text-slate-500">{e.estoqueMinimo}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{e.fornecedor}</td>
                  <td className="px-5 py-3 text-slate-700">{fmt(e.valorUnit)}</td>
                  <td className="px-5 py-3 text-slate-800 font-semibold">{fmt(e.quantidade * e.valorUnit)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleQty(e)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1" title="Atualizar quantidade">
                        <RefreshCw className="w-3 h-3" />
                        Qtd
                      </button>
                      <button onClick={() => handleEdit(e)} className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button onClick={() => setDeleteConfirm(e.id)} className="text-xs text-red-400 hover:text-red-500 font-medium">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 text-sm">Nenhum item encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EstoqueItemForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null); }}
        onSave={handleSave}
        item={editando}
        mode={formMode}
      />

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Excluir item de estoque?</h3>
            <p className="text-sm text-slate-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-5 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
