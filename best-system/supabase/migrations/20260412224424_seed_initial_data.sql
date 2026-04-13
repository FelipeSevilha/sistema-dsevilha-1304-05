
/*
  # Seed inicial de dados

  ## O que este migration faz:
  - Insere produtos do catálogo inicial
  - Insere clientes de exemplo
  - Insere itens de estoque iniciais
  - Insere contas a pagar e receber de exemplo
*/

-- Produtos
INSERT INTO produtos (nome, categoria, descricao, custo, preco, margem, unidade, ativo)
VALUES
  ('Folder A4 - 4x4', 'Folders', 'Folder A4 impressão 4x4 cores frente e verso', 0.28, 0.75, 62.7, 'unid', true),
  ('Catálogo A4 - Capa dura', 'Catálogos', 'Catálogo A4 com capa dura costurado', 4.20, 12.0, 65.0, 'unid', true),
  ('Banner Lona 440g - 2x1m', 'Banners', 'Banner em lona 440g acabamento ilhós', 28.0, 85.0, 67.1, 'unid', true),
  ('Cartão de Visita - 9x5cm', 'Cartões', 'Cartão de visita couchê 300g verniz total', 0.08, 0.25, 68.0, 'unid', true),
  ('Flyer A5 - 4x0', 'Flyers', 'Flyer A5 impressão 4x0 couchê 150g', 0.15, 0.45, 66.7, 'unid', true),
  ('Agenda Personalizada A5', 'Agendas', 'Agenda A5 personalizada com logotipo', 12.0, 35.0, 65.7, 'unid', true),
  ('Embalagem Pizza 35cm', 'Embalagens', 'Caixa pizza 35cm impressão personalizada', 1.20, 3.80, 68.4, 'unid', true),
  ('Adesivo Vinil Recortado', 'Adesivos', 'Adesivo vinil recortado sob medida', 0.45, 1.50, 70.0, 'unid', false)
ON CONFLICT DO NOTHING;

-- Clientes
INSERT INTO clientes (razao_social, nome_fantasia, cnpj, ie, cep, endereco, numero, complemento, bairro, cidade, uf, contato, telefone, email, setor, obs, ativo)
VALUES
  ('Construtora Horizonte Ltda', 'Horizonte Construções', '12.345.678/0001-90', '123.456.789.000', '01310-200', 'Av. Paulista', '1500', 'Sala 302', 'Bela Vista', 'São Paulo', 'SP', 'Roberto Alves', '(11) 3456-7890', 'roberto@horizonte.com.br', 'Construção Civil', 'Cliente VIP, prazo de pagamento 30 dias.', true),
  ('Auto Peças JR Comércio Ltda', 'Auto Peças JR', '98.765.432/0001-10', '987.654.321.000', '02010-000', 'Rua das Peças', '45', '', 'Santana', 'São Paulo', 'SP', 'José Rodrigues', '(11) 2345-6789', 'jr@autopecasjr.com.br', 'Automotivo', '', true),
  ('Clínica Saúde Plena S/S', 'Saúde Plena', '11.222.333/0001-44', 'Isento', '04020-000', 'Rua da Saúde', '100', 'Andar 2', 'Vila Mariana', 'São Paulo', 'SP', 'Dra. Ana Lima', '(11) 4567-8901', 'contato@saudeplena.med.br', 'Saúde', 'Solicitar pedido mínimo de 500 unidades.', true),
  ('Supermercado União Eireli', 'Supermercado União', '55.666.777/0001-88', '556.667.778.000', '08000-000', 'Av. do Comércio', '800', '', 'Centro', 'São Paulo', 'SP', 'Pedro União', '(11) 5678-9012', 'compras@supermercadouniao.com.br', 'Varejo', '', true),
  ('Escola Futuro Brilhante Ltda', 'Escola Futuro Brilhante', '33.444.555/0001-66', 'Isento', '05400-000', 'Rua da Educação', '250', '', 'Pinheiros', 'São Paulo', 'SP', 'Marta Professora', '(11) 6789-0123', 'secretaria@futurobrilhante.edu.br', 'Educação', 'Pedidos anuais de agendas em agosto.', true),
  ('Prefeitura Municipal de Exemplo', 'Prefeitura de Exemplo', '00.111.222/0001-33', 'Isento', '01000-000', 'Praça da Sé', '1', 'Sala de Compras', 'Sé', 'São Paulo', 'SP', 'Setor de Compras', '(11) 7890-1234', 'compras@prefeitura.sp.gov.br', 'Governo', 'Necessário empenho para faturamento.', true),
  ('Metalúrgica Forte Indústria Ltda', 'Metalúrgica Forte', '22.333.444/0001-55', '223.334.445.000', '09500-000', 'Rua das Indústrias', '1200', 'Galpão B', 'Distrito Industrial', 'Santo André', 'SP', 'Carlos Forte', '(11) 4455-6677', 'carlos@metalurgicaforte.com.br', 'Indústria', '', true),
  ('Restaurante Bella Vista Ltda', 'Bella Vista', '77.888.999/0001-11', '778.889.990.000', '04500-000', 'Rua do Sabor', '22', '', 'Moema', 'São Paulo', 'SP', 'Luigi Ferrari', '(11) 9988-7766', 'contato@bellavista.com.br', 'Alimentação', 'Pedidos mensais de cardápios.', false)
ON CONFLICT DO NOTHING;

-- Estoque
INSERT INTO estoque (item, categoria, quantidade, unidade, estoque_minimo, fornecedor, valor_unitario)
VALUES
  ('Papel Couchê 150g A4', 'Papel', 45, 'Resmas', 100, 'Papel Total Ind.', 28.50),
  ('Papel Offset 75g A3', 'Papel', 280, 'Resmas', 150, 'Suzano Papel', 18.90),
  ('Tinta CMYK UV', 'Tinta', 12, 'Litros', 20, 'Gráfica Supply', 185.00),
  ('Tinta Pantone 485', 'Tinta', 4, 'Litros', 10, 'Gráfica Supply', 220.00),
  ('Lona Backlight 440g', 'Substrato', 180, 'Metros', 100, 'Display Total', 12.50),
  ('Vinil Adesivo Branco', 'Substrato', 85, 'Metros', 50, 'Display Total', 18.00),
  ('Fio de Costura 40/2', 'Acabamento', 22, 'Cones', 15, 'Acabamento Pro', 24.00),
  ('Espiral Plástico 20mm', 'Acabamento', 350, 'Unid', 200, 'Acabamento Pro', 0.85)
ON CONFLICT DO NOTHING;

-- Contas a Pagar
INSERT INTO contas_pagar (descricao, categoria, valor, vencimento, status, ano, mes)
VALUES
  ('Papel Couchê 150g - Papel Total', 'Matéria-prima', 8200.00, '2026-01-15'::date, 'Pendente', 2026, 1),
  ('Tinta UV - Gráfica Supply', 'Insumos', 3400.00, '2026-01-18'::date, 'Pendente', 2026, 1),
  ('Aluguel - Imóvel Comercial', 'Despesas Fixas', 5500.00, '2026-01-20'::date, 'Pendente', 2026, 1),
  ('Energia Elétrica - Janeiro', 'Despesas Fixas', 2100.00, '2026-01-22'::date, 'Pendente', 2026, 1),
  ('Internet e Telefone', 'Despesas Fixas', 480.00, '2026-01-10'::date, 'Pago', 2026, 1),
  ('Manutenção Impressora Heidelberg', 'Manutenção', 1200.00, '2026-01-05'::date, 'Pago', 2026, 1)
ON CONFLICT DO NOTHING;

-- Contas a Receber
INSERT INTO contas_receber (cliente_nome, descricao, valor, vencimento, status, ano, mes)
VALUES
  ('Construtora Horizonte', 'Catálogos A4', 4200.00, '2026-01-20'::date, 'Pendente', 2026, 1),
  ('Auto Peças JR', 'Banners - Pedido recente', 1850.00, '2026-01-14'::date, 'Pendente', 2026, 1),
  ('Clínica Saúde Plena', 'Folders - Pedido recente', 980.00, '2026-01-13'::date, 'Recebido', 2026, 1),
  ('Supermercado União', 'Flyers - Pedido recente', 650.00, '2026-01-10'::date, 'Recebido', 2026, 1),
  ('Escola Futuro Brilhante', 'Agendas - Pedido recente', 7200.00, '2026-01-30'::date, 'Pendente', 2026, 1),
  ('Prefeitura Municipal', 'Material Institucional', 12500.00, '2026-01-08'::date, 'Vencido', 2026, 1)
ON CONFLICT DO NOTHING;
