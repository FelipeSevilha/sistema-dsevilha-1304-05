'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, Orcamento } from '@/lib/supabase';
import { Plus, Search, ArrowRight, Clock, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw, FileText, ShoppingCart } from 'lucide-react';
import OrcamentoForm from '@/components/orcamentos/OrcamentoForm';
import { imprimirProposta } from '@/components/orcamentos/propostaPDF';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Aguardando: { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
  Aprovado: { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Recusado: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  Convertido: { color: 'bg-sky-100 text-sky-700', icon: <RefreshCw className="w-3.5 h-3.5" /> },
};

function gerarNumero(lista: Orcamento[]): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `${yy}${mm}.${dd}`;
  const doDia = lista.filter(o => o.numero.startsWith(prefix)).length;
  const seq = String(doDia + 1).padStart(2, '0');
  return `${prefix}${seq}`;
}

export default function OrcamentosPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Orcamento | null>(null);
  const [convertendo, setConvertendo] = useState<Orcamento | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);

  const fetchOrcamentos = useCallback(async () => {
    const { data } = await supabase
      .from('orcamentos')
      .select('*, orcamento_items(*)')
      .order('created_at', { ascending: false });
    if (data) setLista(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrcamentos();

    const channel = supabase
      .channel('orcamentos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orcamentos' }, () => {
        fetchOrcamentos();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orcamento_items' }, () => {
        fetchOrcamentos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrcamentos]);

  const nextNumero = useMemo(() => gerarNumero(lista), [lista]);

  const filtered = lista.filter(o => {
    const matchSearch =
      o.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
      o.numero.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: lista.length,
    aguardando: lista.filter(o => o.status === 'Aguardando').length,
    aprovado: lista.filter(o => o.status === 'Aprovado').length,
    convertido: lista.filter(o => o.status === 'Convertido').length,
  };

  const handleSave = async (data: {
    numero: string;
    cliente: string;
    produto: string;
    itens: Array<{ id: number | string; descricao: string; quantidade: number; valorUnit: number }>;
    valor: number;
    criacao: string;
    validade: string;
    status: string;
    obs: string;
  }) => {
    if (editando) {
      await supabase.from('orcamentos').update({
        cliente_nome: data.cliente,
        validade: data.validade,
        status: data.status,
        valor_total: data.valor,
        observacoes: data.obs,
        updated_at: new Date().toISOString(),
      }).eq('id', editando.id);

      await supabase.from('orcamento_items').delete().eq('orcamento_id', editando.id);
      await supabase.from('orcamento_items').insert(
        data.itens.map(i => ({
          orcamento_id: editando.id,
          descricao: i.descricao,
          quantidade: i.quantidade,
          valor_unitario: i.valorUnit,
        }))
      );
    } else {
      const { data: newOrc, error } = await supabase.from('orcamentos').insert({
        numero: data.numero,
        cliente_nome: data.cliente,
        data: data.criacao,
        validade: data.validade,
        status: data.status,
        valor_total: data.valor,
        observacoes: data.obs,
      }).select().maybeSingle();

      if (newOrc && !error) {
        await supabase.from('orcamento_items').insert(
          data.itens.map(i => ({
            orcamento_id: newOrc.id,
            descricao: i.descricao,
            quantidade: i.quantidade,
            valor_unitario: i.valorUnit,
          }))
        );
      }
    }
    setFormOpen(false);
    setEditando(null);
  };

  const handleEdit = (o: Orcamento) => {
    setEditando(o);
    setFormOpen(true);
  };

  const handleConverter = async (o: Orcamento) => {
    setConvertLoading(true);
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 10);
    const produto = o.orcamento_items && o.orcamento_items.length > 0
      ? o.orcamento_items[0].descricao + (o.orcamento_items.length > 1 ? ` + ${o.orcamento_items.length - 1} item(ns)` : '')
      : 'Serviço gráfico';
    const qtd = o.orcamento_items ? o.orcamento_items.reduce((s, i) => s + i.quantidade, 0) : 1;

    const { data: maxPed } = await supabase
      .from('pedidos')
      .select('numero')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastNum = maxPed?.numero
      ? parseInt(maxPed.numero.replace('#P-', ''), 10)
      : 1000;
    const novoPedidoNum = `#P-${String(lastNum + 1).padStart(4, '0')}`;

    await supabase.from('pedidos').insert({
      numero: novoPedidoNum,
      cliente_nome: o.cliente_nome,
      orcamento_id: o.id,
      orcamento_numero: o.numero,
      produto,
      quantidade: qtd,
      valor: o.valor_total,
      status: 'Aguardando',
      prazo: prazo.toISOString().slice(0, 10),
      observacoes: `Gerado do orçamento ${o.numero}. ${o.observacoes}`.trim(),
    });

    await supabase.from('orcamentos').update({ status: 'Convertido' }).eq('id', o.id);
    setConvertendo(null);
    setConvertLoading(false);
  };

  const handleImprimirPDF = (o: Orcamento) => {
    imprimirProposta({
      id: `#O-${o.id}`,
      numero: o.numero,
      cliente: o.cliente_nome,
      produto: o.orcamento_items?.[0]?.descricao ?? '',
      itens: (o.orcamento_items ?? []).map(i => ({
        id: i.id,
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnit: i.valor_unitario,
      })),
      valor: o.valor_total,
      criacao: o.data,
      validade: o.validade,
      status: o.status,
      obs: o.observacoes,
    });
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
        {[
          { label: 'Total', value: counts.total, color: 'text-slate-800', bg: 'bg-white' },
          { label: 'Aguardando', value: counts.aguardando, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Aprovados', value: counts.aprovado, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Convertidos', value: counts.convertido, color: 'text-sky-600', bg: 'bg-sky-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-slate-200 p-4 ${s.bg} shadow-sm`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar orçamento..."
              className="pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 w-56"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-slate-600"
            >
              {['Todos', 'Aguardando', 'Aprovado', 'Recusado', 'Convertido'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => { setEditando(null); setFormOpen(true); }}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Número', 'Cliente', 'Itens', 'Data', 'Validade', 'Valor', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => {
                const sc = statusConfig[o.status];
                const itemSummary = o.orcamento_items && o.orcamento_items.length > 0
                  ? o.orcamento_items[0].descricao + (o.orcamento_items.length > 1 ? ` +${o.orcamento_items.length - 1}` : '')
                  : '—';
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-sky-600 font-medium">{o.numero}</td>
                    <td className="px-5 py-3 text-slate-800 font-medium">{o.cliente_nome}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-48 truncate">{itemSummary}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(o.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(o.validade + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3 text-slate-800 font-semibold">{fmt(o.valor_total)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc?.color}`}>
                        {sc?.icon}
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEdit(o)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Editar</button>
                        <button
                          onClick={() => handleImprimirPDF(o)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
                        >
                          <FileText className="w-3 h-3" />
                          PDF
                        </button>
                        {o.status !== 'Convertido' && (
                          <button
                            onClick={() => setConvertendo(o)}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Gerar Pedido
                          </button>
                        )}
                        {o.status === 'Convertido' && (
                          <span className="flex items-center gap-1 text-xs text-sky-500 font-medium">
                            <ArrowRight className="w-3 h-3" />
                            Convertido
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">Nenhum orçamento encontrado.</div>
          )}
        </div>
      </div>

      {convertendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !convertLoading && setConvertendo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Gerar Pedido</h3>
                  <p className="text-xs text-slate-400">Orçamento {convertendo.numero}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cliente</span>
                  <span className="font-semibold text-slate-800">{convertendo.cliente_nome}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Valor</span>
                  <span className="font-semibold text-slate-800">{fmt(convertendo.valor_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Itens</span>
                  <span className="text-slate-600">{convertendo.orcamento_items?.length ?? 0} item(s)</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">Um pedido será criado com status <strong>Aguardando</strong> e prazo de 10 dias.</p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setConvertendo(null)}
                disabled={convertLoading}
                className="flex-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConverter(convertendo)}
                disabled={convertLoading}
                className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {convertLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                {convertLoading ? 'Gerando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <OrcamentoForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null); }}
        onSave={handleSave}
        orcamento={editando ? {
          id: `#O-${editando.id}`,
          numero: editando.numero,
          cliente: editando.cliente_nome,
          produto: '',
          itens: (editando.orcamento_items ?? []).map(i => ({
            id: i.id,
            descricao: i.descricao,
            quantidade: i.quantidade,
            valorUnit: i.valor_unitario,
          })),
          valor: editando.valor_total,
          criacao: editando.data,
          validade: editando.validade,
          status: editando.status,
          obs: editando.observacoes,
        } : null}
        nextNumero={nextNumero}
      />
    </div>
  );
}
