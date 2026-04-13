'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface EstoqueItem {
  id: string;
  item: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  estoqueMinimo: number;
  fornecedor: string;
  valorUnit: number;
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<EstoqueItem, 'id' | 'status'>) => void;
  item: EstoqueItem | null;
  mode?: 'edit' | 'qty';
}

const CATEGORIAS = ['Papel', 'Tinta', 'Substrato', 'Acabamento', 'Outros'];
const UNIDADES = ['Resmas', 'Litros', 'Metros', 'Unid', 'Cones', 'Kg', 'Caixas'];
const inputCls = 'w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700';

function calcStatus(quantidade: number, estoqueMinimo: number): string {
  if (quantidade === 0) return 'Crítico';
  if (quantidade < estoqueMinimo * 0.5) return 'Crítico';
  if (quantidade < estoqueMinimo) return 'Baixo';
  return 'Normal';
}

export default function EstoqueItemForm({ open, onClose, onSave, item, mode = 'edit' }: Props) {
  const [form, setForm] = useState({
    item: '',
    categoria: 'Papel',
    quantidade: '',
    unidade: 'Resmas',
    estoqueMinimo: '',
    fornecedor: '',
    valorUnit: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        item: item.item,
        categoria: item.categoria,
        quantidade: String(item.quantidade),
        unidade: item.unidade,
        estoqueMinimo: String(item.estoqueMinimo),
        fornecedor: item.fornecedor,
        valorUnit: String(item.valorUnit),
      });
    } else {
      setForm({ item: '', categoria: 'Papel', quantidade: '', unidade: 'Resmas', estoqueMinimo: '', fornecedor: '', valorUnit: '' });
    }
    setError('');
  }, [item, open]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.item.trim() || !form.quantidade || !form.estoqueMinimo) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    onSave({
      item: form.item,
      categoria: form.categoria,
      quantidade: Number(form.quantidade),
      unidade: form.unidade,
      estoqueMinimo: Number(form.estoqueMinimo),
      fornecedor: form.fornecedor,
      valorUnit: Number(form.valorUnit),
    });
  };

  if (!open) return null;

  const isQtyMode = mode === 'qty';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">
            {isQtyMode ? 'Atualizar Quantidade' : item ? 'Editar Item' : 'Novo Item de Estoque'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {!isQtyMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome do Item *</label>
                <input value={form.item} onChange={e => set('item', e.target.value)} placeholder="Ex: Papel Couchê 150g A4" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoria</label>
                  <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={inputCls}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unidade</label>
                  <select value={form.unidade} onChange={e => set('unidade', e.target.value)} className={inputCls}>
                    {UNIDADES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fornecedor</label>
                <input value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)} placeholder="Nome do fornecedor" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valor Unitário (R$)</label>
                <input type="number" min={0} step={0.01} value={form.valorUnit} onChange={e => set('valorUnit', e.target.value)} placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estoque Mínimo *</label>
                <input type="number" min={0} value={form.estoqueMinimo} onChange={e => set('estoqueMinimo', e.target.value)} placeholder="0" className={inputCls} />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Quantidade atual *</label>
            <input type="number" min={0} value={form.quantidade} onChange={e => set('quantidade', e.target.value)} placeholder="0" className={inputCls} />
          </div>
          {form.quantidade && form.estoqueMinimo && !isQtyMode && (
            <div className={`text-xs px-3 py-2 rounded-lg font-medium ${
              calcStatus(Number(form.quantidade), Number(form.estoqueMinimo)) === 'Crítico' ? 'bg-red-50 text-red-600' :
              calcStatus(Number(form.quantidade), Number(form.estoqueMinimo)) === 'Baixo' ? 'bg-amber-50 text-amber-600' :
              'bg-emerald-50 text-emerald-600'
            }`}>
              Status calculado: {calcStatus(Number(form.quantidade), Number(form.estoqueMinimo))}
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium">
            {isQtyMode ? 'Atualizar' : item ? 'Salvar' : 'Criar Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
