'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  supabase,
  ContaPagar,
  ContaReceber,
} from '@/lib/supabase';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Target,
  ChevronDown,
  Plus,
  Sparkles,
  X,
  Save,
} from 'lucide-react';

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const ANOS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);
const CENTROS = ['Felipe Pessoal', 'Gráfica Itu', 'Gráfica SP'] as const;
const TRIMESTRES = [
  { key: 'T1', label: '1º Trimestre', meses: [1, 2, 3] },
  { key: 'T2', label: '2º Trimestre', meses: [4, 5, 6] },
  { key: 'T3', label: '3º Trimestre', meses: [7, 8, 9] },
  { key: 'T4', label: '4º Trimestre', meses: [10, 11, 12] },
] as const;

type MainTab = 'mensal' | 'anual' | 'metas';
type SubTab = 'pagar' | 'receber' | 'fluxo' | 'centros';
type TipoLancamento = 'pagar' | 'receber';
type CentroCusto = (typeof CENTROS)[number];
type TrimestreKey = 'T1' | 'T2' | 'T3' | 'T4';

type ContaPagarExtendida = ContaPagar & {
  centro_custo?: CentroCusto;
  recorrente?: boolean;
  parcela_atual?: number;
  total_parcelas?: number;
};

type ContaReceberExtendida = ContaReceber & {
  centro_custo?: CentroCusto;
};

type MetaFinanceira = {
  trimestre: TrimestreKey;
  metaFaturamento: number;
  metaReducaoCustos: number;
};

type FormState = {
  tipo: TipoLancamento;
  descricao: string;
  cliente_nome: string;
  categoria: string;
  centro_custo: CentroCusto;
  valor: string;
  vencimento: string;
  statusPagar: 'Pendente' | 'Pago' | 'Vencido';
  statusReceber: 'Pendente' | 'Recebido' | 'Vencido';
  recorrente: boolean;
  totalParcelas: number;
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v}`;
};

const toNumber = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const getAnoMes = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
};

const addMonthsToDate = (date: string, months: number) => {
  const d = new Date(`${date}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

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

const CORES_CENTROS = ['#0ea5e9', '#10b981', '#f59e0b'];

const METAS_STORAGE_KEY = 'grafica_financeiro_metas_v1';

const PRESETS_DESPESAS: Record<CentroCusto, Array<{ descricao: string; categoria: string; valor: number }>> = {
  'Felipe Pessoal': [
    { descricao: 'Cartão pessoal usado na gráfica', categoria: 'Pessoal', valor: 650 },
    { descricao: 'Combustível / deslocamento', categoria: 'Pessoal', valor: 420 },
    { descricao: 'Ajustes e pequenas compras', categoria: 'Pessoal', valor: 300 },
  ],
  'Gráfica Itu': [
    { descricao: 'Aluguel unidade Itu', categoria: 'Fixo', valor: 2200 },
    { descricao: 'Energia elétrica Itu', categoria: 'Operacional', valor: 890 },
    { descricao: 'Internet e telefone Itu', categoria: 'Serviços', valor: 249 },
    { descricao: 'Insumos unidade Itu', categoria: 'Insumos', valor: 1350 },
  ],
  'Gráfica SP': [
    { descricao: 'Aluguel unidade SP', categoria: 'Fixo', valor: 2900 },
    { descricao: 'Energia elétrica SP', categoria: 'Operacional', valor: 1180 },
    { descricao: 'Internet e telefone SP', categoria: 'Serviços', valor: 299 },
    { descricao: 'Insumos unidade SP', categoria: 'Insumos', valor: 1650 },
  ],
};

function ProgressBar({
  value,
  max,
  color = 'bg-sky-500',
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function FinanceiroPage() {
  const hoje = new Date();
  const [mainTab, setMainTab] = useState<MainTab>('mensal');
  const [subTab, setSubTab] = useState<SubTab>('pagar');
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());

  const [contasPagar, setContasPagar] = useState<ContaPagarExtendida[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceberExtendida[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [trimestreSelecionado, setTrimestreSelecionado] = useState<TrimestreKey>('T1');

  const [metas, setMetas] = useState<Record<TrimestreKey, MetaFinanceira>>({
    T1: { trimestre: 'T1', metaFaturamento: 180000, metaReducaoCustos: 5 },
    T2: { trimestre: 'T2', metaFaturamento: 210000, metaReducaoCustos: 5 },
    T3: { trimestre: 'T3', metaFaturamento: 240000, metaReducaoCustos: 6 },
    T4: { trimestre: 'T4', metaFaturamento: 280000, metaReducaoCustos: 7 },
  });

  const [form, setForm] = useState<FormState>({
    tipo: 'pagar',
    descricao: '',
    cliente_nome: '',
    categoria: '',
    centro_custo: 'Gráfica Itu',
    valor: '',
    vencimento: `${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}-10`,
    statusPagar: 'Pendente',
    statusReceber: 'Pendente',
    recorrente: false,
    totalParcelas: 1,
  });

  const carregarMetas = useCallback(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(METAS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<TrimestreKey, MetaFinanceira>;
      setMetas(parsed);
    } catch {
      // ignora
    }
  }, []);

  const salvarMetas = useCallback((next: Record<TrimestreKey, MetaFinanceira>) => {
    setMetas(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(METAS_STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const fetchFinanceiro = useCallback(async () => {
    setLoading(true);

    const [{ data: pagar }, { data: receber }] = await Promise.all([
      supabase.from('contas_pagar').select('*').order('vencimento'),
      supabase.from('contas_receber').select('*').order('vencimento'),
    ]);

    if (pagar) {
      setContasPagar((pagar as ContaPagarExtendida[]).map((item) => ({
        ...item,
        centro_custo: (item as ContaPagarExtendida).centro_custo ?? 'Gráfica Itu',
        recorrente: Boolean((item as ContaPagarExtendida).recorrente),
        parcela_atual: (item as ContaPagarExtendida).parcela_atual ?? 1,
        total_parcelas: (item as ContaPagarExtendida).total_parcelas ?? 1,
      })));
    }

    if (receber) {
      setContasReceber((receber as ContaReceberExtendida[]).map((item) => ({
        ...item,
        centro_custo: (item as ContaReceberExtendida).centro_custo ?? 'Gráfica Itu',
      })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFinanceiro();
    carregarMetas();
  }, [fetchFinanceiro, carregarMetas]);

  const contasPagarMes = useMemo(
    () => contasPagar.filter((c) => c.ano === anoSelecionado && c.mes === mesSelecionado),
    [contasPagar, anoSelecionado, mesSelecionado],
  );

  const contasReceberMes = useMemo(
    () => contasReceber.filter((c) => c.ano === anoSelecionado && c.mes === mesSelecionado),
    [contasReceber, anoSelecionado, mesSelecionado],
  );

  const resumoMensal = useMemo(() => {
    const faturamento = contasReceberMes.reduce((s, c) => s + c.valor, 0);
    const custos = contasPagarMes.reduce((s, c) => s + c.valor, 0);
    const lucro = faturamento - custos;
    return {
      faturamento,
      custos,
      lucro,
      saldo: lucro,
    };
  }, [contasPagarMes, contasReceberMes]);

  const fluxoCaixaMes = useMemo(() => {
    const byDate: Record<string, { entradas: number; saidas: number }> = {};

    contasReceberMes.forEach((c) => {
      if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
      byDate[c.vencimento].entradas += c.valor;
    });

    contasPagarMes.forEach((c) => {
      if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
      byDate[c.vencimento].saidas += c.valor;
    });

    let saldoAcum = 0;

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, v]) => {
        saldoAcum += v.entradas - v.saidas;
        return {
          data: new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          entradas: v.entradas,
          saidas: v.saidas,
          saldo: saldoAcum,
        };
      });
  }, [contasPagarMes, contasReceberMes]);

  const dadosAnuais = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const receber = contasReceber
        .filter((c) => c.ano === anoSelecionado && c.mes === mes)
        .reduce((s, c) => s + c.valor, 0);

      const pagar = contasPagar
        .filter((c) => c.ano === anoSelecionado && c.mes === mes)
        .reduce((s, c) => s + c.valor, 0);

      return {
        mes: MESES[i].slice(0, 3),
        mesNum: mes,
        faturamento: receber,
        custos: pagar,
        lucro: receber - pagar,
      };
    });
  }, [anoSelecionado, contasPagar, contasReceber]);

  const totalFaturamento = useMemo(
    () => dadosAnuais.reduce((s, d) => s + d.faturamento, 0),
    [dadosAnuais],
  );

  const totalCustos = useMemo(
    () => dadosAnuais.reduce((s, d) => s + d.custos, 0),
    [dadosAnuais],
  );

  const totalLucro = useMemo(
    () => dadosAnuais.reduce((s, d) => s + d.lucro, 0),
    [dadosAnuais],
  );

  const margemMedia = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0;

  const despesasPorCentroMes = useMemo(() => {
    return CENTROS.map((centro) => ({
      centro,
      valor: contasPagarMes
        .filter((c) => (c.centro_custo ?? 'Gráfica Itu') === centro)
        .reduce((s, c) => s + c.valor, 0),
    }));
  }, [contasPagarMes]);

  const receitasPorCentroMes = useMemo(() => {
    return CENTROS.map((centro) => ({
      centro,
      valor: contasReceberMes
        .filter((c) => (c.centro_custo ?? 'Gráfica Itu') === centro)
        .reduce((s, c) => s + c.valor, 0),
    }));
  }, [contasReceberMes]);

  const centroComparativoMes = useMemo(() => {
    return CENTROS.map((centro) => {
      const receitas = contasReceberMes
        .filter((c) => (c.centro_custo ?? 'Gráfica Itu') === centro)
        .reduce((s, c) => s + c.valor, 0);

      const despesas = contasPagarMes
        .filter((c) => (c.centro_custo ?? 'Gráfica Itu') === centro)
        .reduce((s, c) => s + c.valor, 0);

      return {
        centro,
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });
  }, [contasPagarMes, contasReceberMes]);

  const trimestreAtual = TRIMESTRES.find((t) => t.key === trimestreSelecionado)!;

  const realizadoTrimestre = useMemo(() => {
    const faturamento = contasReceber
      .filter((c) => c.ano === anoSelecionado && trimestreAtual.meses.includes(c.mes))
      .reduce((s, c) => s + c.valor, 0);

    const custos = contasPagar
      .filter((c) => c.ano === anoSelecionado && trimestreAtual.meses.includes(c.mes))
      .reduce((s, c) => s + c.valor, 0);

    const reducaoCustos =
      faturamento > 0 ? Math.max(((faturamento - custos) / faturamento) * 100, 0) : 0;

    return { faturamento, custos, reducaoCustos };
  }, [anoSelecionado, contasPagar, contasReceber, trimestreAtual]);

  const metasAno = useMemo(() => {
    return TRIMESTRES.map((t) => {
      const meta = metas[t.key];
      const faturamento = contasReceber
        .filter((c) => c.ano === anoSelecionado && t.meses.includes(c.mes))
        .reduce((s, c) => s + c.valor, 0);

      const custos = contasPagar
        .filter((c) => c.ano === anoSelecionado && t.meses.includes(c.mes))
        .reduce((s, c) => s + c.valor, 0);

      const reducaoCustos =
        faturamento > 0 ? Math.max(((faturamento - custos) / faturamento) * 100, 0) : 0;

      return {
        trimestre: t.key,
        periodo: `${MESES[t.meses[0] - 1].slice(0, 3)} — ${MESES[t.meses[2] - 1].slice(0, 3)}`,
        metaFaturamento: meta.metaFaturamento,
        realizadoFaturamento: faturamento,
        metaReducaoCustos: meta.metaReducaoCustos,
        realizadoReducaoCustos: Number(reducaoCustos.toFixed(1)),
        status:
          faturamento === 0 && custos === 0
            ? 'Sem movimento'
            : faturamento >= meta.metaFaturamento
              ? 'Meta batida'
              : 'Em andamento',
      };
    });
  }, [anoSelecionado, contasPagar, contasReceber, metas]);

  const resetForm = () => {
    setForm({
      tipo: 'pagar',
      descricao: '',
      cliente_nome: '',
      categoria: '',
      centro_custo: 'Gráfica Itu',
      valor: '',
      vencimento: `${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}-10`,
      statusPagar: 'Pendente',
      statusReceber: 'Pendente',
      recorrente: false,
      totalParcelas: 1,
    });
  };

  const adicionarLancamento = async () => {
    const valor = toNumber(form.valor);
    if (!form.descricao || !form.vencimento || !valor) return;

    const parcelas = form.recorrente ? Math.max(1, form.totalParcelas) : 1;

    if (form.tipo === 'pagar') {
      const payload: Array<Partial<ContaPagarExtendida>> = Array.from({ length: parcelas }, (_, i) => {
        const vencimento = addMonthsToDate(form.vencimento, i);
        const { ano, mes } = getAnoMes(vencimento);
        const parcelaAtual = i + 1;
        return {
          descricao:
            parcelas > 1
              ? `${form.descricao} - Parcela ${parcelaAtual}/${parcelas}`
              : form.descricao,
          categoria: form.categoria || 'Geral',
          valor,
          vencimento,
          status: form.statusPagar,
          ano,
          mes,
          centro_custo: form.centro_custo,
          recorrente: parcelas > 1,
          parcela_atual: parcelaAtual,
          total_parcelas: parcelas,
        };
      });

      await supabase.from('contas_pagar').insert(payload);
    } else {
      const payload: Array<Partial<ContaReceberExtendida>> = Array.from({ length: parcelas }, (_, i) => {
        const vencimento = addMonthsToDate(form.vencimento, i);
        const { ano, mes } = getAnoMes(vencimento);
        const parcelaAtual = i + 1;
        return {
          cliente_nome: form.cliente_nome || 'Cliente avulso',
          descricao:
            parcelas > 1
              ? `${form.descricao} - Parcela ${parcelaAtual}/${parcelas}`
              : form.descricao,
          valor,
          vencimento,
          status: form.statusReceber,
          ano,
          mes,
          centro_custo: form.centro_custo,
        };
      });

      await supabase.from('contas_receber').insert(payload);
    }

    setShowModal(false);
    resetForm();
    fetchFinanceiro();
  };

  const aplicarPreenchimento = async (centro: CentroCusto) => {
    const baseDate = `${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}-05`;
    const payload: Array<Partial<ContaPagarExtendida>> = PRESETS_DESPESAS[centro].map((item, index) => {
      const vencimento = `${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}-${String(5 + index).padStart(2, '0')}`;
      return {
        descricao: item.descricao,
        categoria: item.categoria,
        valor: item.valor,
        vencimento,
        status: 'Pendente',
        ano: anoSelecionado,
        mes: mesSelecionado,
        centro_custo: centro,
        recorrente: false,
        parcela_atual: 1,
        total_parcelas: 1,
      };
    });

    await supabase.from('contas_pagar').insert(payload);
    setShowPresetModal(false);
    fetchFinanceiro();
  };

  const YearSelector = () => (
    <div className="relative">
      <select
        value={anoSelecionado}
        onChange={(e) => setAnoSelecionado(Number(e.target.value))}
        className="appearance-none pl-4 pr-10 h-10 text-sm font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 shadow-sm"
      >
        {ANOS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
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
          ] as Array<{ key: MainTab; label: string }>).map((t) => (
            <button
              key={t.key}
              onClick={() => setMainTab(t.key)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                mainTab === t.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPresetModal(true)}
            className="h-10 px-4 rounded-lg bg-amber-500 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-amber-600 transition"
          >
            <Sparkles className="w-4 h-4" />
            Pré-preenchimento
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-4 rounded-lg bg-sky-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-sky-700 transition"
          >
            <Plus className="w-4 h-4" />
            Adicionar lançamento
          </button>

          <YearSelector />
        </div>
      </div>

      {mainTab === 'mensal' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(Number(e.target.value))}
                className="appearance-none pl-4 pr-10 h-10 text-sm font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 shadow-sm"
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-sm text-slate-400 font-medium">{anoSelecionado}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Entradas</p>
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-sky-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{fmt(resumoMensal.faturamento)}</p>
              <p className="text-xs text-slate-400 mt-1">{MESES[mesSelecionado - 1]}/{anoSelecionado}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saídas</p>
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500">{fmt(resumoMensal.custos)}</p>
              <p className="text-xs text-slate-400 mt-1">Contas do mês</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo</p>
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${resumoMensal.saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {fmt(resumoMensal.saldo)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Entradas - saídas</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Qtd. Lançamentos</p>
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{contasPagarMes.length + contasReceberMes.length}</p>
              <p className="text-xs text-slate-400 mt-1">No mês selecionado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Fluxo de Caixa do Mês</h3>
              </div>
              <div className="p-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fluxoCaixaMes}>
                      <defs>
                        <linearGradient id="entGradMensal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="saiGradMensal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtShort} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#0ea5e9" fill="url(#entGradMensal)" strokeWidth={2} />
                      <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#f43f5e" fill="url(#saiGradMensal)" strokeWidth={2} />
                      <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Despesas por Centro</h3>
              </div>
              <div className="p-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={despesasPorCentroMes}
                        dataKey="valor"
                        nameKey="centro"
                        outerRadius={95}
                        innerRadius={50}
                        paddingAngle={3}
                      >
                        {despesasPorCentroMes.map((_, index) => (
                          <Cell key={index} fill={CORES_CENTROS[index % CORES_CENTROS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex gap-1 px-5 pt-4 pb-0 border-b border-slate-100 flex-wrap">
              {([
                { key: 'pagar', label: 'Contas a Pagar' },
                { key: 'receber', label: 'Contas a Receber' },
                { key: 'fluxo', label: 'Receitas x Despesas por Centro' },
                { key: 'centros', label: 'Resumo por Centro' },
              ] as Array<{ key: SubTab; label: string }>).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSubTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                    subTab === t.key
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
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
                      {['Descrição', 'Centro', 'Categoria', 'Vencimento', 'Valor', 'Status'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contasPagarMes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-800 font-medium">{c.descricao}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-xs">
                            {c.centro_custo ?? 'Gráfica Itu'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                            {c.categoria}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(`${c.vencimento}T00:00:00`).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{fmt(c.valor)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusPagarConfig[c.status]}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {contasPagarMes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                          Nenhuma conta a pagar no mês selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {subTab === 'receber' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Cliente', 'Descrição', 'Centro', 'Vencimento', 'Valor', 'Status'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contasReceberMes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-800 font-medium">{c.cliente_nome}</td>
                        <td className="px-5 py-3 text-slate-500">{c.descricao}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                            {c.centro_custo ?? 'Gráfica Itu'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(`${c.vencimento}T00:00:00`).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{fmt(c.valor)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusReceberConfig[c.status]}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {contasReceberMes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                          Nenhuma conta a receber no mês selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {subTab === 'fluxo' && (
              <div className="p-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={centroComparativoMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="centro" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtShort} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="saldo" name="Saldo" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {subTab === 'centros' && (
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {centroComparativoMes.map((item) => (
                    <div key={item.centro} className="rounded-xl border border-slate-200 p-4">
                      <h4 className="font-semibold text-slate-800 mb-4">{item.centro}</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Receitas</span>
                          <span className="font-semibold text-emerald-600">{fmt(item.receitas)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Despesas</span>
                          <span className="font-semibold text-red-500">{fmt(item.despesas)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Saldo</span>
                          <span className={`font-semibold ${item.saldo >= 0 ? 'text-sky-600' : 'text-red-500'}`}>
                            {fmt(item.saldo)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Entradas Acumuladas</p>
              <p className="text-2xl font-bold text-slate-800">{fmt(totalFaturamento)}</p>
              <p className="text-xs text-slate-400 mt-1">Jan — Dez {anoSelecionado}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Saídas Acumuladas</p>
              <p className="text-2xl font-bold text-red-500">{fmt(totalCustos)}</p>
              <p className="text-xs text-slate-400 mt-1">Despesas registradas no ano</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Resultado Acumulado</p>
              <p className={`text-2xl font-bold ${totalLucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {fmt(totalLucro)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Margem média {margemMedia.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Entradas x Saídas x Resultado por Mês</h3>
            </div>
            <div className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosAnuais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtShort} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="faturamento" name="Entradas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="custos" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lucro" name="Resultado" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Detalhamento Anual por Mês</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {['Mês', 'Entradas', 'Saídas', 'Resultado', 'Margem'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dadosAnuais.map((d) => (
                    <tr key={d.mesNum} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700">{MESES[d.mesNum - 1]}</td>
                      <td className="px-5 py-3 text-slate-800 font-semibold">{fmt(d.faturamento)}</td>
                      <td className="px-5 py-3 text-red-500">{fmt(d.custos)}</td>
                      <td className={`px-5 py-3 font-semibold ${d.lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmt(d.lucro)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {d.faturamento > 0 ? `${((d.lucro / d.faturamento) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-5 py-3 text-slate-700">Total</td>
                    <td className="px-5 py-3 text-sky-600">{fmt(totalFaturamento)}</td>
                    <td className="px-5 py-3 text-red-500">{fmt(totalCustos)}</td>
                    <td className={`px-5 py-3 ${totalLucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(totalLucro)}</td>
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
          <div className="flex flex-wrap gap-2">
            {TRIMESTRES.map((tri) => (
              <button
                key={tri.key}
                onClick={() => setTrimestreSelecionado(tri.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  trimestreSelecionado === tri.key
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300'
                }`}
              >
                {tri.key} - {tri.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-sky-500" />
                <h3 className="font-semibold text-slate-800">
                  Metas do {trimestreSelecionado} - {anoSelecionado}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-2">
                    Meta de faturamento
                  </label>
                  <input
                    type="number"
                    value={metas[trimestreSelecionado].metaFaturamento}
                    onChange={(e) =>
                      salvarMetas({
                        ...metas,
                        [trimestreSelecionado]: {
                          ...metas[trimestreSelecionado],
                          metaFaturamento: Number(e.target.value || 0),
                        },
                      })
                    }
                    className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-2">
                    Meta de redução de custos (%)
                  </label>
                  <input
                    type="number"
                    value={metas[trimestreSelecionado].metaReducaoCustos}
                    onChange={(e) =>
                      salvarMetas({
                        ...metas,
                        [trimestreSelecionado]: {
                          ...metas[trimestreSelecionado],
                          metaReducaoCustos: Number(e.target.value || 0),
                        },
                      })
                    }
                    className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Faturamento realizado</span>
                    <span className="text-sm font-bold text-slate-800">{fmt(realizadoTrimestre.faturamento)}</span>
                  </div>
                  <ProgressBar
                    value={realizadoTrimestre.faturamento}
                    max={metas[trimestreSelecionado].metaFaturamento}
                    color="bg-sky-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Meta: {fmt(metas[trimestreSelecionado].metaFaturamento)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Redução / margem atual</span>
                    <span className="text-sm font-bold text-slate-800">
                      {realizadoTrimestre.reducaoCustos.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={realizadoTrimestre.reducaoCustos}
                    max={metas[trimestreSelecionado].metaReducaoCustos}
                    color="bg-emerald-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Meta: {metas[trimestreSelecionado].metaReducaoCustos}%
                  </p>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <Save className="w-4 h-4" />
                Metas salvas automaticamente
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Resumo do trimestre</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Período</p>
                  <p className="font-semibold text-slate-800">
                    {trimestreAtual.meses.map((m) => MESES[m - 1].slice(0, 3)).join(' / ')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Entradas</p>
                  <p className="font-semibold text-emerald-600">{fmt(realizadoTrimestre.faturamento)}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Saídas</p>
                  <p className="font-semibold text-red-500">{fmt(realizadoTrimestre.custos)}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Resultado</p>
                  <p className={`font-semibold ${(realizadoTrimestre.faturamento - realizadoTrimestre.custos) >= 0 ? 'text-sky-600' : 'text-red-500'}`}>
                    {fmt(realizadoTrimestre.faturamento - realizadoTrimestre.custos)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {metasAno.map((q) => {
              const pctFat =
                q.metaFaturamento > 0
                  ? Math.min((q.realizadoFaturamento / q.metaFaturamento) * 100, 100)
                  : 0;
              const pctCust =
                q.metaReducaoCustos > 0
                  ? Math.min((q.realizadoReducaoCustos / q.metaReducaoCustos) * 100, 100)
                  : 0;

              return (
                <div key={q.trimestre} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-lg font-bold text-slate-800">{q.trimestre}</span>
                      <p className="text-xs text-slate-400">{q.periodo}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                      {q.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-slate-500">Faturamento</p>
                        <span className="text-xs font-bold text-sky-600">{pctFat.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={q.realizadoFaturamento} max={q.metaFaturamento} color="bg-sky-500" />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Meta: {fmt(q.metaFaturamento)}</span>
                        <span>{fmt(q.realizadoFaturamento)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-slate-500">Redução / margem</p>
                        <span className="text-xs font-bold text-emerald-600">{pctCust.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={q.realizadoReducaoCustos} max={q.metaReducaoCustos} color="bg-emerald-500" />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Meta: {q.metaReducaoCustos}%</span>
                        <span>{q.realizadoReducaoCustos}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-500" />
              <h3 className="font-semibold text-slate-800">Meta x Realizado por Trimestre</h3>
            </div>
            <div className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metasAno}>
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Adicionar lançamento financeiro</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoLancamento })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="pagar">Despesa / Conta a pagar</option>
                  <option value="receber">Receita / Conta a receber</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Centro</label>
                <select
                  value={form.centro_custo}
                  onChange={(e) => setForm({ ...form, centro_custo: e.target.value as CentroCusto })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {CENTROS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {form.tipo === 'receber' && (
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-2">Cliente</label>
                  <input
                    value={form.cliente_nome}
                    onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                    className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Nome do cliente"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Descrição</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: Aluguel, venda, energia..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Categoria</label>
                <input
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex: Fixo, Serviços, Insumos"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Valor</label>
                <input
                  type="number"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Vencimento</label>
                <input
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Status</label>
                <select
                  value={form.tipo === 'pagar' ? form.statusPagar : form.statusReceber}
                  onChange={(e) =>
                    form.tipo === 'pagar'
                      ? setForm({ ...form, statusPagar: e.target.value as FormState['statusPagar'] })
                      : setForm({ ...form, statusReceber: e.target.value as FormState['statusReceber'] })
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {form.tipo === 'pagar' ? (
                    <>
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                      <option value="Vencido">Vencido</option>
                    </>
                  ) : (
                    <>
                      <option value="Pendente">Pendente</option>
                      <option value="Recebido">Recebido</option>
                      <option value="Vencido">Vencido</option>
                    </>
                  )}
                </select>
              </div>

              <div className="md:col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Despesa ou receita recorrente</p>
                    <p className="text-xs text-slate-500">
                      Exemplo: Parcela 1 de 5 já cria os próximos meses automaticamente
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.recorrente}
                      onChange={(e) => setForm({ ...form, recorrente: e.target.checked, totalParcelas: e.target.checked ? 2 : 1 })}
                    />
                    Ativar recorrência
                  </label>
                </div>

                {form.recorrente && (
                  <div className="mt-4 max-w-xs">
                    <label className="text-sm font-medium text-slate-600 block mb-2">Quantidade de parcelas</label>
                    <input
                      type="number"
                      min={2}
                      value={form.totalParcelas}
                      onChange={(e) => setForm({ ...form, totalParcelas: Math.max(2, Number(e.target.value || 2)) })}
                      className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="h-10 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarLancamento}
                className="h-10 px-4 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
              >
                Salvar lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Pré-preenchimento financeiro</h3>
              <button onClick={() => setShowPresetModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Escolha qual bloco quer lançar automaticamente no mês de{' '}
                <strong>{MESES[mesSelecionado - 1]}/{anoSelecionado}</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CENTROS.map((centro) => (
                  <button
                    key={centro}
                    onClick={() => aplicarPreenchimento(centro)}
                    className="rounded-xl border border-slate-200 p-4 text-left hover:border-sky-400 hover:bg-sky-50 transition"
                  >
                    <p className="font-semibold text-slate-800">{centro}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Inserir contas padrão deste grupo
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPresetModal(false)}
                className="h-10 px-4 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-sm text-slate-400">Carregando financeiro...</div>
      )}
    </div>
  );
}
