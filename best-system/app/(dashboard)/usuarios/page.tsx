'use client';

import { useState, useEffect } from 'react';
import { useAuth, AppUser, UserRole } from '@/lib/auth-context';
import { Plus, X, Pencil, Trash2, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';

const inputCls = 'w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  ativo: boolean;
}

const emptyForm: UserFormData = { name: '', email: '', password: '', role: 'vendedor', ativo: true };

function UserModal({ open, onClose, onSave, user }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
  user: AppUser | null;
}) {
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: '', role: user.role, ativo: user.ativo });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [user, open]);

  const set = (field: keyof UserFormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || (!user && !form.password.trim())) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch {
      setError('Erro ao salvar usuário. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">{user ? 'Editar Usuário' : 'Novo Vendedor'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome completo *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do vendedor" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-mail *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@graficadesevilha.com.br" className={inputCls} disabled={!!user} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{user ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={user ? 'Nova senha (opcional)' : 'Senha de acesso'}
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Perfil de acesso</label>
            <select value={form.role} onChange={e => set('role', e.target.value as UserRole)} className={inputCls}>
              <option value="vendedor">Vendedor — Clientes, Orçamentos, Pedidos + ver Produtos</option>
              <option value="admin">Administrador — Acesso total</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-slate-700">Usuário ativo</p>
              <p className="text-xs text-slate-400">Pode fazer login no sistema</p>
            </div>
            <button
              type="button"
              onClick={() => set('ativo', !form.ativo)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.ativo ? 'bg-sky-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.ativo ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white rounded-lg transition-colors font-medium">
            {saving ? 'Salvando...' : user ? 'Salvar' : 'Criar Vendedor'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const { user: currentUser, users, addUser, updateUser, removeUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<AppUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = async (data: UserFormData) => {
    if (editando) {
      await updateUser(editando.id, {
        name: data.name,
        role: data.role,
        ativo: data.ativo,
        ...(data.password ? { password: data.password } : {}),
      });
    } else {
      await addUser(data);
    }
    setModalOpen(false);
    setEditando(null);
  };

  const handleEdit = (u: AppUser) => {
    setEditando(u);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await removeUser(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total de Usuários</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Administradores</p>
          <p className="text-3xl font-bold text-sky-600 mt-1">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Vendedores</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{users.filter(u => u.role === 'vendedor').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Usuários do Sistema</h3>
          {isAdmin && (
            <button
              onClick={() => { setEditando(null); setModalOpen(true); }}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Vendedor
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Usuário', 'E-mail', 'Perfil', 'Permissões', 'Status', 'Cadastrado em', 'Ações'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isAdminUser = u.role === 'admin';
                const isCurrent = u.id === currentUser?.id;
                const initials = u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-sky-50/50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${isAdminUser ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          {isCurrent && <p className="text-xs text-sky-500">Você</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isAdminUser ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isAdminUser ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {isAdminUser ? 'Administrador' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {isAdminUser ? 'Acesso total' : 'Clientes, Orçamentos, Pedidos + ver Produtos'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${u.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {u.criadoEm ? new Date(u.criadoEm + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(u)} className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          {!isCurrent && (
                            <button onClick={() => setDeleteConfirm(u.id)} className="text-xs text-red-400 hover:text-red-500 font-medium flex items-center gap-1">
                              <Trash2 className="w-3 h-3" />
                              Remover
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Resumo de Permissões por Perfil</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <p className="text-sm font-semibold text-slate-700">Administrador</p>
            </div>
            <ul className="space-y-1.5">
              {['Dashboard', 'Financeiro', 'Orçamentos', 'Produtos', 'Pedidos', 'Clientes', 'Comissões', 'Metas', 'Estoque', 'Painel Estratégico', 'Usuários'].map(m => (
                <li key={m} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                  {m} — criar, editar, excluir
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">Vendedor</p>
            </div>
            <ul className="space-y-1.5">
              {[
                { m: 'Clientes', p: 'criar, editar' },
                { m: 'Orçamentos', p: 'criar, editar' },
                { m: 'Pedidos', p: 'criar, editar' },
                { m: 'Produtos', p: 'somente visualização' },
                { m: 'Dashboard', p: 'somente visualização' },
              ].map(({ m, p }) => (
                <li key={m} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.includes('criar') ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {m} — {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <UserModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        onSave={handleSave}
        user={editando}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Remover usuário?</h3>
            <p className="text-sm text-slate-500 mb-5">Esta ação não pode ser desfeita. O usuário perderá o acesso ao sistema.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-5 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
