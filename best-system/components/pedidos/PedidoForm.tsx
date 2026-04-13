'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { supabase, Pedido, Orcamento } from '@/lib/supabase';

const STATUS_OPTIONS = [
  'Aguardando',
  'Em Andamento',
  'Em Produção',
  'Em Acabamento',
  'Pronto',
  'Entregue',
  'Atrasado',
  'Cancelado',
];

interface PedidoFormProps {
  pedido?: Pedido | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  cliente_nome: string;
  produto: string;
  quantidade: string;
  valor: string;
  status: string;
  prazo: string;
  observacoes: string;
  orcamento_id: string;
  orcamento_numero: string;
}

export default function PedidoForm({ pedido, onClose, onSaved }: PedidoFormProps) {
  const isEdit = !!pedido;
  const [form, setForm] = useState<FormState>({
    cliente_nome: pedido?.cliente_nome ?? '',
    produto: pedido?.produto ?? '',
    quantidade: pedido ? String(pedido.quantidade) : '1',
    valor: pedido ? String(pedido.valor) : '',
    status: pedido?.status ?? 'Aguardando',
    prazo: pedido?.prazo ?? '',
    observacoes: pedido?.observacoes ?? '',
    orcamento_id: pedido?.orcamento_id ?? '',
    orcamento_numero: pedido?.orcamento_numero ?? '',
  });

  const [orcamentos, setOrcamentos] = useState<Pick<Orcamento, 'id' | 'numero' | 'cliente_nome' | 'valor_total' | 'status' | 'observacoes' | 'created_at'>[]>([]);
  const [orcSearch, setOrcSearch] = useState('');
  const [showOrcSelector, setShowOrcSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('orcamentos')
      .select('id, numero, cliente_nome, valor_total, status, observacoes, created_at')
      .in('status', ['Aprovado', 'Aguardando'])
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setOrcamentos(data); });
  }, []);

  const filteredOrcs = orcamentos.filter(o =>
    o.numero.toLowerCase().includes(orcSearch.toLowerCase()) ||
    o.cliente_nome.toLowerCase().includes(orcSearch.toLowerCase())
  );

  const handleSelectOrcamento = (o: Pick<Orcamento, 'id' | 'numero' | 'cliente_nome' | 'valor_total' | 'status' | 'observacoes' | 'created_at'>) => {
    setForm(prev => ({
      ...prev,
      cliente_nome: o.cliente_nome,
      valor: String(o.valor_total),
      orcamento_id: o.id,
      orcamento_numero: o.numero,
      observacoes: prev.observacoes || `Gerado do orçamento ${o.numero}`,
    }));
    setShowOrcSelector(false);
    setOrcSearch('');
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_nome.trim()) { setError('Nome do cliente é obrigatório.'); return; }
    if (!form.produto.trim()) { setError('Produto / descrição é obrigatório.'); return; }
    if (!form.valor || isNaN(parseFloat(form.valor))) { setError('Valor inválido.'); return; }

    setSaving(true);
    setError('');

    const payload = {
      cliente_nome: form.cliente_nome.trim(),
      produto: form.produto.trim(),
      quantidade: parseInt(form.quantidade) || 1,
      valor: parseFloat(form.valor),
      status: form.status,
      prazo: form.prazo || null,
      observacoes: form.observacoes.trim(),
      orcamento_id: form.orcamento_id || null,
      orcamento_numero: form.orcamento_numero || '',
    };

    if (isEdit && pedido) {
      const { error: err } = await supabase.from('pedidos').update(payload).eq('id', pedido.id);
      if (err) { setError('Erro ao salvar pedido.'); setSaving(false); return; }
    } else {
      const { data: maxPed } = await supabase
        .from('pedidos')
        .select('numero')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastNum = maxPed?.numero ? parseInt(maxPed.numero.replace('#P-', ''), 10) : 1000;
      const numero = `#P-${String(lastNum + 1).padStart(4, '0')}`;

      const { error: err } = await supabase.from('pedidos').insert({ ...payload, numero });
      if (err) { setError('Erro ao criar pedido.'); setSaving(false); return; }

      if (form.orcamento_id) {
        await supabase.from('orcamentos').update({ status: 'Convertido' }).eq('id', form.orcamento_id);
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-slate-800 text-lg">{isEdit ? 'Editar Pedido' : 'Novo Pedido'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Editando ${pedido?.numero}` : 'Preencha os dados do pedido'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Orçamento vinculado (opcional)</label>
            {form.orcamento_numero ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 text-sm bg-sky-50 border border-sky-200 rounded-lg text-sky-700 font-mono font-medium">
                  {form.orcamento_numero}
                </span>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, orcamento_id: '', orcamento_numero: '' }))}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg hover:border-red-200 transition-colors"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOrcSelector(v => !v)}
                  className="w-full text-left px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-400 hover:border-sky-300 hover:bg-sky-50 transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Buscar orçamento...
                </button>
                {showOrcSelector && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <input
                        autoFocus
                        value={orcSearch}
                        onChange={e => setOrcSearch(e.target.value)}
                        placeholder="Buscar por número ou cliente..."
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredOrcs.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">Nenhum orçamento encontrado.</p>
                      ) : filteredOrcs.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => handleSelectOrcamento(o)}
                          className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors flex items-center justify-between gap-3 border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <span className="font-mono text-xs text-sky-600 font-semibold">{o.numero}</span>
                            <span className="ml-2 text-xs text-slate-500">{o.cliente_nome}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-700 flex-shrink-0">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.valor_total)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cliente *</label>
              <input
                value={form.cliente_nome}
                onChange={e => handleChange('cliente_nome', e.target.value)}
                placeholder="Nome do cliente"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Produto / Descrição *</label>
              <input
                value={form.produto}
                onChange={e => handleChange('produto', e.target.value)}
                placeholder="Descrição do produto ou serviço"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Quantidade *</label>
              <input
                type="number"
                min="1"
                value={form.quantidade}
                onChange={e => handleChange('quantidade', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valor (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={e => handleChange('valor', e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prazo de entrega</label>
              <input
                type="date"
                value={form.prazo}
                onChange={e => handleChange('prazo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Observações</label>
              <textarea
                rows={3}
                value={form.observacoes}
                onChange={e => handleChange('observacoes', e.target.value)}
                placeholder="Informações adicionais..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
