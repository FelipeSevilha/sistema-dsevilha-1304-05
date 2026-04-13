'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, Cliente } from '@/lib/supabase';
import ClienteDrawer from '@/components/clientes/ClienteDrawer';
import { Plus, Search, Building2, Phone, Mail, MapPin, MoveHorizontal as MoreHorizontal, Users, UserCheck, Briefcase, UserPlus, Pencil, ToggleLeft } from 'lucide-react';

type ClienteFormData = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;

export default function ClientesPage() {
  const [list, setList] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSetor, setFilterSetor] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchClientes = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').order('razao_social');
    if (data) setList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClientes();

    const channel = supabase
      .channel('clientes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        fetchClientes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchClientes]);

  const setores = useMemo(
    () => ['Todos', ...Array.from(new Set(list.map(c => c.setor))).sort()],
    [list]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(c => {
      const matchSearch =
        c.razao_social.toLowerCase().includes(q) ||
        c.nome_fantasia.toLowerCase().includes(q) ||
        c.cnpj.includes(search) ||
        c.telefone.includes(search) ||
        c.contato.toLowerCase().includes(q);
      const matchSetor = filterSetor === 'Todos' || c.setor === filterSetor;
      const matchStatus =
        filterStatus === 'Todos' ||
        (filterStatus === 'Ativo' && c.ativo) ||
        (filterStatus === 'Inativo' && !c.ativo);
      return matchSearch && matchSetor && matchStatus;
    });
  }, [list, search, filterSetor, filterStatus]);

  const stats = useMemo(() => ({
    total: list.length,
    ativos: list.filter(c => c.ativo).length,
    setoresCount: new Set(list.map(c => c.setor)).size,
    novos: list.filter(c => {
      const d = new Date(c.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  }), [list]);

  const handleNew = () => {
    setSelectedCliente(null);
    setDrawerOpen(true);
  };

  const handleEdit = (c: Cliente) => {
    setSelectedCliente(c);
    setDrawerOpen(true);
    setOpenMenuId(null);
  };

  const handleToggleAtivo = async (id: string, atual: boolean) => {
    await supabase.from('clientes').update({ ativo: !atual }).eq('id', id);
    setOpenMenuId(null);
  };

  const handleSave = async (data: ClienteFormData) => {
    if (selectedCliente) {
      await supabase.from('clientes').update({ ...data, updated_at: new Date().toISOString() }).eq('id', selectedCliente.id);
    } else {
      await supabase.from('clientes').insert(data);
    }
    setDrawerOpen(false);
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const sectorColors: Record<string, string> = {
    'Construção Civil': 'bg-orange-100 text-orange-700',
    'Automotivo': 'bg-blue-100 text-blue-700',
    'Saúde': 'bg-emerald-100 text-emerald-700',
    'Varejo': 'bg-cyan-100 text-cyan-700',
    'Educação': 'bg-amber-100 text-amber-700',
    'Governo': 'bg-slate-100 text-slate-600',
    'Indústria': 'bg-rose-100 text-rose-700',
    'Alimentação': 'bg-lime-100 text-lime-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ativos</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.ativos}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Setores</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.setoresCount}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Novos/mês</p>
                <p className="text-3xl font-bold text-sky-600 mt-1">{stats.novos}</p>
              </div>
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome, CNPJ, telefone..."
                  className="pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 w-64"
                />
              </div>
              <select
                value={filterSetor}
                onChange={e => setFilterSetor(e.target.value)}
                className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-slate-600"
              >
                {setores.map(s => <option key={s}>{s}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none text-slate-600"
              >
                <option>Todos</option>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
              {(search || filterSetor !== 'Todos' || filterStatus !== 'Todos') && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  {filtered.length} resultado(s)
                </span>
              )}
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">CNPJ / IE</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contato</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Localização</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Setor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                          {getInitials(c.nome_fantasia || c.razao_social)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-800 font-semibold text-sm leading-tight truncate max-w-44">{c.razao_social}</p>
                          {c.nome_fantasia && (
                            <p className="text-slate-400 text-xs mt-0.5 truncate max-w-44">{c.nome_fantasia}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-slate-600">{c.cnpj}</p>
                      <p className="text-xs text-slate-400 mt-0.5">IE: {c.ie}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700 text-sm font-medium">{c.contato}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-400">{c.telefone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-400 truncate max-w-36">{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-600 font-medium">{c.cidade}/{c.uf}</p>
                          <p className="text-xs text-slate-400">{c.bairro}</p>
                          <p className="text-xs text-slate-400">CEP {c.cep}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${sectorColors[c.setor] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.setor}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Editar cliente"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === c.id && (
                            <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-44">
                              <button
                                onClick={() => handleToggleAtivo(c.id, c.ativo)}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                                {c.ativo ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">Nenhum cliente encontrado</p>
                <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros ou cadastre um novo cliente.</p>
                <button
                  onClick={handleNew}
                  className="mt-4 flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar novo cliente
                </button>
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-400">
                Exibindo{' '}
                <span className="font-medium text-slate-600">{filtered.length}</span> de{' '}
                <span className="font-medium text-slate-600">{list.length}</span> clientes
              </p>
            </div>
          )}
        </div>
      </div>

      <ClienteDrawer
        open={drawerOpen}
        cliente={selectedCliente ? {
          id: selectedCliente.id,
          razaoSocial: selectedCliente.razao_social,
          nomeFantasia: selectedCliente.nome_fantasia,
          cnpj: selectedCliente.cnpj,
          ie: selectedCliente.ie,
          cep: selectedCliente.cep,
          endereco: selectedCliente.endereco,
          numero: selectedCliente.numero,
          complemento: selectedCliente.complemento,
          bairro: selectedCliente.bairro,
          cidade: selectedCliente.cidade,
          uf: selectedCliente.uf,
          contato: selectedCliente.contato,
          telefone: selectedCliente.telefone,
          email: selectedCliente.email,
          setor: selectedCliente.setor,
          obs: selectedCliente.obs,
          ativo: selectedCliente.ativo,
        } : null}
        onClose={() => setDrawerOpen(false)}
        onSave={async (data) => {
          await handleSave({
            razao_social: data.razaoSocial,
            nome_fantasia: data.nomeFantasia,
            cnpj: data.cnpj,
            ie: data.ie,
            cep: data.cep,
            endereco: data.endereco,
            numero: data.numero,
            complemento: data.complemento,
            bairro: data.bairro,
            cidade: data.cidade,
            uf: data.uf,
            contato: data.contato,
            telefone: data.telefone,
            email: data.email,
            setor: data.setor,
            obs: data.obs,
            ativo: data.ativo,
          });
        }}
      />

      {openMenuId !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}
    </>
  );
}
