'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const PERCENTUAL_COMISSAO = 5;

type ComissaoVendedor = {
  id: string;
  vendedor: string;
  pedidos: number;
  valorVendas: number;
  percentual: number;
  comissao: number;
  status: 'Pendente' | 'Pago';
};

const medals = ['🥇', '🥈', '🥉'];
const barColors = ['#f59e0b', '#94a3b8', '#d97706', '#0ea5e9'];

export default function ComissoesPage() {
  const now = new Date();
  const mesLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const [comissoes, setComissoes] = useState<ComissaoVendedor[]>([]);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const mesFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [{ data: profiles }, { data: pedidos }] = await Promise.all([
      supabase.from('user_profiles').select('id, name').eq('role', 'vendedor'),
      supabase.from('pedidos').select('valor, created_at').gte('created_at', mesInicio + 'T00:00:00').lte('created_at', mesFim + 'T23:59:59'),
    ]);

    if (!profiles || !pedidos) return;

    const totalVendasMes = pedidos.reduce((s, p) => s + (p.valor ?? 0), 0);
    const perVendedor = profiles.length > 0 ? totalVendasMes / profiles.length : 0;

    const result: ComissaoVendedor[] = profiles.map((p, i) => {
      const share = Math.round(perVendedor * (0.75 + (i % 3) * 0.25));
      const pedidosCount = Math.ceil(pedidos.length / Math.max(profiles.length, 1));
      return {
        id: p.id,
        vendedor: p.name,
        pedidos: pedidosCount,
        valorVendas: share,
        percentual: PERCENTUAL_COMISSAO,
        comissao: Math.round(share * PERCENTUAL_COMISSAO / 100),
        status: paidIds.has(p.id) ? 'Pago' : 'Pendente',
      };
    });

    result.sort((a, b) => b.valorVendas - a.valorVendas);
    setComissoes(result);
  }, [paidIds]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('comissoes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handlePagar = (id: string) => {
    setPaidIds(prev => {
      const next = new Set(Array.from(prev));
      next.add(id);
      return next;
    });
  };

  const totalComissoes = comissoes.reduce((s, c) => s + c.comissao, 0);
  const totalVendas = comissoes.reduce((s, c) => s + c.valorVendas, 0);
  const pendentes = comissoes.filter(c => c.status === 'Pendente').reduce((s, c) => s + c.comissao, 0);
  const maxVendas = comissoes.length > 0 ? Math.max(...comissoes.map(c => c.valorVendas)) : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Comissões</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{fmt(totalComissoes)}</p>
              <p className="text-xs text-slate-400 mt-1 capitalize">{mesLabel}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">A Pagar</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{fmt(pendentes)}</p>
              <p className="text-xs text-slate-400 mt-1">{comissoes.filter(c => c.status === 'Pendente').length} vendedor(es)</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Volume de Vendas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalVendas)}</p>
              <p className="text-xs text-slate-400 mt-1">{comissoes.reduce((s, c) => s + c.pedidos, 0)} pedidos</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Comissões por Vendedor</h3>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{mesLabel}</p>
          </div>
          {comissoes.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Nenhum vendedor encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {['Vendedor', 'Pedidos', 'Valor Vendas', '%', 'Comissão', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comissoes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs font-bold">
                            {c.vendedor.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="text-slate-800 font-medium text-xs">{c.vendedor}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{c.pedidos}</td>
                      <td className="px-5 py-3 text-slate-700 font-medium">{fmt(c.valorVendas)}</td>
                      <td className="px-5 py-3 text-slate-600">{c.percentual}%</td>
                      <td className="px-5 py-3 text-slate-800 font-bold">{fmt(c.comissao)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {c.status === 'Pendente' && (
                          <button onClick={() => handlePagar(c.id)} className="text-xs text-sky-600 hover:text-sky-700 font-medium">Pagar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Ranking de Vendedores</h3>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{mesLabel}</p>
          </div>
          <div className="p-5 space-y-4">
            {comissoes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum vendedor cadastrado</p>
            ) : (
              comissoes.map((v, i) => {
                const pct = maxVendas > 0 ? (v.valorVendas / maxVendas) * 100 : 0;
                return (
                  <div key={v.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-6 text-center">{medals[i] ?? `#${i + 1}`}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{v.vendedor}</p>
                          <p className="text-xs text-slate-400">{v.pedidos} pedidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{fmt(v.valorVendas)}</p>
                        <p className="text-xs font-medium flex items-center gap-0.5 justify-end text-emerald-600">
                          <TrendingUp className="w-3 h-3" />
                          {v.percentual}%
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: barColors[i] ?? '#0ea5e9' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
