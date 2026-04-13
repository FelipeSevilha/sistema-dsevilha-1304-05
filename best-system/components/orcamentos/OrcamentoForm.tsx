'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrcamentoItem {
  id: string | number;
  descricao: string;
  quantidade: number;
  valorUnit: number;
}

interface OrcamentoFormData {
  id?: string;
  numero: string;
  cliente: string;
  produto: string;
  itens: OrcamentoItem[];
  valor: number;
  criacao: string;
  validade: string;
  status: string;
  obs: string;
}

interface OrcamentoFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<OrcamentoFormData, 'id'>) => void;
  orcamento?: OrcamentoFormData | null;
  nextNumero: string;
}

interface ClienteOpt {
  id: number;
  nome_fantasia: string;
  cnpj: string;
}

interface ProdutoOpt {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  ativo: boolean;
}

const EMPTY_ITEM: Omit<OrcamentoItem, 'id'> = { descricao: '', quantidade: 1, valorUnit: 0 };

export default function OrcamentoForm({ open, onClose, onSave, orcamento, nextNumero }: OrcamentoFormProps) {
  const [cliente, setCliente] = useState('');
  const [validade, setValidade] = useState('');
  const [obs, setObs] = useState('');
  const [itens, setItens] = useState<OrcamentoItem[]>([{ id: 1, ...EMPTY_ITEM }]);
  const [clientes, setClientes] = useState<ClienteOpt[]>([]);
  const [produtos, setProdutos] = useState<ProdutoOpt[]>([]);
  const [autocomplete, setAutocomplete] = useState<{ itemId: string | number; suggestions: ProdutoOpt[] } | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: cls }, { data: prods }] = await Promise.all([
        supabase.from('clientes').select('id, nome_fantasia, cnpj').eq('ativo', true).order('nome_fantasia'),
        supabase.from('produtos').select('id, nome, categoria, preco, ativo').eq('ativo', true).order('nome'),
      ]);
      if (cls) setClientes(cls);
      if (prods) setProdutos(prods);
    })();
  }, [open]);

  useEffect(() => {
    if (orcamento) {
      setCliente(orcamento.cliente);
      setValidade(orcamento.validade);
      setObs(orcamento.obs);
      setItens(orcamento.itens.length > 0 ? orcamento.itens : [{ id: 1, ...EMPTY_ITEM }]);
    } else {
      setCliente('');
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setValidade(d.toISOString().slice(0, 10));
      setObs('');
      setItens([{ id: 1, ...EMPTY_ITEM }]);
    }
  }, [orcamento, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setAutocomplete(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDescricaoChange = (itemId: string | number, value: string) => {
    updateItem(itemId, 'descricao', value);
    if (value.trim().length >= 1) {
      const suggestions = produtos.filter(p => p.nome.toLowerCase().includes(value.toLowerCase())).slice(0, 6);
      setAutocomplete(suggestions.length > 0 ? { itemId, suggestions } : null);
    } else {
      setAutocomplete(null);
    }
  };

  const handleSelectSuggestion = (itemId: string | number, produto: ProdutoOpt) => {
    updateItem(itemId, 'descricao', produto.nome);
    updateItem(itemId, 'valorUnit', produto.preco);
    setAutocomplete(null);
  };

  const total = itens.reduce((s, i) => s + i.quantidade * i.valorUnit, 0);

  const addItem = () => {
    setItens(prev => [...prev, { id: Date.now(), ...EMPTY_ITEM }]);
  };

  const removeItem = (id: string | number) => {
    if (itens.length === 1) return;
    setItens(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string | number, field: keyof OrcamentoItem, value: string | number) => {
    setItens(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || itens.some(i => !i.descricao)) return;

    const numero = nextNumero;
    const produtoLabel = itens.length === 1 ? itens[0].descricao : `${itens[0].descricao} + ${itens.length - 1} item(ns)`;

    onSave({
      numero,
      cliente,
      produto: produtoLabel,
      itens,
      valor: total,
      criacao: new Date().toISOString().slice(0, 10),
      validade,
      status: 'Aguardando',
      obs,
    });
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-semibold text-slate-800 text-base">{orcamento ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Nº {nextNumero}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cliente *</label>
                <select
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.nome_fantasia}>{c.nome_fantasia} — {c.cnpj}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Validade *</label>
                <input
                  type="date"
                  value={validade}
                  onChange={e => setValidade(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600">Itens do Orçamento *</label>
                <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Adicionar item
                </button>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Descrição</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-20">Qtd</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-28">Valor Unit.</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-28">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.map(item => (
                      <tr key={item.id}>
                        <td className="px-2 py-1.5">
                          <div className="relative" ref={autocomplete?.itemId === item.id ? autocompleteRef : undefined}>
                            <input
                              value={item.descricao}
                              onChange={e => handleDescricaoChange(item.id, e.target.value)}
                              onFocus={() => {
                                if (item.descricao.trim().length >= 1) {
                                  const suggestions = produtos.filter(p => p.nome.toLowerCase().includes(item.descricao.toLowerCase())).slice(0, 6);
                                  if (suggestions.length > 0) setAutocomplete({ itemId: item.id, suggestions });
                                }
                              }}
                              placeholder="Descrição do produto/serviço"
                              required
                              className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
                            />
                            {autocomplete?.itemId === item.id && autocomplete.suggestions.length > 0 && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                                {autocomplete.suggestions.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onMouseDown={() => handleSelectSuggestion(item.id, p)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-0"
                                  >
                                    <span className="font-medium text-slate-800">{p.nome}</span>
                                    <span className="ml-2 text-slate-400">{p.categoria}</span>
                                    <span className="float-right text-sky-600 font-semibold">
                                      {fmt(p.preco)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={1}
                            value={item.quantidade}
                            onChange={e => updateItem(item.id, 'quantidade', Number(e.target.value))}
                            className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.valorUnit}
                            onChange={e => updateItem(item.id, 'valorUnit', Number(e.target.value))}
                            className="w-full h-8 px-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-400"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-xs font-medium text-slate-700">
                          {fmt(item.quantidade * item.valorUnit)}
                        </td>
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => removeItem(item.id)} disabled={itens.length === 1} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 px-3 py-2 flex justify-end border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-800">Total: {fmt(total)}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Observações</label>
              <textarea
                value={obs}
                onChange={e => setObs(e.target.value)}
                rows={3}
                placeholder="Condições de pagamento, prazo de entrega, observações gerais..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 resize-none"
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="px-5 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
          >
            {orcamento ? 'Salvar Alterações' : 'Criar Orçamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
