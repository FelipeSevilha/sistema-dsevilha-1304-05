'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, FileText, Pencil, Trash2, Eye, ChevronDown, TriangleAlert as AlertTriangle } from 'lucide-react';
import { supabase, Pedido } from '@/lib/supabase';
import PedidoForm from '@/components/pedidos/PedidoForm';
import { gerarPedidoPDF } from '@/components/pedidos/pedidoPDF';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const ALL_STATUSES = [
  'Aguardando',
  'Em Andamento',
  'Em Produção',
  'Em Acabamento',
  'Pronto',
  'Entregue',
  'Atrasado',
  'Cancelado',
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Aguardando:    { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  'Em Andamento':{ bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  'Em Produção': { bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  'Em Acabamento':{ bg: 'bg-sky-100',    text: 'text-sky-700',     dot: 'bg-sky-400' },
  Pronto:        { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  Entregue:      { bg: 'bg-teal-100',    text: 'text-teal-700',    dot: 'bg-teal-400' },
  Atrasado:      { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400' },
  Cancelado:     { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400' },
};

const FILTER_TABS = ['Todos', 'Aguardando', 'Em Andamento', 'Em Produção', 'Em Acabamento', 'Pronto', 'Entregue', 'Atrasado', 'Cancelado'];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function isAtrasado(pedido: Pedido): boolean {
  if (!pedido.prazo) return false;
  if (['Entregue', 'Cancelado'].includes(pedido.status)) return false;
  return new Date(pedido.prazo + 'T23:59:59') < new Date();
}

export default function PedidosPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [lista, setLista] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setLista(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPedidos();
    const channel = supabase
      .channel('pedidos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchPedidos)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPedidos]);

  useEffect(() => {
    const close = () => setActionMenuId(null);
    if (actionMenuId) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [actionMenuId]);

  const filtered = lista.filter(p => {
    const matchSearch =
      p.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
      p.numero.toLowerCase().includes(search.toLowerCase()) ||
      (p.produto ?? '').toLowerCase().includes(search.toLowerCase());
    const effectiveStatus = isAtrasado(p) ? 'Atrasado' : p.status;
    const matchStatus = filterStatus === 'Todos' || effectiveStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = FILTER_TABS.slice(1).reduce((acc, s) => {
    acc[s] = lista.filter(p => {
      const eff = isAtrasado(p) ? 'Atrasado' : p.status;
      return eff === s;
    }).length;
    return acc;
  }, {} as Record<string, number>);

  const handleDelete = async (id: string) => {
    await supabase.from('pedidos').delete().eq('id', id);
    setDeleteConfirm(null);
  };

  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    await supabase.from('pedidos').update({ status: novoStatus }).eq('id', id);
  };

  const handleEdit = (p: Pedido) => {
    setEditingPedido(p);
    setFormOpen(true);
    setActionMenuId(null);
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {FILTER_TABS.slice(1).map(s => {
          const cfg = STATUS_CONFIG[s];
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'Todos' : s)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${isActive ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-200'}`}
            >
              <div className={`w-2 h-2 rounded-full mb-2 ${cfg?.dot ?? 'bg-slate-400'}`} />
              <p className="text-xs font-medium text-slate-500 leading-tight">{s}</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{counts[s] ?? 0}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar pedido..."
                className="pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
              />
            </div>
            {filterStatus !== 'Todos' && (
              <button
                onClick={() => setFilterStatus('Todos')}
                className="h-9 px-3 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg bg-white flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                {filterStatus} ×
              </button>
            )}
          </div>
          <button
            onClick={() => { setEditingPedido(null); setFormOpen(true); }}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Pedido', 'Cliente', 'Produto', 'Qtd', 'Valor', 'Orçamento', 'Status', 'Prazo', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const atrasado = isAtrasado(p);
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${atrasado ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-sky-600 font-semibold">{p.numero}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap max-w-[140px] truncate">{p.cliente_nome}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{p.produto}</td>
                    <td className="px-4 py-3 text-slate-600 text-center">{p.quantidade.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-slate-800 font-semibold whitespace-nowrap">{fmt(p.valor)}</td>
                    <td className="px-4 py-3">
                      {p.orcamento_numero ? (
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{p.orcamento_numero}</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {atrasado && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        )}
                        <div className="relative group">
                          <button
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${STATUS_CONFIG[p.status]?.bg ?? 'bg-slate-100'} ${STATUS_CONFIG[p.status]?.text ?? 'text-slate-600'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[p.status]?.dot ?? 'bg-slate-400'}`} />
                            {p.status}
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>
                          <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 hidden group-hover:block min-w-max overflow-hidden">
                            {ALL_STATUSES.map(s => (
                              <button
                                key={s}
                                onClick={() => handleUpdateStatus(p.id, s)}
                                className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 ${p.status === s ? 'font-semibold' : ''}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s]?.dot ?? 'bg-slate-300'}`} />
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.prazo ? (
                        <span className={`text-sm ${atrasado ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {new Date(p.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailPedido(p)}
                          title="Ver detalhes"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          title="Editar"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => gerarPedidoPDF(p)}
                          title="Gerar PDF"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          title="Excluir"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">Nenhum pedido encontrado.</div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400">{filtered.length} pedido(s) exibido(s)</p>
          <p className="text-xs text-slate-400">Total: {fmt(filtered.reduce((s, p) => s + p.valor, 0))}</p>
        </div>
      </div>

      {formOpen && (
        <PedidoForm
          pedido={editingPedido}
          onClose={() => { setFormOpen(false); setEditingPedido(null); }}
          onSaved={fetchPedidos}
        />
      )}

      {detailPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailPedido(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sky-600 font-bold text-lg">{detailPedido.numero}</span>
                  <StatusBadge status={isAtrasado(detailPedido) ? 'Atrasado' : detailPedido.status} />
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{detailPedido.cliente_nome}</p>
              </div>
              <button
                onClick={() => setDetailPedido(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isAtrasado(detailPedido) && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-700 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Pedido atrasado — prazo em {new Date(detailPedido.prazo! + 'T00:00:00').toLocaleDateString('pt-BR')}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Produto', detailPedido.produto],
                  ['Quantidade', detailPedido.quantidade.toLocaleString('pt-BR')],
                  ['Valor', fmt(detailPedido.valor)],
                  ['Prazo', detailPedido.prazo ? new Date(detailPedido.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
                  ['Orçamento', detailPedido.orcamento_numero || '—'],
                  ['Criado em', new Date(detailPedido.created_at).toLocaleDateString('pt-BR')],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
              {detailPedido.observacoes && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Observações</p>
                  <p className="text-sm text-slate-600">{detailPedido.observacoes}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => { gerarPedidoPDF(detailPedido); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Gerar PDF
              </button>
              <button
                onClick={() => { handleEdit(detailPedido); setDetailPedido(null); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-center font-semibold text-slate-800 mb-2">Excluir pedido?</h3>
            <p className="text-center text-sm text-slate-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
