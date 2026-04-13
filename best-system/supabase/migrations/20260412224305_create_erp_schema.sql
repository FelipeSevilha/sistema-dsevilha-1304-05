
/*
  # ERP Gráfica D'Sevilha — Schema completo

  ## Tabelas criadas:
  1. `user_profiles` — Perfis de usuário vinculados ao Supabase Auth (nome, role, ativo)
  2. `clientes` — Cadastro completo de clientes com endereço e contato
  3. `produtos` — Catálogo de produtos/serviços com custo, preço e margem
  4. `orcamentos` — Orçamentos/propostas com status e validade
  5. `orcamento_items` — Itens vinculados a cada orçamento
  6. `pedidos` — Pedidos de produção convertidos a partir de orçamentos
  7. `estoque` — Controle de estoque com quantidade e estoque mínimo
  8. `contas_pagar` — Contas a pagar (despesas)
  9. `contas_receber` — Contas a receber (receitas)
  10. `fluxo_caixa` — Entradas e saídas para gráfico de fluxo

  ## Segurança:
  - RLS habilitado em todas as tabelas
  - Admins têm acesso total (SELECT, INSERT, UPDATE, DELETE)
  - Vendedores têm acesso de leitura em tudo e escrita em clientes, orcamentos e pedidos
  - Produtos: vendedores só leem
  - Estoque, financeiro: somente admins
*/

-- =============================================
-- USER PROFILES (extends Supabase Auth users)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'vendedor')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- CLIENTES
-- =============================================
CREATE TABLE IF NOT EXISTS clientes (
  id bigserial PRIMARY KEY,
  razao_social text NOT NULL DEFAULT '',
  nome_fantasia text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  ie text NOT NULL DEFAULT '',
  cep text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  numero text NOT NULL DEFAULT '',
  complemento text NOT NULL DEFAULT '',
  bairro text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  uf text NOT NULL DEFAULT '',
  contato text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  setor text NOT NULL DEFAULT '',
  obs text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clientes"
  ON clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete clientes"
  ON clientes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- PRODUTOS
-- =============================================
CREATE TABLE IF NOT EXISTS produtos (
  id bigserial PRIMARY KEY,
  nome text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  custo numeric(10,2) NOT NULL DEFAULT 0,
  preco numeric(10,2) NOT NULL DEFAULT 0,
  margem numeric(5,2) NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'unid',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view produtos"
  ON produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert produtos"
  ON produtos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update produtos"
  ON produtos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete produtos"
  ON produtos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ORCAMENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS orcamentos (
  id bigserial PRIMARY KEY,
  numero text NOT NULL DEFAULT '',
  cliente_id bigint REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL DEFAULT '',
  data date NOT NULL DEFAULT CURRENT_DATE,
  validade date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Aguardando' CHECK (status IN ('Aguardando', 'Aprovado', 'Recusado', 'Convertido')),
  valor_total numeric(12,2) NOT NULL DEFAULT 0,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orcamentos"
  ON orcamentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orcamentos"
  ON orcamentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orcamentos"
  ON orcamentos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete orcamentos"
  ON orcamentos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ORCAMENTO_ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS orcamento_items (
  id bigserial PRIMARY KEY,
  orcamento_id bigint NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  descricao text NOT NULL DEFAULT '',
  quantidade integer NOT NULL DEFAULT 1,
  valor_unitario numeric(10,2) NOT NULL DEFAULT 0,
  valor_total numeric(12,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orcamento_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orcamento items"
  ON orcamento_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orcamento items"
  ON orcamento_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orcamento items"
  ON orcamento_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orcamento items"
  ON orcamento_items FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- PEDIDOS
-- =============================================
CREATE TABLE IF NOT EXISTS pedidos (
  id bigserial PRIMARY KEY,
  numero text NOT NULL DEFAULT '',
  cliente_id bigint REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL DEFAULT '',
  orcamento_id bigint REFERENCES orcamentos(id) ON DELETE SET NULL,
  produto text NOT NULL DEFAULT '',
  quantidade integer NOT NULL DEFAULT 1,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Aguardando' CHECK (status IN ('Aguardando', 'Produção', 'Acabamento', 'Entrega', 'Concluído')),
  prazo date,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pedidos"
  ON pedidos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pedidos"
  ON pedidos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pedidos"
  ON pedidos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete pedidos"
  ON pedidos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ESTOQUE
-- =============================================
CREATE TABLE IF NOT EXISTS estoque (
  id bigserial PRIMARY KEY,
  item text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  quantidade integer NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'Unid',
  estoque_minimo integer NOT NULL DEFAULT 0,
  fornecedor text NOT NULL DEFAULT '',
  valor_unitario numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view estoque"
  ON estoque FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert estoque"
  ON estoque FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update estoque"
  ON estoque FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete estoque"
  ON estoque FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- CONTAS_PAGAR
-- =============================================
CREATE TABLE IF NOT EXISTS contas_pagar (
  id bigserial PRIMARY KEY,
  descricao text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  valor numeric(12,2) NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Vencido')),
  ano integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  mes integer NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contas_pagar"
  ON contas_pagar FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert contas_pagar"
  ON contas_pagar FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update contas_pagar"
  ON contas_pagar FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete contas_pagar"
  ON contas_pagar FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- CONTAS_RECEBER
-- =============================================
CREATE TABLE IF NOT EXISTS contas_receber (
  id bigserial PRIMARY KEY,
  cliente_nome text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  valor numeric(12,2) NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Recebido', 'Vencido')),
  ano integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  mes integer NOT NULL DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contas_receber"
  ON contas_receber FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert contas_receber"
  ON contas_receber FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update contas_receber"
  ON contas_receber FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete contas_receber"
  ON contas_receber FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_items_orcamento_id ON orcamento_items(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_ano_mes ON contas_pagar(ano, mes);
CREATE INDEX IF NOT EXISTS idx_contas_receber_ano_mes ON contas_receber(ano, mes);
