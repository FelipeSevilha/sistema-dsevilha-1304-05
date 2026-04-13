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

  const totalCustos
