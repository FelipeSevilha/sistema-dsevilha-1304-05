'use client';

import {
  clientes as mockClientes,
  produtos as mockProdutos,
  orcamentos as mockOrcamentos,
  pedidos as mockPedidos,
  estoque as mockEstoque,
  contasPagar as mockContasPagar,
  contasReceber as mockContasReceber,
} from './mock-data';

export type UserRole = 'admin' | 'vendedor';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
}

export interface Cliente {
  id: string;
  razao_social: string;
  nome_fantasia: string;
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
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  custo: number;
  preco: number;
  margem: number;
  unidade: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  created_at: string;
}

export interface Orcamento {
  id: string;
  numero: string;
  cliente_id: string | null;
  cliente_nome: string;
  data: string;
  validade: string;
  status: 'Aguardando' | 'Aprovado' | 'Recusado' | 'Convertido';
  valor_total: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
  orcamento_items?: OrcamentoItem[];
}

export interface Pedido {
  id: string;
  numero: string;
  cliente_id: string | null;
  cliente_nome: string;
  orcamento_id: string | null;
  orcamento_numero?: string | null;
  produto: string;
  quantidade: number;
  valor: number;
  status: 'Aguardando' | 'Em Andamento' | 'Em Produção' | 'Em Acabamento' | 'Pronto' | 'Entregue' | 'Atrasado' | 'Cancelado' | 'Produção' | 'Acabamento' | 'Entrega' | 'Concluído';
  prazo: string | null;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface EstoqueItem {
  id: string;
  item: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  estoque_minimo: number;
  fornecedor: string;
  valor_unitario: number;
  created_at: string;
  updated_at: string;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  vencimento: string;
  status: 'Pendente' | 'Pago' | 'Vencido';
  ano: number;
  mes: number;
  created_at: string;
  updated_at: string;
}

export interface ContaReceber {
  id: string;
  cliente_nome: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'Pendente' | 'Recebido' | 'Vencido';
  ano: number;
  mes: number;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  password: string;
  user_metadata?: { name?: string };
}

interface DB {
  auth_users: AuthUser[];
  user_profiles: UserProfile[];
  clientes: Cliente[];
  produtos: Produto[];
  orcamentos: Orcamento[];
  orcamento_items: OrcamentoItem[];
  pedidos: Pedido[];
  estoque: EstoqueItem[];
  contas_pagar: ContaPagar[];
  contas_receber: ContaReceber[];
}

const STORAGE_KEY = 'grafica_dsevilha_local_db_v2';
const SESSION_KEY = 'grafica_dsevilha_session_v2';

const nowIso = () => new Date().toISOString();
const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function monthYear(date: string) {
  const d = new Date(date);
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
}

function seedDatabase(): DB {
  const created = nowIso();

  const auth_users: AuthUser[] = [
    { id: 'user-admin-felipe', email: 'felipe@graficadesevilha.com.br', password: '123456', user_metadata: { name: 'Felipe Sevilha' } },
    { id: 'user-admin-wanessa', email: 'wanessa@graficadesevilha.com.br', password: '123456', user_metadata: { name: 'Wanessa Castro' } },
    { id: 'user-vendedor-robson', email: 'robson@graficadesevilha.com.br', password: '123456', user_metadata: { name: 'Robson Moreno' } },
    { id: 'user-vendedor-roberta', email: 'roberta@graficadesevilha.com.br', password: '123456', user_metadata: { name: 'Roberta Moreno' } },
  ];

  const user_profiles: UserProfile[] = [
    { id: 'user-admin-felipe', name: 'Felipe Sevilha', role: 'admin', ativo: true, created_at: created },
    { id: 'user-admin-wanessa', name: 'Wanessa Castro', role: 'admin', ativo: true, created_at: created },
    { id: 'user-vendedor-robson', name: 'Robson Moreno', role: 'vendedor', ativo: true, created_at: created },
    { id: 'user-vendedor-roberta', name: 'Roberta Moreno', role: 'vendedor', ativo: true, created_at: created },
  ];

  const clientes: Cliente[] = mockClientes.map((c) => ({
    id: String(c.id),
    razao_social: c.razaoSocial,
    nome_fantasia: c.nomeFantasia,
    cnpj: c.cnpj,
    ie: c.ie,
    cep: c.cep,
    endereco: c.endereco,
    numero: c.numero,
    complemento: c.complemento,
    bairro: c.bairro,
    cidade: c.cidade,
    uf: c.uf,
    contato: c.contato,
    telefone: c.telefone,
    email: c.email,
    setor: c.setor,
    obs: c.obs,
    ativo: c.ativo,
    created_at: created,
    updated_at: created,
  }));

  const produtos: Produto[] = mockProdutos.map((p) => ({
    id: String(p.id),
    nome: p.nome,
    categoria: p.categoria,
    descricao: (p as { descricao?: string }).descricao ?? `${p.nome} — ${p.categoria}`,
    custo: p.custo,
    preco: p.preco,
    margem: p.margem,
    unidade: p.unidade,
    ativo: p.ativo,
    created_at: created,
    updated_at: created,
  }));

  const orcamentos: Orcamento[] = [];
  const orcamento_items: OrcamentoItem[] = [];

  mockOrcamentos.forEach((o, index) => {
    const id = `orc-${index + 1}`;
    orcamentos.push({
      id,
      numero: o.numero,
      cliente_id: null,
      cliente_nome: o.cliente,
      data: o.criacao,
      validade: o.validade,
      status: (o.status as Orcamento['status']) ?? 'Aguardando',
      valor_total: o.valor,
      observacoes: o.obs,
      created_at: `${o.criacao}T08:00:00.000Z`,
      updated_at: `${o.criacao}T08:00:00.000Z`,
    });
    o.itens.forEach((item, itemIndex) => {
      orcamento_items.push({
        id: `orc-item-${index + 1}-${itemIndex + 1}`,
        orcamento_id: id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnit,
        valor_total: item.quantidade * item.valorUnit,
        created_at: `${o.criacao}T08:00:00.000Z`,
      });
    });
  });

  const pedidos: Pedido[] = mockPedidos.map((p, index) => ({
    id: `ped-${index + 1}`,
    numero: p.id.replace('#', ''),
    cliente_id: null,
    cliente_nome: p.cliente,
    orcamento_id: null,
    orcamento_numero: null,
    produto: p.produto,
    quantidade: p.quantidade,
    valor: p.valor,
    status: (p.status as Pedido['status']) ?? 'Aguardando',
    prazo: p.prazo,
    observacoes: p.obs,
    created_at: `${p.criacao}T08:00:00.000Z`,
    updated_at: `${p.criacao}T08:00:00.000Z`,
  }));

  const estoque: EstoqueItem[] = mockEstoque.map((e) => ({
    id: String(e.id),
    item: e.item,
    categoria: e.categoria,
    quantidade: e.quantidade,
    unidade: e.unidade,
    estoque_minimo: e.estoqueMinimo,
    fornecedor: e.fornecedor,
    valor_unitario: e.valorUnit,
    created_at: created,
    updated_at: created,
  }));

  const contas_pagar: ContaPagar[] = mockContasPagar.map((c, index) => ({
    id: `cp-${index + 1}`,
    descricao: c.descricao,
    categoria: c.categoria,
    valor: c.valor,
    vencimento: c.vencimento,
    status: c.status as ContaPagar['status'],
    ...monthYear(c.vencimento),
    created_at: created,
    updated_at: created,
  }));

  const contas_receber: ContaReceber[] = mockContasReceber.map((c, index) => ({
    id: `cr-${index + 1}`,
    cliente_nome: c.cliente,
    descricao: c.descricao,
    valor: c.valor,
    vencimento: c.vencimento,
    status: c.status as ContaReceber['status'],
    ...monthYear(c.vencimento),
    created_at: created,
    updated_at: created,
  }));

  return {
    auth_users,
    user_profiles,
    clientes,
    produtos,
    orcamentos,
    orcamento_items,
    pedidos,
    estoque,
    contas_pagar,
    contas_receber,
  };
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readDb(): DB {
  if (!canUseStorage()) return seedDatabase();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = seedDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as DB;
  } catch {
    const seed = seedDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function writeDb(db: DB) {
  if (canUseStorage()) localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function projectColumns<T extends Record<string, unknown>>(rows: T[], select?: string | null) {
  if (!select || select.trim() === '*' || select.includes('orcamento_items')) return clone(rows);
  const cols = select.split(',').map((s) => s.trim()).filter(Boolean);
  return rows.map((row) => {
    const projected: Record<string, unknown> = {};
    cols.forEach((c) => {
      if (c in row) projected[c] = row[c];
    });
    return projected as T;
  });
}

class QueryBuilder<T extends Record<string, unknown>> implements PromiseLike<{ data: any; error: null }> {
  private filters: Array<(row: T) => boolean> = [];
  private selectClause: string | null = null;
  private orderBy: { field: string; ascending: boolean } | null = null;
  private expectSingle = false;
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: Partial<T> | Partial<T>[] | null = null;

  constructor(private table: keyof DB) {}

  select(select?: string) {
    this.selectClause = select ?? '*';
    return this;
  }

  insert(values: Partial<T> | Partial<T>[]) {
    this.mode = 'insert';
    this.payload = values;
    return this;
  }

  update(values: Partial<T>) {
    this.mode = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = { field, ascending: options?.ascending ?? true };
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push((row) => row[field as keyof T] === value);
    return this;
  }

  gte(field: string, value: unknown) {
    this.filters.push((row) => String(row[field as keyof T] ?? '') >= String(value));
    return this;
  }

  lte(field: string, value: unknown) {
    this.filters.push((row) => String(row[field as keyof T] ?? '') <= String(value));
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  maybeSingle() {
    this.expectSingle = true;
    return this;
  }

  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: any; error: null }> {
    const db = readDb();
    const tableRows = clone(db[this.table] as T[]);

    if (this.mode === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const inserted = items.map((item) => {
        const base = item as Record<string, unknown>;
        const now = nowIso();
        const enriched: Record<string, unknown> = { id: makeId(), ...base };
        if (!('created_at' in enriched)) enriched.created_at = now;
        if (!('updated_at' in enriched) && this.table !== 'orcamento_items' && this.table !== 'user_profiles') enriched.updated_at = now;
        return enriched as T;
      });
      (db[this.table] as T[]).push(...clone(inserted));
      writeDb(db);
      const data = this.expectSingle ? inserted[0] ?? null : inserted;
      return { data, error: null };
    }

    let matched = tableRows.filter((row) => this.filters.every((fn) => fn(row)));

    if (this.mode === 'update') {
      const payload = (this.payload ?? {}) as Partial<T>;
      const updated: T[] = [];
      (db[this.table] as T[]).forEach((row, index, arr) => {
        if (this.filters.every((fn) => fn(row))) {
          const merged = { ...row, ...payload } as T;
          arr[index] = merged;
          updated.push(clone(merged));
        }
      });
      writeDb(db);
      const data = this.expectSingle ? updated[0] ?? null : updated;
      return { data, error: null };
    }

    if (this.mode === 'delete') {
      const kept = (db[this.table] as T[]).filter((row) => !this.filters.every((fn) => fn(row)));
      db[this.table] = kept as never;
      writeDb(db);
      return { data: null, error: null };
    }

    if (this.orderBy) {
      const { field, ascending } = this.orderBy;
      matched.sort((a, b) => {
        const av = String(a[field as keyof T] ?? '');
        const bv = String(b[field as keyof T] ?? '');
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    if (this.table === 'orcamentos' && this.selectClause?.includes('orcamento_items')) {
      const items = db.orcamento_items as unknown as OrcamentoItem[];
      matched = matched.map((row) => ({
        ...row,
        orcamento_items: items.filter((item) => item.orcamento_id === row.id),
      })) as T[];
    }

    const projected = projectColumns(matched, this.selectClause);
    const data = this.expectSingle ? (projected[0] ?? null) : projected;
    return { data, error: null };
  }
}

const authListeners = new Set<(event: string, session: { user: { id: string; email?: string } } | null) => void>();

function readSession() {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { user: { id: string; email?: string } };
  } catch {
    return null;
  }
}

function writeSession(session: { user: { id: string; email?: string } } | null) {
  if (!canUseStorage()) return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function emitAuth(event: string, session: { user: { id: string; email?: string } } | null) {
  authListeners.forEach((listener) => listener(event, session));
}

export const supabase = {
  from<TTable extends keyof DB>(table: TTable) {
    return new QueryBuilder<DB[TTable][number]>(table);
  },
  auth: {
    async getSession() {
      return { data: { session: readSession() } };
    },
    onAuthStateChange(callback: (event: string, session: { user: { id: string; email?: string } } | null) => void) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => authListeners.delete(callback),
          },
        },
      };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const db = readDb();
      const authUser = db.auth_users.find((u) => u.email === email && u.password === password);
      if (!authUser) return { data: { user: null }, error: new Error('Credenciais inválidas') };
      const session = { user: { id: authUser.id, email: authUser.email } };
      writeSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { user: session.user }, error: null };
    },
    async signOut() {
      writeSession(null);
      emitAuth('SIGNED_OUT', null);
      return { error: null };
    },
    admin: {
      async listUsers() {
        const db = readDb();
        return { data: { users: db.auth_users.map((u) => ({ id: u.id, email: u.email })) }, error: null };
      },
      async createUser({ email, password, user_metadata }: { email: string; password: string; email_confirm?: boolean; user_metadata?: { name?: string } }) {
        const db = readDb();
        const user = { id: makeId(), email, password, user_metadata };
        db.auth_users.push(user);
        writeDb(db);
        return { data: { user }, error: null };
      },
    },
  },
  channel(_name?: string) {
    return {
      on(..._args: any[]) {
        return this;
      },
      subscribe(..._args: any[]) {
        return { unsubscribe() {} };
      },
    };
  },
  removeChannel(_channel?: any) {
    return true;
  },
};

export function resetLocalDatabase() {
  if (canUseStorage()) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}
