'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
interface ProdutoData {
  id?: string;
  nome: string;
  categoria: string;
  descricao: string;
  custo: number;
  preco: number;
  margem: number;
  unidade: string;
  ativo: boolean;
}

interface ProdutoFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<ProdutoData, 'id'>) => void;
  produto?: ProdutoData | null;
}

const CATEGORIAS = ['Folders', 'Catálogos', 'Banners', 'Cartões', 'Flyers', 'Agendas', 'Embalagens', 'Adesivos', 'Outros'];
const UNIDADES = ['unid', 'm²', 'metro', 'cento', 'milhar'];

export default function ProdutoForm({ open, onClose, onSave, produto }: ProdutoFormProps) {
  const [form, setForm] = useState({
    nome: '',
    categoria: 'Folders',
    custo: '',
    preco: '',
    unidade: 'unid',
    descricao: '',
    ativo: true,
  });

  useEffect(() => {
    if (produto) {
      setForm({
        nome: produto.nome,
        categoria: produto.categoria,
        custo: String(produto.custo),
        preco: String(produto.preco),
        unidade: produto.unidade,
        descricao: produto.descricao ?? '',
        ativo: produto.ativo,
      });
    } else {
      setForm({ nome: '', categoria: 'Folders', custo: '', preco: '', unidade: 'unid', descricao: '', ativo: true });
    }
  }, [produto, open]);

  const custo = parseFloat(form.custo) || 0;
  const preco = parseFloat(form.preco) || 0;
  const margem = preco > 0 ? ((preco - custo) / preco) * 100 : 0;

  const set = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.custo || !form.preco) return;
    onSave({
      nome: form.nome,
      categoria: form.categoria,
      custo,
      preco,
      margem: parseFloat(margem.toFixed(1)),
      unidade: form.unidade,
      descricao: form.descricao,
      ativo: form.ativo,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 text-base">{produto ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome do Produto *</label>
            <input
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Folder A4 - 4x4 cores"
              required
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoria *</label>
              <select
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
              >
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unidade</label>
              <select
                value={form.unidade}
                onChange={e => set('unidade', e.target.value)}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
              >
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Custo Unitário (R$) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.custo}
                onChange={e => set('custo', e.target.value)}
                placeholder="0,00"
                required
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Preço de Venda (R$) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.preco}
                onChange={e => set('preco', e.target.value)}
                placeholder="0,00"
                required
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
              />
            </div>
          </div>

          {(custo > 0 || preco > 0) && (
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Margem calculada</span>
              <span className={`text-sm font-bold ${margem >= 50 ? 'text-emerald-600' : margem >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                {margem.toFixed(1)}%
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              rows={3}
              placeholder="Especificações técnicas, materiais, acabamento..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Produto ativo</p>
              <p className="text-xs text-slate-400">Aparece na lista de produtos para venda</p>
            </div>
            <button
              type="button"
              onClick={() => set('ativo', !form.ativo)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.ativo ? 'bg-sky-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.ativo ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="px-5 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
          >
            {produto ? 'Salvar Alterações' : 'Criar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
}
