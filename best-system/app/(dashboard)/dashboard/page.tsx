'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, ShoppingCart, Users, DollarSign, TriangleAlert as AlertTriangle, Info, CircleCheck as CheckCircle, Circle as XCircle, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusColors: Record<string, string> = {
  Aguardando: 'bg-amber-100 text-amber-700',
  Produção: 'bg-blue-100 text-blue-700',
  Acabamento: 'bg-sky-100 text-sky-700',
  Entrega: 'bg-emerald-100 text-emerald-700',
  Concluído: 'bg-slate-100 text-slate-600',
};

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type Alerta = {
  id: string;
  tipo: 'warning' | 'error' | 'info' | 'success';
  mensagem: string;
  data: string;
};

const alertIcons: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  info: <Info className="w-4 h-4 text-sky-500" />,
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
};

const alertBg: Record<string, string> = {
  warning: 'border-amber-200 bg-amber-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-sky-200 bg-sky-50',
  success: 'border-emerald-200 bg-emerald-50',
};

export default function DashboardPage() {
  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const anoAtual = now.getFullYear();
  const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
  const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

  const [stats, setStats] = useState({
    faturamentoMes: 0,
    faturamentoAnterior: 0,
    pedidosAndamento: 0,
    clientesCadastrados: 0,
    clientesNovosMes: 0,
    contasReceber: 0,
    contasVencer: 0,
  });

  const [faturamentoMensal, setFaturamentoMensal] = useState<{ mes: string; valor: number }[]>([]);
  const [pedidosPorStatus, setPedidosPorStatus] = useState<{ status: string; quantidade: number }[]>([]);
  const [pedidosRecentes, setPedidosRecentes] = useState<{
    id: string; numero: string; cliente_nome: string; produto: string; valor: number; status: string; prazo: string | null;
  }[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const buildAlertas = useCallback((
    contasPagar: { status: string; descricao: string; valor: number; vencimento: string }[],
    estoque: { item: string; quantidade: number; estoque_minimo: number }[],
    orcamentosAguardando: number,
    metaAtingida: boolean,
  ) => {
    const items: Alerta[] = [];
    const today = new Date().toISOString().slice(0, 10);

    contasPagar.filter(c => c.status === 'Vencido').forEach(c => {
      items.push({
        id: `cp-${c.descricao}`,
        tipo: 'error',
        mensagem: `Conta a pagar vencida: ${c.descricao} — ${fmt(c.valor)}`,
        data: today,
      });
    });

    estoque.filter(e => e.quantidade < e.estoque_minimo).forEach(e => {
      items.push({
        id: `est-${e.item}`,
        tipo: 'warning',
        mensagem: `Estoque de ${e.item} abaixo do mínimo (${e.quantidade} restantes)`,
        data: today,
      });
    });

    if (orcamentosAguardando > 0) {
      items.push({
        id: 'orc-aguardando',
        tipo: 'info',
        mensagem: `${orcamentosAguardando} orçamento${orcamentosAguardando > 1 ? 's' : ''} aguardando aprovação do cliente`,
        data: today,
      });
    }

    if (metaAtingida) {
      items.push({
        id: 'meta-atingida',
        tipo: 'success',
        mensagem: 'Parabéns! Meta mensal de faturamento atingida.',
        data: today,
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'ok',
        tipo: 'success',
        mensagem: 'Tudo em dia! Nenhum alerta no momento.',
        data: today,
      });
    }

    setAlertas(items.slice(0, 5));
  }, []);

  const fetchData = useCallback(async () => {
    const [
      { data: pedidos },
      { data: clientes },
      { data: contasReceber },
      { data: contasPagar },
      { data: estoque },
      { data: orcamentos },
    ] = await Promise.all([
      supabase.from('pedidos').select('id, numero, cliente_nome, produto, valor, status, prazo, created_at').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, created_at').eq('ativo', true),
      supabase.from('contas_receber').select('valor, status, vencimento'),
      supabase.from('contas_pagar').select('status, descricao, valor, vencimento'),
      supabase.from('estoque').select('item, quantidade, estoque_minimo'),
      supabase.from('orcamentos').select('status, valor_total, created_at'),
    ]);

    if (!pedidos || !clientes || !contasReceber || !contasPagar || !estoque || !orcamentos) return;

    const faturMes = contasReceber
      .filter(c => {
        const d = new Date(c.vencimento);
        return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
      })
      .reduce((s, c) => s + c.valor, 0);

    const faturAnterior = contasReceber
      .filter(c => {
        const d = new Date(c.vencimento);
        return d.getMonth() + 1 === mesAnterior && d.getFullYear() === anoAnterior;
      })
      .reduce((s, c) => s + c.valor, 0);

    const pedidosAndamento = pedidos.filter(p => p.status !== 'Concluído').length;

    const mesInicioAtual = new Date(anoAtual, mesAtual - 1, 1).toISOString();
    const clientesNovosMes = clientes.filter(c => c.created_at >= mesInicioAtual).length;

    const totalReceber = contasReceber.filter(c => c.status === 'Pendente').reduce((s, c) => s + c.valor, 0);
    const hoje = new Date();
    const em7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const contasVencer = contasReceber
      .filter(c => c.status === 'Pendente' && c.vencimento <= em7dias)
      .reduce((s, c) => s + c.valor, 0);

    setStats({
      faturamentoMes: faturMes,
      faturamentoAnterior: faturAnterior,
      pedidosAndamento,
      clientesCadastrados: clientes.length,
      clientesNovosMes,
      contasReceber: totalReceber,
      contasVencer,
    });

    setPedidosRecentes(pedidos.slice(0, 5));

    const statusCounts: Record<string, number> = {};
    pedidos.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    });
    setPedidosPorStatus(
      ['Aguardando', 'Produção', 'Acabamento', 'Entrega', 'Concluído']
        .map(s => ({ status: s, quantidade: statusCounts[s] ?? 0 }))
    );

    const faturPorMes: Record<string, number> = {};
    contasReceber.forEach(c => {
      const d = new Date(c.vencimento);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      faturPorMes[key] = (faturPorMes[key] ?? 0) + c.valor;
    });
    const last9: { mes: string; valor: number }[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtual - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      last9.push({ mes: MESES_ABREV[d.getMonth()], valor: faturPorMes[key] ?? 0 });
    }
    setFaturamentoMensal(last9);

    const orcAguardando = orcamentos.filter(o => o.status === 'Aguardando').length;
    const metaAtingida = faturMes > 80000;
    buildAlertas(contasPagar, estoque, orcAguardando, metaAtingida);
  }, [mesAtual, anoAtual, mesAnterior, anoAnterior, buildAlertas]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_receber' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const faturDiff = stats.faturamentoAnterior > 0
    ? parseFloat((((stats.faturamentoMes - stats.faturamentoAnterior) / stats.faturamentoAnterior) * 100).toFixed(1))
    : 0;
  const isUp = faturDiff >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Faturamento do Mês</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{fmt(stats.faturamentoMes)}</p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(faturDiff)}% vs mês anterior
              </div>
            </div>
            <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-sky-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pedidos em Andamento</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.pedidosAndamento}</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-slate-400">
                <Package className="w-3.5 h-3.5" />
                ativos no momento
              </div>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Clientes Cadastrados</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.clientesCadastrados}</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {stats.clientesNovosMes} novos este mês
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contas a Receber</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{fmt(stats.contasReceber)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                {fmt(stats.contasVencer)} a vencer (7d)
              </div>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Faturamento Mensal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Evolução dos últimos 9 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={faturamentoMensal}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [fmt(value), 'Faturamento']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="valor" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorValor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-800">Pedidos por Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribuição atual</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pedidosPorStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={75} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="quantidade" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Pedidos Recentes</h3>
            <a href="/pedidos" className="text-xs text-sky-600 hover:text-sky-700 font-medium">Ver todos →</a>
          </div>
          {pedidosRecentes.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Nenhum pedido encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pedido</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pedidosRecentes.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-sky-600 font-medium">{p.numero}</td>
                      <td className="px-5 py-3 text-slate-700 font-medium">{p.cliente_nome}</td>
                      <td className="px-5 py-3 text-slate-500">{p.produto}</td>
                      <td className="px-5 py-3 text-slate-800 font-medium text-right">{fmt(p.valor)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {p.prazo ? new Date(p.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
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
            <h3 className="font-semibold text-slate-800">Alertas do Sistema</h3>
          </div>
          <div className="p-4 space-y-3">
            {alertas.map((a) => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${alertBg[a.tipo]}`}>
                <div className="flex-shrink-0 mt-0.5">{alertIcons[a.tipo]}</div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{a.mensagem}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(a.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
