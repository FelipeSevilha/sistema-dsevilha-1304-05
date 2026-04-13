'use client';

import { useState, useEffect } from 'react';
import { X, Search, MapPin, Building2, User, Phone, Mail, FileText, Info, Loader as Loader2 } from 'lucide-react';
interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ie: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  contato: string;
  telefone: string;
  email: string;
  setor: string;
  obs: string;
  ativo: boolean;
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const SETORES = [
  'Alimentação','Automotivo','Construção Civil','Educação','Governo',
  'Indústria','Saúde','Serviços','Tecnologia','Varejo','Outro',
];

type ClienteFormData = Omit<Cliente, 'id'>;

const emptyForm: ClienteFormData = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  ie: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: 'SP',
  contato: '',
  telefone: '',
  email: '',
  setor: '',
  obs: '',
  ativo: true,
};

interface Props {
  open: boolean;
  cliente: Cliente | null;
  onClose: () => void;
  onSave: (data: ClienteFormData) => void;
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400';

const MOCK_CNPJ_DB: Record<string, Partial<ClienteFormData>> = {
  '11': { razaoSocial: 'Papelaria Central Ltda', nomeFantasia: 'Papelaria Central', endereco: 'Av. Paulista', numero: '1500', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', ie: '110.042.490.114' },
  '22': { razaoSocial: 'Gráfica Norte S/A', nomeFantasia: 'Gráfica Norte', endereco: 'Rua das Flores', numero: '320', bairro: 'Centro', cidade: 'Manaus', uf: 'AM', ie: '04.456.823-9' },
  '33': { razaoSocial: 'Distribuidora Sul Impressos ME', nomeFantasia: 'Sul Impressos', endereco: 'Rua Garibaldi', numero: '88', bairro: 'Boa Vista', cidade: 'Porto Alegre', uf: 'RS', ie: '096/3842085' },
  '44': { razaoSocial: 'Editora Horizonte Ltda', nomeFantasia: 'Horizonte', endereco: 'Rua das Acácias', numero: '200', bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG', ie: '0622462870073' },
  '55': { razaoSocial: 'Comunicação Visual Rápida Eireli', nomeFantasia: 'CVR Comunicação', endereco: 'Av. Domingos Ferreira', numero: '1200', bairro: 'Boa Viagem', cidade: 'Recife', uf: 'PE', ie: '8304325-81' },
};

const MOCK_CEP_DB: Record<string, Partial<ClienteFormData>> = {
  '01310': { endereco: 'Av. Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' },
  '01001': { endereco: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' },
  '20040': { endereco: 'Av. Rio Branco', bairro: 'Centro', cidade: 'Rio de Janeiro', uf: 'RJ' },
  '30130': { endereco: 'Av. Afonso Pena', bairro: 'Centro', cidade: 'Belo Horizonte', uf: 'MG' },
  '80010': { endereco: 'Rua XV de Novembro', bairro: 'Centro', cidade: 'Curitiba', uf: 'PR' },
  '90010': { endereco: 'Av. Borges de Medeiros', bairro: 'Centro Histórico', cidade: 'Porto Alegre', uf: 'RS' },
  '40010': { endereco: 'Praça Municipal', bairro: 'Centro', cidade: 'Salvador', uf: 'BA' },
  '60060': { endereco: 'Av. Santos Dumont', bairro: 'Centro', cidade: 'Fortaleza', uf: 'CE' },
  '69010': { endereco: 'Av. Eduardo Ribeiro', bairro: 'Centro', cidade: 'Manaus', uf: 'AM' },
  '50010': { endereco: 'Rua do Sol', bairro: 'Santo Antônio', cidade: 'Recife', uf: 'PE' },
};

export default function ClienteDrawer({ open, cliente, onClose, onSave }: Props) {
  const [form, setForm] = useState<ClienteFormData>(emptyForm);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ClienteFormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(cliente ? { ...cliente } : emptyForm);
      setErrors({});
    }
  }, [open, cliente]);

  const set = (field: keyof ClienteFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleCnpjSearch = async () => {
    const cnpj = form.cnpj.replace(/\D/g, '');
    if (cnpj.length < 2) return;
    setCnpjLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const prefix = cnpj.slice(0, 2);
    const match = MOCK_CNPJ_DB[prefix];
    if (match) {
      setForm(prev => ({ ...prev, ...match }));
    } else {
      const names = ['Indústria Gráfica Modelo Ltda', 'Serviços de Impressão Digital Eireli', 'Comunicação Visual Express ME'];
      const bairros = ['Centro', 'Jardins', 'Vila Nova'];
      const cidades = ['São Paulo', 'Campinas', 'Ribeirão Preto'];
      const estados = ['SP', 'SP', 'SP'];
      const idx = parseInt(cnpj[0]) % 3;
      setForm(prev => ({
        ...prev,
        razaoSocial: names[idx],
        nomeFantasia: names[idx].split(' ').slice(0, 2).join(' '),
        bairro: bairros[idx],
        cidade: cidades[idx],
        uf: estados[idx],
      }));
    }
    setCnpjLoading(false);
  };

  const handleCepSearch = async () => {
    const cep = form.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const prefix = cep.slice(0, 5);
    const match = MOCK_CEP_DB[prefix];
    if (match) {
      setForm(prev => ({ ...prev, ...match }));
    } else {
      const ruas = ['Rua das Palmeiras', 'Av. Brasil', 'Rua Sete de Setembro', 'Av. Independência'];
      const bairros = ['Jardim América', 'Vila Industrial', 'Centro', 'Bela Vista'];
      const cidades = ['São Paulo', 'Guarulhos', 'Santo André', 'Osasco'];
      const idx = parseInt(cep[0]) % 4;
      setForm(prev => ({
        ...prev,
        endereco: ruas[idx],
        bairro: bairros[idx],
        cidade: cidades[idx],
        uf: 'SP',
      }));
    }
    setCepLoading(false);
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.razaoSocial.trim()) errs.razaoSocial = 'Campo obrigatório';
    if (!form.cnpj.trim()) errs.cnpj = 'Campo obrigatório';
    if (!form.contato.trim()) errs.contato = 'Campo obrigatório';
    if (!form.telefone.trim()) errs.telefone = 'Campo obrigatório';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'E-mail inválido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {cliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-xs text-slate-400">
                {cliente ? `ID #${cliente.id}` : 'Preencha os dados cadastrais'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-sky-100 rounded-md flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-sky-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Dados da Empresa</h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField label="Razão Social" required>
                  <input
                    value={form.razaoSocial}
                    onChange={e => set('razaoSocial', e.target.value)}
                    placeholder="Empresa Exemplo Ltda"
                    className={inputCls}
                  />
                  {errors.razaoSocial && <p className="text-xs text-red-500">{errors.razaoSocial}</p>}
                </FormField>

                <FormField label="Nome Fantasia">
                  <input
                    value={form.nomeFantasia}
                    onChange={e => set('nomeFantasia', e.target.value)}
                    placeholder="Empresa Exemplo"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="CNPJ" required>
                  <div className="flex gap-2">
                    <input
                      value={form.cnpj}
                      onChange={e => set('cnpj', e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={handleCnpjSearch}
                      disabled={cnpjLoading || form.cnpj.replace(/\D/g, '').length < 2}
                      className="flex items-center gap-1 px-2.5 h-9 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                      title="Consultar CNPJ (simulação SEFAZ)"
                    >
                      {cnpjLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.cnpj && <p className="text-xs text-red-500">{errors.cnpj}</p>}
                </FormField>

                <FormField label="Inscrição Estadual">
                  <input
                    value={form.ie}
                    onChange={e => set('ie', e.target.value)}
                    placeholder="000.000.000.000 ou Isento"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Setor">
                  <select
                    value={form.setor}
                    onChange={e => set('setor', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecione...</option>
                    {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                <FormField label="Status">
                  <div className="flex items-center gap-3 h-9">
                    <button
                      type="button"
                      onClick={() => set('ativo', !form.ativo)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.ativo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`text-sm font-medium ${form.ativo ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {form.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </FormField>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-sky-100 rounded-md flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-sky-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Endereço</h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <FormField label="CEP">
                <div className="flex gap-2">
                  <input
                    value={form.cep}
                    onChange={e => set('cep', formatCep(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleCepSearch}
                    disabled={cepLoading || form.cep.replace(/\D/g, '').length !== 8}
                    className="flex items-center gap-1.5 px-3 h-9 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {cepLoading ? 'Buscando...' : 'Buscar CEP'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Simulação ViaCEP — estruturado para integração real</p>
              </FormField>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <FormField label="Endereço">
                    <input
                      value={form.endereco}
                      onChange={e => set('endereco', e.target.value)}
                      placeholder="Rua / Av. / Praça"
                      className={inputCls}
                    />
                  </FormField>
                </div>
                <FormField label="Número">
                  <input
                    value={form.numero}
                    onChange={e => set('numero', e.target.value)}
                    placeholder="S/N"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Complemento">
                  <input
                    value={form.complemento}
                    onChange={e => set('complemento', e.target.value)}
                    placeholder="Sala, Andar, Bloco..."
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Bairro">
                  <input
                    value={form.bairro}
                    onChange={e => set('bairro', e.target.value)}
                    placeholder="Nome do bairro"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <FormField label="Cidade">
                    <input
                      value={form.cidade}
                      onChange={e => set('cidade', e.target.value)}
                      placeholder="Nome da cidade"
                      className={inputCls}
                    />
                  </FormField>
                </div>
                <FormField label="Estado">
                  <select
                    value={form.uf}
                    onChange={e => set('uf', e.target.value)}
                    className={inputCls}
                  >
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </FormField>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-sky-100 rounded-md flex items-center justify-center">
                  <User className="w-3 h-3 text-sky-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Contato</h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <FormField label="Nome do Contato" required>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={form.contato}
                    onChange={e => set('contato', e.target.value)}
                    placeholder="Nome do responsável"
                    className={`${inputCls} pl-8`}
                  />
                </div>
                {errors.contato && <p className="text-xs text-red-500">{errors.contato}</p>}
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Telefone" required>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={form.telefone}
                      onChange={e => set('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  {errors.telefone && <p className="text-xs text-red-500">{errors.telefone}</p>}
                </FormField>

                <FormField label="E-mail">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="email@empresa.com.br"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </FormField>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-sky-100 rounded-md flex items-center justify-center">
                  <FileText className="w-3 h-3 text-sky-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Observações</h3>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <FormField label="Observações">
                <textarea
                  value={form.obs}
                  onChange={e => set('obs', e.target.value)}
                  placeholder="Informações adicionais sobre o cliente, condições comerciais, etc."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400 resize-none"
                />
              </FormField>
            </section>
          </div>
        </form>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-3">
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <Info className="w-3.5 h-3.5" />
                Corrija os campos obrigatórios
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors shadow-sm shadow-sky-500/20"
            >
              {cliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
