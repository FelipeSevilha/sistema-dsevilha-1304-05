'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Package, Users, Clock, ChartBar as BarChart3, ArrowUpRight } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#06b6d4'];
const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type Painel = {
  ticketMedio: number;
  ticketMedioAnterior: number;
  produtoMaisVendido: string;
  produtoMaisVendidoQtd: number;
  clienteQueMaisCompra: string;
  clienteQueMaisCompraValor: number;
  prazoMedioEntrega: number;
  taxaConversaoOrcamentos: number;
  produtosPorCategoria: { categoria: string; valor: number }[];
  topClientes: { cliente: string; valor: number }[];
};

export default function PainelEstrategicoPage() {
  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const anoAtual = now.getFullYear();

  const [painel, setPainel] = useState<Painel>({
    ticketMedio: 0,
    ticketMedioAnterior: 0,
    produtoMaisVendido: '—',
    produtoMaisVendidoQtd: 0,
    clienteQueMaisCompra: '—',
    clienteQueMaisCompraValor: 0,
    prazoMedioEntrega: 0,
    taxaConversaoOrcamentos: 0,
    produtosPorCategoria: [],
    topClientes: [],
  });

  const [faturamentoAnual, setFaturamentoAnual] = useState<{ mes: string; valor: number }[]>([]);

  const fetchData = useCallback(async () => {
    const mesInicio = new Date(anoAtual, mesAtual - 1, 1).toISOString().slice(0, 10);
    const mesFim = new Date(anoAtual, mesAtual, 0).toISOString().slice(0, 10);
    const mesAnteriorInicio = new Date(anoAtual, mesAtual - 2, 1).toISOString().slice(0, 10);
    const mesAnteriorFim = new Date(anoAtual, mesAtual - 1, 0).toISOString().slice(0, 10);

    const [
      { data: pedidos },
      { data: orcamentos },
      { data: produtos },
    ] = await Promise.all([
      supabase.from('pedidos').select('produto, quantidade, valor, cliente_nome, prazo, status, created_at'),
      supabase.from('orcamentos').select('status, created_at'),
      supabase.from('produtos').select('nome, categoria, preco').eq('ativo', true),
    ]);

    if (!pedidos || !orcamentos || !produtos) return;

    const pedidosMes = pedidos.filter(p => {
      const d = p.created_at?.slice(0, 10) ?? '';
      return d >= mesInicio && d <= mesFim;
    });
    const pedidosAnterior = pedidos.filter(p => {
      const d = p.created_at?.slice(0, 10) ?? '';
      return d >= mesAnteriorInicio && d <= mesAnteriorFim;
    });

    const totalMes = pedidosMes.reduce((s, p) => s + (p.valor ?? 0), 0);
    const totalAnterior = pedidosAnterior.reduce((s, p) => s + (p.valor ?? 0), 0);
    const ticketMedio = pedidosMes.length > 0 ? totalMes / pedidosMes.length : 0;
    const ticketMedioAnterior = pedidosAnterior.length > 0 ? totalAnterior / pedidosAnterior.length : 0;

    const clienteMap: Record<string, number> = {};
    pedidosMes.forEach(p => {
      clienteMap[p.cliente_nome] = (clienteMap[p.cliente_nome] ?? 0) + (p.valor ?? 0);
    });
    const topClientes = Object.entries(clienteMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cliente, valor]) => ({ cliente, valor }));

    const maiorCliente = topClientes[0];

    const produtoMap: Record<string, number> = {};
    pedidosMes.forEach(p => {
      const prod = p.produto?.split(' +')[0] ?? '—';
      produtoMap[prod] = (produtoMap[prod] ?? 0) + (p.quantidade ?? 1);
    });
    const produtoTop = Object.entries(produtoMap).sort(([, a], [, b]) => b - a)[0];

    const categoriaMap: Record<string, number> = {};
    produtos.forEach(p => {
      if (p.categoria) {
        categoriaMap[p.categoria] = (categoriaMap[p.categoria] ?? 0) + (p.preco ?? 0);
      }
    });
    const produtosPorCategoria = Object.entries(categoriaMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([categoria, valor]) => ({ categoria, valor }));

    const pedidosConcluidos = pedidos.filter(p => p.status === 'Concluído' && p.prazo && p.created_at);
    let prazoMedio = 0;
    if (pedidosConcluidos.length > 0) {
      const totalDias = pedidosConcluidos.reduce((s, p) => {
        const criado = new Date(p.created_at ?? '');
        const prazo = new Date(p.prazo + 'T00:00:00');
        return s + Math.max(0, Math.round((prazo.getTime() - criado.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0);
      prazoMedio = Math.round(totalDias / pedidosConcluidos.length);
    }

    const orcamentosMes = orcamentos.filter(o => {
      const d = o.created_at?.slice(0, 10) ?? '';
      return d >= mesInicio && d <= mesFim;
    });
    const convertidos = orcamentosMes.filter(o => o.status === 'Convertido' || o.status === 'Aprovado').length;
    const taxaConversao = orcamentosMes.length > 0 ? Math.round((convertidos / orcamentosMes.length) * 100) : 0;

    setPainel({
      ticketMedio,
      ticketMedioAnterior,
      produtoMaisVendido: produtoTop?.[0] ?? '—',
      produtoMaisVendidoQtd: produtoTop?.[1] ?? 0,
      clienteQueMaisCompra: maiorCliente?.cliente ?? '—',
      clienteQueMaisCompraValor: maiorCliente?.valor ?? 0,
      prazoMedioEntrega: prazoMedio,
      taxaConversaoOrcamentos: taxaConversao,
      produtosPorCategoria,
      topClientes,
    });

    const faturPorMes: Record<string, number> = {};
    pedidos.forEach(p => {
      const d = new Date(p.created_at ?? '');
      if (d.getFullYear() === anoAtual) {
        const key = `${d.getMonth() + 1}`;
        faturPorMes[key] = (faturPorMes[key] ?? 0) + (p.valor ?? 0);
      }
    });
    const anual = MESES_ABREV.map((mes, i) => ({
      mes,
      valor: faturPorMes[String(i + 1)] ?? 0,
    }));
    setFaturamentoAnual(anual);
  }, [mesAtual, anoAtual]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('painel_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orcamentos' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const ticketDiff = painel.ticketMedioAnterior > 0
    ? (((painel.ticketMedio - painel.ticketMedioAnterior) / painel.ticketMedioAnterior) * 100).toFixed(1)
    : '0.0';

  const totalCategoria = painel.produtosPorCategoria.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ticket Médio</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{fmt(painel.ticketMedio)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{ticketDiff}% vs mês anterior
              </div>
            </div>
            <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-sky-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Produto Mais Vendido</p>
              <p className="text-base font-bold text-slate-800 mt-1 leading-tight">{painel.produtoMaisVendido}</p>
              <p className="text-xs text-slate-400 mt-2">{painel.produtoMaisVendidoQtd.toLocaleString('pt-BR')} unidades</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Maior Cliente</p>
              <p className="text-base font-bold text-slate-800 mt-1 leading-tight">{painel.clienteQueMaisCompra}</p>
              <p className="text-xs text-slate-400 mt-2">{fmt(painel.clienteQueMaisCompraValor)} em compras</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Prazo Médio Entrega</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{painel.prazoMedioEntrega} dias</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-sky-600">
                <Clock className="w-3.5 h-3.5" />
                {painel.taxaConversaoOrcamentos}% taxa de conversão
              </div>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Vendas por Categoria</h3>
          <p className="text-xs text-slate-400 mb-4">Participação no faturamento</p>
          {painel.produtosPorCategoria.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sem dados de categorias</p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={painel.produtosPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="valor"
                    paddingAngle={3}
                  >
                    {painel.produtosPorCategoria.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {painel.produtosPorCategoria.map((c, i) => {
                  const pct = totalCategoria > 0 ? ((c.valor / totalCategoria) * 100).toFixed(1) : '0';
                  return (
                    <div key={c.categoria} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">{c.categoria}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Top 5 Clientes</h3>
          <p className="text-xs text-slate-400 mb-4">Por volume de compras no mês</p>
          {painel.topClientes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sem dados de clientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={painel.topClientes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="cliente" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Compras']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="valor" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-1">Evolução do Faturamento Anual</h3>
        <p className="text-xs text-slate-400 mb-4">Meses com dados registrados em {anoAtual}</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={faturamentoAnual}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [fmt(v), 'Faturamento']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ fill: '#0ea5e9', r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
