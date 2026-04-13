ber_v2 (
  cliente_nome, descricao, valor, vencimento, status, ano, mes, created_at
)
SELECT
  cliente_nome, descricao, valor, vencimento, status, ano, mes, created_at
FROM contas_receber
ON CONFLICT DO NOTHING;

-- =============================================
-- RENAME: legacy → _legacy, v2 → canonical
-- =============================================
ALTER TABLE clientes RENAME TO clientes_legacy;
ALTER TABLE clientes_v2 RENAME TO clientes;

ALTER TABLE produtos RENAME TO produtos_legacy;
ALTER TABLE produtos_v2 RENAME TO produtos;

ALTER TABLE orcamentos RENAME TO orcamentos_legacy;
ALTER TABLE orcamentos_v2 RENAME TO orcamentos;

ALTER TABLE orcamento_items RENAME TO orcamento_items_legacy;
ALTER TABLE orcamento_items_v2 RENAME TO orcamento_items;

ALTER TABLE pedidos RENAME TO pedidos_legacy;
ALTER TABLE pedidos_v2 RENAME TO pedidos;

ALTER TABLE estoque RENAME TO estoque_legacy;
ALTER TABLE estoque_v2 RENAME TO estoque;

ALTER TABLE contas_pagar RENAME TO contas_pagar_legacy;
ALTER TABLE contas_pagar_v2 RENAME TO contas_pagar;

ALTER TABLE contas_receber RENAME TO contas_receber_legacy;
ALTER TABLE contas_receber_v2 RENAME TO contas_receber;

-- =============================================
-- DROP LEGACY TABLES
-- =============================================
DROP TABLE IF EXISTS contas_receber_legacy CASCADE;
DROP TABLE IF EXISTS contas_pagar_legacy CASCADE;
DROP TABLE IF EXISTS estoque_legacy CASCADE;
DROP TABLE IF EXISTS pedidos_legacy CASCADE;
DROP TABLE IF EXISTS orcamento_items_legacy CASCADE;
DROP TABLE IF EXISTS orcamentos_legacy CASCADE;
DROP TABLE IF EXISTS produtos_legacy CASCADE;
DROP TABLE IF EXISTS clientes_legacy CASCADE;

-- =============================================
-- TRIGGERS: updated_at automático
-- =============================================
CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_orcamentos_updated_at
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_estoque_updated_at
  BEFORE UPDATE ON estoque
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_contas_pagar_updated_at
  BEFORE UPDATE ON contas_pagar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_contas_receber_updated_at
  BEFORE UPDATE ON contas_receber
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS: habilitar em todas as novas tabelas
-- =============================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: CLIENTES
-- =============================================
CREATE POLICY "clientes_select" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_insert" ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clientes_update" ON clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clientes_delete" ON clientes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS POLICIES: PRODUTOS
-- =============================================
CREATE POLICY "produtos_select" ON produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "produtos_insert" ON produtos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "produtos_update" ON produtos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "produtos_delete" ON produtos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS POLICIES: ORCAMENTOS
-- =============================================
CREATE POLICY "orcamentos_select" ON orcamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "orcamentos_insert" ON orcamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orcamentos_update" ON orcamentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "orcamentos_delete" ON orcamentos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS POLICIES: ORCAMENTO_ITEMS
-- =============================================
CREATE POLICY "orcamento_items_select" ON orcamento_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "orcamento_items_insert" ON orcamento_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orcamento_items_update" ON orcamento_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "orcamento_items_delete" ON orcamento_items FOR DELETE TO authenticated USING (true);

-- =============================================
-- RLS POLICIES: PEDIDOS
-- =============================================
CREATE POLICY "pedidos_select" ON pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pedidos_delete" ON pedidos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS POLICIES: ESTOQUE (admin only)
-- =============================================
CREATE POLICY "estoque_select" ON estoque FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "estoque_insert" ON estoque FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "estoque_update" ON estoque FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "estoque_delete" ON estoque FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS POLICIES: CONTAS_PAGAR (admin only)
-- =============================================
CREATE POLICY "contas_pagar_select" ON contas_pagar FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "contas_pagar_insert" ON contas_pagar FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "contas_pagar_update" ON contas_pagar FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "contas_pagar_delete" ON contas_pagar FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- RLS POLICIES: CONTAS_RECEBER (admin only)
-- =============================================
CREATE POLICY "contas_receber_select" ON contas_receber FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "contas_receber_insert" ON contas_receber FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "contas_receber_update" ON contas_receber FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "contas_receber_delete" ON contas_receber FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- INDEXES para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_items_orcamento_id ON orcamento_items(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_orcamento_id ON pedidos(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_ano_mes ON contas_pagar(ano, mes);
CREATE INDEX IF NOT EXISTS idx_contas_receber_ano_mes ON contas_receber(ano, mes);
CREATE INDEX IF NOT EXISTS idx_estoque_categoria ON estoque(categoria);
