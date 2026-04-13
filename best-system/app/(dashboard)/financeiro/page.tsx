'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, ContaPagar, ContaReceber } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Target, ChevronDown, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return fmt(v);
};

type MainTab = 'mensal' | 'anual' | 'metas';
type SubTab = 'pagar' | 'receber' | 'fluxo';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const ANOS = Array.from({ length: 35 }, (_, i) => 2026 + i);

const BASE_MES = [52000, 61000, 55000, 67000, 72000, 68000, 81000, 74000, 87450, 79000, 91000, 105000];

function gerarDadosAnuais(ano: number) {
  const seed = (ano - 2024) * 1.08;
  return MESES.map((mes, i) => {
    const faturamento = Math.round(BASE_MES[i] * seed);
    const custos = Math.round(faturamento * (0.56 + Math.sin(i + ano) * 0.04));
    return { mes: mes.slice(0, 3), mesNum: i + 1, faturamento, custos, lucro: faturamento - custos };
  });
}

function ProgressBar({ value, max, color = 'bg-sky-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const statusPagarConfig: Record<string, string> = {
  Pendente: 'bg-amber-100 text-amber-700',
  Pago: 'bg-emerald-100 text-emerald-700',
  Vencido: 'bg-red-100 text-red-700',
};

const statusReceberConfig: Record<string, string> = {
  Pendente: 'bg-amber-100 text-amber-700',
  Recebido: 'bg-emerald-100 text-emerald-700',
  Vencido: 'bg-red-100 text-red-700',
};

export default function FinanceiroPage() {
  const [mainTab, setMainTab] = useState<MainTab>('mensal');
  const [subTab, setSubTab] = useState<SubTab>('pagar');
  const [mesSelecionado, setMesSelecionado] = useState(1);
  const [anoSelecionado, setAnoSelecionado] = useState(2026);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<{ data: string; entradas: number; saidas: number; saldo: number }[]>([]);

  const fetchFinanceiro = useCallback(async () => {
    const [{ data: pagar }, { data: receber }] = await Promise.all([
      supabase.from('contas_pagar').select('*').order('vencimento'),
      supabase.from('contas_receber').select('*').order('vencimento'),
    ]);
    if (pagar) setContasPagar(pagar);
    if (receber) setContasReceber(receber);

    if (pagar && receber) {
      const byDate: Record<string, { entradas: number; saidas: number }> = {};
      receber.forEach(c => {
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].entradas += c.valor;
      });
      pagar.forEach(c => {
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].saidas += c.valor;
      });
      let saldoAcum = 0;
      const fluxo = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, v]) => {
          saldoAcum += v.entradas - v.saidas;
          return {
            data: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            entradas: v.entradas,
            saidas: v.saidas,
            saldo: saldoAcum,
          };
        });
      setFluxoCaixa(fluxo);
    }
  }, []);

  useEffect(() => {
    fetchFinanceiro();

    const channel = supabase
      .channel('financeiro_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar' }, () => fetchFinanceiro())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_receber' }, () => fetchFinanceiro())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFinanceiro]);

  const dadosAnuais = useMemo(() => gerarDadosAnuais(anoSelecionado), [anoSelecionado]);
  const dadosMes = useMemo(() => dadosAnuais.find(d => d.mesNum === mesSelecionado), [dadosAnuais, mesSelecionado]);

  const totalFaturamento = useMemo(() => dadosAnuais.reduce((s, d) => s + d.faturamento, 0), [dadosAnuais]);
  const totalCustos = useMemo(() => dadosAnuais.reduce((s, d) => s + d.custos, 0), [dadosAnuais]);
  const totalLucro = useMemo(() => dadosAnuais.reduce((s, d) => s + d.lucro, 0), [dadosAnuais]);
  const margemMedia = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0;

  const metasBase = [
    { trimestre: 'T1', periodo: 'Jan — Mar', metaFaturamento: 180000, realizadoFaturamento: 168000, metaReducaoCustos: 5, realizadoReducaoCustos: 4.2, status: 'Encerrado' },
    { trimestre: 'T2', periodo: 'Abr — Jun', metaFaturamento: 200000, realizadoFaturamento: 207000, metaReducaoCustos: 5, realizadoReducaoCustos: 5.8, status: 'Encerrado' },
    { trimestre: 'T3', periodo: 'Jul — Set', metaFaturamento: 240000, realizadoFaturamento: 242450, metaReducaoCustos: 6, realizadoReducaoCustos: 6.1, status: 'Em andamento' },
    { trimestre: 'T4', periodo: 'Out — Dez', metaFaturamento: 280000, realizadoFaturamento: 0, metaReducaoCustos: 7, realizadoReducaoCustos: 0, status: 'Futuro' },
  ];

  const metasAno = useMemo(() => {
    const seed = (anoSelecionado - 2026) * 0.08 + 1;
    return metasBase.map(q => ({
      ...q,
      metaFaturamento: Math.round(q.metaFaturamento * seed),
      realizadoFaturamento: q.status === 'Futuro' ? 0 : Math.round(q.realizadoFaturamento * seed),
    }));
  }, [anoSelecionado]);

  const YearSelector = () => (
    <div className="relative">
      <select
        value={anoSelecionado}
        onChange={e => setAnoSelecionado(Number(e.target.value))}
        className="appearance-none pl-4 pr-10 h-10 text-sm font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 shadow-sm"
      >
        {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {([
            { key: 'mensal', label: 'Mensal' },
            { key: 'anual', label: 'Anual' },
            { key: 'metas', label: 'Metas Financeiras' },
          ] as { key: MainTab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setMainTab(t.key)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${mainTab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <YearSelector />
      </div>

      {mainTab === 'mensal' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={mesSelecionado}
                onChange={e => setMesSelecionado(Number(e.target.value))}
                className="appearance-none pl-4 pr-10 h-10 text-sm font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 shadow-sm"
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-sm text-slate-400 font-medium">{anoSelecionado}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Faturamento</p>
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-sky-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{fmt(dadosMes?.faturamento ?? 0)}</p>
              <p className="text-xs text-slate-400 mt-1">{MESES[mesSelecionado - 1]}/{anoSelecionado}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Custos</p>
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500">{fmt(dadosMes?.custos ?? 0)}</p>
              <p className="text-xs text-slate-400 mt-1">{dadosMes && dadosMes.faturamento > 0 ? `${((dadosMes.custos / dadosMes.faturamento) * 100).toFixed(1)}% do faturamento` : '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lucro</p>
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{fmt(dadosMes?.lucro ?? 0)}</p>
              <p className="text-xs text-slate-400 mt-1">{dadosMes && dadosMes.faturamento > 0 ? `Margem ${((dadosMes.lucro / dadosMes.faturamento) * 100).toFixed(1)}%` : '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo Caixa</p>
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{fmt(fluxoCaixa.length > 0 ? fluxoCaixa[fluxoCaixa.length - 1].saldo : 0)}</p>
              <p className="text-xs text-slate-400 mt-1">Saldo acumulado</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex gap-1 px-5 pt-4 pb-0 border-b border-slate-100">
              {([
                { key: 'pagar', label: 'Contas a Pagar' },
                { key: 'receber', label: 'Contas a Receber' },
                { key: 'fluxo', label: 'Fluxo de Caixa' },
              ] as { key: SubTab; label: string }[]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setSubTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${subTab === t.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {subTab === 'pagar' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contasPagar.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-800 font-medium">{c.descricao}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{c.categoria}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{fmt(c.valor)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusPagarConfig[c.status]}`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <p className="text-sm font-semibold text-slate-700">
                    Total pendente: <span className="text-red-600">{fmt(contasPagar.filter(c => c.status === 'Pendente').reduce((s, c) => s + c.valor, 0))}</span>
                  </p>
                </div>
              </div>
            )}

            {subTab === 'receber' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contasReceber.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-800 font-medium">{c.cliente_nome}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{c.descricao}</td>
                        <td className="px-5 py-3 text-slate-500">{new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{fmt(c.valor)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusReceberConfig[c.status]}`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <p className="text-sm font-semibold text-slate-700">
                    Total a receber: <span className="text-emerald-600">{fmt(contasReceber.filter(c => c.status === 'Pendente').reduce((s, c) => s + c.valor, 0))}</span>
                  </p>
                </div>
              </div>
            )}

            {subTab === 'fluxo' && (
              <div className="p-5">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fluxoCaixa}>
                      <defs>
                        <linearGradient id="entGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="saiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtShort} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#0ea5e9" fill="url(#entGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#f43f5e" fill="url(#saiGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mainTab === 'anual' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Faturamento Acumulado</p>
              <p className="text-2xl font-bold text-slate-800">{fmt(totalFaturamento)}</p>
              <p className="text-xs text-slate-400 mt-1">Jan — Dez {anoSelecionado}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Custos Acumulados</p>
              <p className="text-2xl font-bold text-red-500">{fmt(totalCustos)}</p>
              <p className="text-xs text-slate-400 mt-1">{((totalCustos / totalFaturamento) * 100).toFixed(1)}% do faturamento</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Lucro Acumulado</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(totalLucro)}</p>
              <p className="text-xs text-slate-400 mt-1">Margem média {margemMedia.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Faturamento vs Custos por Mês — {anoSelecionado}</h3>
            </div>
            <div className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosAnuais} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtShort} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="faturamento" name="Faturamento" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="custos" name="Custos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Detalhamento Mensal — {anoSelecionado}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {['Mês', 'Faturamento', 'Custos', 'Lucro', 'Margem'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dadosAnuais.map(d => (
                    <tr key={d.mesNum} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700">{MESES[d.mesNum - 1]}</td>
                      <td className="px-5 py-3 text-slate-800 font-semibold">{fmt(d.faturamento)}</td>
                      <td className="px-5 py-3 text-red-500">{fmt(d.custos)}</td>
                      <td className="px-5 py-3 text-emerald-600 font-semibold">{fmt(d.lucro)}</td>
                      <td className="px-5 py-3 text-slate-600">{((d.lucro / d.faturamento) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-5 py-3 text-slate-700">Total</td>
                    <td className="px-5 py-3 text-sky-600">{fmt(totalFaturamento)}</td>
                    <td className="px-5 py-3 text-red-500">{fmt(totalCustos)}</td>
                    <td className="px-5 py-3 text-emerald-600">{fmt(totalLucro)}</td>
                    <td className="px-5 py-3 text-slate-600">{margemMedia.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'metas' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {metasAno.map(q => {
              const pctFat = q.metaFaturamento > 0 ? Math.min((q.realizadoFaturamento / q.metaFaturamento) * 100, 100) : 0;
              const pctCust = q.metaReducaoCustos > 0 ? Math.min((q.realizadoReducaoCustos / q.metaReducaoCustos) * 100, 100) : 0;
              const isFuturo = q.status === 'Futuro';
              const isEncerrado = q.status === 'Encerrado';
              const isAndamento = q.status === 'Em andamento';

              const StatusIcon = isEncerrado ? CheckCircle2 : isAndamento ? Clock : AlertCircle;
              const statusColor = isEncerrado ? 'text-emerald-500' : isAndamento ? 'text-sky-500' : 'text-slate-300';
              const statusBadge = isEncerrado ? 'bg-emerald-100 text-emerald-700' : isAndamento ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400';

              return (
                <div key={q.trimestre} className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${isFuturo ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-lg font-bold text-slate-800">{q.trimestre}</span>
                      <p className="text-xs text-slate-400">{q.periodo}</p>
                    </div>
                    <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-slate-500">Faturamento</p>
                        <span className={`text-xs font-bold ${pctFat >= 100 ? 'text-emerald-600' : pctFat >= 75 ? 'text-sky-600' : 'text-amber-600'}`}>
                          {isFuturo ? '—' : `${pctFat.toFixed(1)}%`}
                        </span>
                      </div>
                      <ProgressBar value={q.realizadoFaturamento} max={q.metaFaturamento} color={pctFat >= 100 ? 'bg-emerald-500' : pctFat >= 75 ? 'bg-sky-500' : 'bg-amber-400'} />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Meta: {fmt(q.metaFaturamento)}</span>
                        <span>{isFuturo ? '—' : fmt(q.realizadoFaturamento)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-slate-500">Redução de Custos</p>
                        <span className={`text-xs font-bold ${pctCust >= 100 ? 'text-emerald-600' : pctCust >= 75 ? 'text-sky-600' : 'text-amber-600'}`}>
                          {isFuturo ? '—' : `${pctCust.toFixed(1)}%`}
                        </span>
                      </div>
                      <ProgressBar value={q.realizadoReducaoCustos} max={q.metaReducaoCustos} color={pctCust >= 100 ? 'bg-emerald-500' : pctCust >= 75 ? 'bg-sky-500' : 'bg-amber-400'} />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Meta: {q.metaReducaoCustos}%</span>
                        <span>{isFuturo ? '—' : `${q.realizadoReducaoCustos}%`}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex mt-4 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge}`}>
                    {q.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-500" />
              <h3 className="font-semibold text-slate-800">Meta vs Realizado — Faturamento Trimestral {anoSelecionado}</h3>
            </div>
            <div className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metasAno} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="trimestre" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtShort} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="metaFaturamento" name="Meta" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizadoFaturamento" name="Realizado" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
