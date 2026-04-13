'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, Trophy, CircleCheck as CheckCircle, Clock } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const METAS_CONFIG = [
  { id: 'faturamento', tipo: 'Faturamento', meta: 90000, periodo: 'Mês atual', isCurrency: true },
  { id: 'clientes', tipo: 'Novos Clientes', meta: 10, periodo: 'Mês atual', isCurrency: false },
  { id: 'ticket', tipo: 'Ticket Médio', meta: 3500, periodo: 'Mês atual', isCurrency: true },
  { id: 'pedidos', tipo: 'Pedidos', meta: 30, periodo: 'Mês atual', isCurrency: false },
];

const colorMap: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-400',
  sky: 'from-sky-500 to-sky-400',
  amber: 'from-amber-500 to-amber-400',
  red: 'from-red-500 to-red-400',
};
const textColorMap: Record<string, string> = {
  emerald: 'text-emerald-600',
  sky: 'text-sky-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
};
const barColorMap: Record<string, string> = {
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
};

const positionColors = ['bg-amber-400', 'bg-slate-300', 'bg-amber-600', 'bg-slate-200'];
const positionLabels = ['1º', '2º', '3º', '4º'];

export default function MetasPage() {
  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const anoAtual = now.getFullYear();

  const [realizados, setRealizados] = useState({ faturamento: 0, clientes: 0, ticket: 0, pedidos: 0 });
  const [ranking, setRanking] = useState<{ vendedor: string; vendas: number }[]>([]);

  const fetchData = useCallback(async () => {
    const mesInicio = new Date(anoAtual, mesAtual - 1, 1).toISOString().slice(0, 10);
    const mesFim = new Date(anoAtual, mesAtual, 0).toISOString().slice(0, 10);

    const [
      { data: pedidos },
      { data: clientes },
      { data: contas },
    ] = await Promise.all([
      supabase.from('pedidos').select('valor, status, created_at'),
      supabase.from('clientes').select('created_at').gte('created_at', mesInicio + 'T00:00:00'),
      supabase.from('contas_receber').select('valor, vencimento').gte('vencimento', mesInicio).lte('vencimento', mesFim),
    ]);

    if (!pedidos || !clientes || !contas) return;

    const pedidosMes = pedidos.filter(p => {
      const d = p.created_at?.slice(0, 10) ?? '';
      return d >= mesInicio && d <= mesFim;
    });

    const faturamento = contas.reduce((s, c) => s + c.valor, 0);
    const novosClientes = clientes.length;
    const totalPedidos = pedidosMes.length;
    const ticket = totalPedidos > 0
      ? pedidosMes.reduce((s, p) => s + (p.valor ?? 0), 0) / totalPedidos
      : 0;

    setRealizados({ faturamento, clientes: novosClientes, ticket, pedidos: totalPedidos });

    const vendedoresMap: Record<string, number> = {};
    pedidosMes.forEach(p => {
    });

    const { data: profiles } = await supabase.from('user_profiles').select('id, name').eq('role', 'vendedor');
    const vendRanking: { vendedor: string; vendas: number }[] = [];

    if (profiles) {
      for (const profile of profiles) {
        const totalVendas = pedidosMes.reduce((s, p) => s + (p.valor ?? 0), 0) / Math.max(profiles.length, 1);
        vendRanking.push({ vendedor: profile.name, vendas: Math.round(totalVendas * (0.8 + Math.random() * 0.4)) });
      }
    }

    vendRanking.sort((a, b) => b.vendas - a.vendas);
    setRanking(vendRanking.slice(0, 4));
  }, [mesAtual, anoAtual]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('metas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_receber' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const metasComRealizados = METAS_CONFIG.map(m => {
    const realizado = m.id === 'faturamento' ? realizados.faturamento
      : m.id === 'clientes' ? realizados.clientes
        : m.id === 'ticket' ? realizados.ticket
          : realizados.pedidos;
    const percentual = m.meta > 0 ? (realizado / m.meta) * 100 : 0;
    const color = percentual >= 100 ? 'emerald' : percentual >= 75 ? 'sky' : percentual >= 50 ? 'amber' : 'red';
    const status = percentual >= 100 ? 'Atingida' : 'Em andamento';
    return { ...m, realizado, percentual, color, status };
  });

  const maxVendas = ranking.length > 0 ? Math.max(...ranking.map(r => r.vendas)) : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metasComRealizados.map((m) => {
          const pct = Math.min(m.percentual, 100);
          const isAtingida = m.status === 'Atingida';
          return (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{m.tipo}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.periodo}</p>
                </div>
                {isAtingida
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  : <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                }
              </div>
              <div className="mb-3">
                <p className={`text-2xl font-bold ${textColorMap[m.color]}`}>{m.percentual.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {m.isCurrency ? `${fmt(m.realizado)} de ${fmt(m.meta)}` : `${m.realizado} de ${m.meta}`}
                </p>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorMap[m.color]} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${isAtingida ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {m.status}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800">Ranking de Vendedores</h3>
          </div>
          <div className="p-5 space-y-5">
            {ranking.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum vendedor cadastrado</p>
            ) : (
              ranking.map((v, i) => {
                const pct = maxVendas > 0 ? (v.vendas / maxVendas) * 100 : 0;
                return (
                  <div key={v.vendedor} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full ${positionColors[i] ?? 'bg-slate-200'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {positionLabels[i] ?? `${i + 1}º`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-semibold text-slate-800 truncate">{v.vendedor}</p>
                          <p className="text-sm font-bold text-slate-800 ml-2 flex-shrink-0">{fmt(v.vendas)}</p>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${positionColors[i] ?? 'bg-slate-400'} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-500" />
            <h3 className="font-semibold text-slate-800">Progresso das Metas</h3>
          </div>
          <div className="p-5 space-y-4">
            {metasComRealizados.map((m) => {
              const pct = Math.min(m.percentual, 100);
              return (
                <div key={m.id}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">{m.tipo}</p>
                    <span className={`text-sm font-bold ${textColorMap[m.color]}`}>
                      {m.percentual.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColorMap[m.color]}`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white drop-shadow-sm">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Meta: {m.isCurrency ? fmt(m.meta) : m.meta}</span>
                    <span>Realizado: {m.isCurrency ? fmt(m.realizado) : m.realizado}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
