export const mockUser = {
  name: 'Carlos Mendes',
  email: 'carlos@graficadesevilha.com.br',
  role: 'Administrador',
  avatar: 'CM',
};

export const dashboardStats = {
  faturamentoMes: 87450.0,
  faturamentoAnterior: 74200.0,
  pedidosAndamento: 34,
  pedidosNovos: 8,
  clientesCadastrados: 218,
  clientesNovos: 12,
  contasReceber: 42300.0,
  contasVencer: 18750.0,
};

export const faturamentoMensal = [
  { mes: 'Jan', valor: 52000 },
  { mes: 'Fev', valor: 61000 },
  { mes: 'Mar', valor: 55000 },
  { mes: 'Abr', valor: 67000 },
  { mes: 'Mai', valor: 72000 },
  { mes: 'Jun', valor: 68000 },
  { mes: 'Jul', valor: 81000 },
  { mes: 'Ago', valor: 74000 },
  { mes: 'Set', valor: 87450 },
  { mes: 'Out', valor: 0 },
  { mes: 'Nov', valor: 0 },
  { mes: 'Dez', valor: 0 },
];

export const pedidosPorStatus = [
  { status: 'Aguardando', quantidade: 8 },
  { status: 'Produção', quantidade: 15 },
  { status: 'Acabamento', quantidade: 7 },
  { status: 'Entrega', quantidade: 4 },
  { status: 'Concluído', quantidade: 42 },
];

export const alertas = [
  { id: 1, tipo: 'warning', mensagem: 'Estoque de papel couchê 150g abaixo do mínimo', data: '2024-09-12' },
  { id: 2, tipo: 'error', mensagem: 'Conta a pagar vencida: Fornecedor Papel Total - R$ 3.200,00', data: '2024-09-10' },
  { id: 3, tipo: 'info', mensagem: '5 orçamentos aguardando aprovação do cliente', data: '2024-09-12' },
  { id: 4, tipo: 'success', mensagem: 'Meta mensal de faturamento atingida: 87,4%', data: '2024-09-12' },
];

export const pedidosRecentes = [
  { id: '#P-1042', cliente: 'Construtora Horizonte', produto: 'Catálogos A4', valor: 4200.0, status: 'Produção', prazo: '2024-09-18' },
  { id: '#P-1041', cliente: 'Auto Peças JR', produto: 'Banners 2x1m', valor: 1850.0, status: 'Acabamento', prazo: '2024-09-14' },
  { id: '#P-1040', cliente: 'Clínica Saúde Plena', produto: 'Folders 1/3 A4', valor: 980.0, status: 'Entrega', prazo: '2024-09-13' },
  { id: '#P-1039', cliente: 'Supermercado União', produto: 'Flyers A5', valor: 650.0, status: 'Concluído', prazo: '2024-09-10' },
  { id: '#P-1038', cliente: 'Escola Futuro Brilhante', produto: 'Agendas personalizadas', valor: 7200.0, status: 'Aguardando', prazo: '2024-09-25' },
];

export const contasPagar = [
  { id: 1, descricao: 'Papel Couchê 150g - Papel Total', vencimento: '2024-09-15', valor: 8200.0, categoria: 'Matéria-prima', status: 'Pendente' },
  { id: 2, descricao: 'Tinta UV - Gráfica Supply', vencimento: '2024-09-18', valor: 3400.0, categoria: 'Insumos', status: 'Pendente' },
  { id: 3, descricao: 'Aluguel - Imóvel Comercial', vencimento: '2024-09-20', valor: 5500.0, categoria: 'Despesas Fixas', status: 'Pendente' },
  { id: 4, descricao: 'Energia Elétrica - Setembro', vencimento: '2024-09-22', valor: 2100.0, categoria: 'Despesas Fixas', status: 'Pendente' },
  { id: 5, descricao: 'Internet e Telefone', vencimento: '2024-09-10', valor: 480.0, categoria: 'Despesas Fixas', status: 'Pago' },
  { id: 6, descricao: 'Manutenção Impressora Heidelberg', vencimento: '2024-09-05', valor: 1200.0, categoria: 'Manutenção', status: 'Vencido' },
];

export const contasReceber = [
  { id: 1, cliente: 'Construtora Horizonte', descricao: 'Catálogos A4 - Pedido #P-1042', vencimento: '2024-09-20', valor: 4200.0, status: 'Pendente' },
  { id: 2, cliente: 'Auto Peças JR', descricao: 'Banners - Pedido #P-1041', vencimento: '2024-09-14', valor: 1850.0, status: 'Pendente' },
  { id: 3, cliente: 'Clínica Saúde Plena', descricao: 'Folders - Pedido #P-1040', vencimento: '2024-09-13', valor: 980.0, status: 'Recebido' },
  { id: 4, cliente: 'Supermercado União', descricao: 'Flyers - Pedido #P-1039', vencimento: '2024-09-10', valor: 650.0, status: 'Recebido' },
  { id: 5, cliente: 'Escola Futuro Brilhante', descricao: 'Agendas - Pedido #P-1038', vencimento: '2024-09-30', valor: 7200.0, status: 'Pendente' },
  { id: 6, cliente: 'Prefeitura Municipal', descricao: 'Material Institucional', vencimento: '2024-09-08', valor: 12500.0, status: 'Vencido' },
];

export const fluxoCaixa = [
  { data: '01/09', entradas: 4200, saidas: 2100, saldo: 2100 },
  { data: '05/09', entradas: 1850, saidas: 5980, saldo: -4130 },
  { data: '10/09', entradas: 12500, saidas: 480, saldo: 12020 },
  { data: '15/09', entradas: 7200, saidas: 8200, saldo: -1000 },
  { data: '20/09', entradas: 4200, saidas: 5500, saldo: -1300 },
  { data: '25/09', entradas: 9800, saidas: 2100, saldo: 7700 },
  { data: '30/09', entradas: 5400, saidas: 3400, saldo: 2000 },
];

export interface OrcamentoItem {
  id: number;
  descricao: string;
  quantidade: number;
  valorUnit: number;
}

export interface Orcamento {
  id: string;
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

export const orcamentos: Orcamento[] = [
  {
    id: '#O-0215', numero: '2409.1001', cliente: 'Metalúrgica Forte', produto: 'Embalagens personalizadas',
    itens: [
      { id: 1, descricao: 'Caixa embalagem 20x20cm personalizada', quantidade: 2000, valorUnit: 3.50 },
      { id: 2, descricao: 'Adesivo logotipo 10x5cm', quantidade: 2000, valorUnit: 0.90 },
    ],
    valor: 9800.0, criacao: '2024-09-10', validade: '2024-09-25', status: 'Aguardando', obs: 'Cliente solicita entrega parcelada em 3 vezes.',
  },
  {
    id: '#O-0214', numero: '2409.0901', cliente: 'Restaurante Bella Vista', produto: 'Cardápios laminados',
    itens: [
      { id: 1, descricao: 'Cardápio A4 laminado frente e verso', quantidade: 100, valorUnit: 18.00 },
      { id: 2, descricao: 'Cardápio bebidas A5 laminado', quantidade: 100, valorUnit: 5.00 },
    ],
    valor: 2300.0, criacao: '2024-09-09', validade: '2024-09-24', status: 'Aprovado', obs: 'Arte aprovada. Aguardando confirmação de pagamento.',
  },
  {
    id: '#O-0213', numero: '2409.0801', cliente: 'Academia Fitness Pro', produto: 'Adesivos vinil',
    itens: [
      { id: 1, descricao: 'Adesivo vinil 1x1m para vitrine', quantidade: 5, valorUnit: 180.00 },
      { id: 2, descricao: 'Adesivo vinil para piso antiderrapante', quantidade: 10, valorUnit: 65.00 },
    ],
    valor: 1450.0, criacao: '2024-09-08', validade: '2024-09-23', status: 'Aguardando', obs: '',
  },
  {
    id: '#O-0212', numero: '2409.0701', cliente: 'Farmácia Saúde & Vida', produto: 'Folders informativos',
    itens: [
      { id: 1, descricao: 'Folder 1/3 A4 frente e verso colorido', quantidade: 1000, valorUnit: 0.78 },
    ],
    valor: 780.0, criacao: '2024-09-07', validade: '2024-09-22', status: 'Recusado', obs: 'Cliente optou por outro fornecedor.',
  },
  {
    id: '#O-0211', numero: '2409.0601', cliente: 'Escritório Advocacia Lima', produto: 'Papelaria corporativa',
    itens: [
      { id: 1, descricao: 'Cartão de visita 9x5cm verniz localizado', quantidade: 1000, valorUnit: 0.45 },
      { id: 2, descricao: 'Envelope ofício personalizado', quantidade: 500, valorUnit: 1.80 },
      { id: 3, descricao: 'Papel timbrado A4 2 cores', quantidade: 1000, valorUnit: 0.65 },
    ],
    valor: 3200.0, criacao: '2024-09-06', validade: '2024-09-21', status: 'Convertido', obs: 'Convertido no pedido #P-1043.',
  },
  {
    id: '#O-0210', numero: '2409.0501', cliente: 'Construtora Horizonte', produto: 'Placa obra 3x2m',
    itens: [
      { id: 1, descricao: 'Placa de obra lona 440g 3x2m', quantidade: 2, valorUnit: 270.00 },
    ],
    valor: 540.0, criacao: '2024-09-05', validade: '2024-09-20', status: 'Aprovado', obs: 'Instalação por conta do cliente.',
  },
];

export const produtos = [
  { id: 1, nome: 'Folder A4 - 4x4', categoria: 'Folders', custo: 0.28, preco: 0.75, margem: 62.7, unidade: 'unid', ativo: true },
  { id: 2, nome: 'Catálogo A4 - Capa dura', categoria: 'Catálogos', custo: 4.20, preco: 12.0, margem: 65.0, unidade: 'unid', ativo: true },
  { id: 3, nome: 'Banner Lona 440g - 2x1m', categoria: 'Banners', custo: 28.0, preco: 85.0, margem: 67.1, unidade: 'unid', ativo: true },
  { id: 4, nome: 'Cartão de Visita - 9x5cm', categoria: 'Cartões', custo: 0.08, preco: 0.25, margem: 68.0, unidade: 'unid', ativo: true },
  { id: 5, nome: 'Flyer A5 - 4x0', categoria: 'Flyers', custo: 0.15, preco: 0.45, margem: 66.7, unidade: 'unid', ativo: true },
  { id: 6, nome: 'Agenda Personalizada A5', categoria: 'Agendas', custo: 12.0, preco: 35.0, margem: 65.7, unidade: 'unid', ativo: true },
  { id: 7, nome: 'Embalagem Pizza 35cm', categoria: 'Embalagens', custo: 1.20, preco: 3.80, margem: 68.4, unidade: 'unid', ativo: true },
  { id: 8, nome: 'Adesivo Vinil Recortado', categoria: 'Adesivos', custo: 0.45, preco: 1.50, margem: 70.0, unidade: 'unid', ativo: false },
];

export const pedidos = [
  { id: '#P-1042', cliente: 'Construtora Horizonte', produto: 'Catálogos A4', quantidade: 500, valor: 4200.0, status: 'Produção', prazo: '2024-09-18', criacao: '2024-09-08', obs: 'Logo em alta resolução enviada por e-mail' },
  { id: '#P-1041', cliente: 'Auto Peças JR', produto: 'Banners 2x1m', quantidade: 10, valor: 1850.0, status: 'Acabamento', prazo: '2024-09-14', criacao: '2024-09-07', obs: '' },
  { id: '#P-1040', cliente: 'Clínica Saúde Plena', produto: 'Folders 1/3 A4', quantidade: 2000, valor: 980.0, status: 'Entrega', prazo: '2024-09-13', criacao: '2024-09-06', obs: 'Entrega no endereço do cliente' },
  { id: '#P-1039', cliente: 'Supermercado União', produto: 'Flyers A5', quantidade: 5000, valor: 650.0, status: 'Concluído', prazo: '2024-09-10', criacao: '2024-09-05', obs: '' },
  { id: '#P-1038', cliente: 'Escola Futuro Brilhante', produto: 'Agendas personalizadas', quantidade: 300, valor: 7200.0, status: 'Aguardando', prazo: '2024-09-25', criacao: '2024-09-09', obs: 'Aguardando aprovação da arte' },
  { id: '#P-1037', cliente: 'Prefeitura Municipal', produto: 'Material Institucional', quantidade: 1000, valor: 12500.0, status: 'Concluído', prazo: '2024-09-08', criacao: '2024-09-01', obs: 'Licitação 2024/087' },
];

export interface Cliente {
  id: number;
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

export const clientes: Cliente[] = [
  { id: 1, razaoSocial: 'Construtora Horizonte Ltda', nomeFantasia: 'Horizonte Construções', cnpj: '12.345.678/0001-90', ie: '123.456.789.000', cep: '01310-200', endereco: 'Av. Paulista', numero: '1500', complemento: 'Sala 302', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', contato: 'Roberto Alves', telefone: '(11) 3456-7890', email: 'roberto@horizonte.com.br', setor: 'Construção Civil', obs: 'Cliente VIP, prazo de pagamento 30 dias.', ativo: true },
  { id: 2, razaoSocial: 'Auto Peças JR Comércio Ltda', nomeFantasia: 'Auto Peças JR', cnpj: '98.765.432/0001-10', ie: '987.654.321.000', cep: '02010-000', endereco: 'Rua das Peças', numero: '45', complemento: '', bairro: 'Santana', cidade: 'São Paulo', uf: 'SP', contato: 'José Rodrigues', telefone: '(11) 2345-6789', email: 'jr@autopecasjr.com.br', setor: 'Automotivo', obs: '', ativo: true },
  { id: 3, razaoSocial: 'Clínica Saúde Plena S/S', nomeFantasia: 'Saúde Plena', cnpj: '11.222.333/0001-44', ie: 'Isento', cep: '04020-000', endereco: 'Rua da Saúde', numero: '100', complemento: 'Andar 2', bairro: 'Vila Mariana', cidade: 'São Paulo', uf: 'SP', contato: 'Dra. Ana Lima', telefone: '(11) 4567-8901', email: 'contato@saudeplena.med.br', setor: 'Saúde', obs: 'Solicitar pedido mínimo de 500 unidades.', ativo: true },
  { id: 4, razaoSocial: 'Supermercado União Eireli', nomeFantasia: 'Supermercado União', cnpj: '55.666.777/0001-88', ie: '556.667.778.000', cep: '08000-000', endereco: 'Av. do Comércio', numero: '800', complemento: '', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP', contato: 'Pedro União', telefone: '(11) 5678-9012', email: 'compras@supermercadouniao.com.br', setor: 'Varejo', obs: '', ativo: true },
  { id: 5, razaoSocial: 'Escola Futuro Brilhante Ltda', nomeFantasia: 'Escola Futuro Brilhante', cnpj: '33.444.555/0001-66', ie: 'Isento', cep: '05400-000', endereco: 'Rua da Educação', numero: '250', complemento: '', bairro: 'Pinheiros', cidade: 'São Paulo', uf: 'SP', contato: 'Marta Professora', telefone: '(11) 6789-0123', email: 'secretaria@futurobrilhante.edu.br', setor: 'Educação', obs: 'Pedidos anuais de agendas em agosto.', ativo: true },
  { id: 6, razaoSocial: 'Prefeitura Municipal de Exemplo', nomeFantasia: 'Prefeitura de Exemplo', cnpj: '00.111.222/0001-33', ie: 'Isento', cep: '01000-000', endereco: 'Praça da Sé', numero: '1', complemento: 'Sala de Compras', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP', contato: 'Setor de Compras', telefone: '(11) 7890-1234', email: 'compras@prefeitura.sp.gov.br', setor: 'Governo', obs: 'Necessário empenho para faturamento.', ativo: true },
  { id: 7, razaoSocial: 'Metalúrgica Forte Indústria Ltda', nomeFantasia: 'Metalúrgica Forte', cnpj: '22.333.444/0001-55', ie: '223.334.445.000', cep: '09500-000', endereco: 'Rua das Indústrias', numero: '1200', complemento: 'Galpão B', bairro: 'Distrito Industrial', cidade: 'Santo André', uf: 'SP', contato: 'Carlos Forte', telefone: '(11) 4455-6677', email: 'carlos@metalurgicaforte.com.br', setor: 'Indústria', obs: '', ativo: true },
  { id: 8, razaoSocial: 'Restaurante Bella Vista Ltda', nomeFantasia: 'Bella Vista', cnpj: '77.888.999/0001-11', ie: '778.889.990.000', cep: '04500-000', endereco: 'Rua do Sabor', numero: '22', complemento: '', bairro: 'Moema', cidade: 'São Paulo', uf: 'SP', contato: 'Luigi Ferrari', telefone: '(11) 9988-7766', email: 'contato@bellavista.com.br', setor: 'Alimentação', obs: 'Pedidos mensais de cardápios.', ativo: false },
];

export const comissoes = [
  { id: 1, vendedor: 'Ana Paula Costa', pedidos: 18, valorVendas: 34200.0, percentual: 5.0, comissao: 1710.0, status: 'Pendente', mes: 'Setembro/2024' },
  { id: 2, vendedor: 'Bruno Santos', pedidos: 12, valorVendas: 22100.0, percentual: 4.5, comissao: 994.5, status: 'Pago', mes: 'Setembro/2024' },
  { id: 3, vendedor: 'Carla Mendes', pedidos: 9, valorVendas: 18750.0, percentual: 4.5, comissao: 843.75, status: 'Pendente', mes: 'Setembro/2024' },
  { id: 4, vendedor: 'Diego Ferreira', pedidos: 6, valorVendas: 12400.0, percentual: 4.0, comissao: 496.0, status: 'Pago', mes: 'Setembro/2024' },
];

export const metas = [
  { id: 1, tipo: 'Faturamento', meta: 100000.0, realizado: 87450.0, percentual: 87.5, periodo: 'Setembro/2024', status: 'Em andamento' },
  { id: 2, tipo: 'Novos Clientes', meta: 20, realizado: 12, percentual: 60.0, periodo: 'Setembro/2024', status: 'Em andamento' },
  { id: 3, tipo: 'Pedidos', meta: 50, realizado: 34, percentual: 68.0, periodo: 'Setembro/2024', status: 'Em andamento' },
  { id: 4, tipo: 'Ticket Médio', meta: 2500.0, realizado: 2572.06, percentual: 102.9, periodo: 'Setembro/2024', status: 'Atingida' },
];

export const rankingVendedores = [
  { posicao: 1, vendedor: 'Ana Paula Costa', vendas: 34200.0, pedidos: 18, crescimento: 12.5 },
  { posicao: 2, vendedor: 'Bruno Santos', vendas: 22100.0, pedidos: 12, crescimento: -3.2 },
  { posicao: 3, vendedor: 'Carla Mendes', vendas: 18750.0, pedidos: 9, crescimento: 8.7 },
  { posicao: 4, vendedor: 'Diego Ferreira', vendas: 12400.0, pedidos: 6, crescimento: 15.1 },
];

export const estoque = [
  { id: 1, item: 'Papel Couchê 150g A4', categoria: 'Papel', quantidade: 45, unidade: 'Resmas', estoqueMinimo: 100, fornecedor: 'Papel Total Ind.', valorUnit: 28.5, status: 'Crítico' },
  { id: 2, item: 'Papel Offset 75g A3', categoria: 'Papel', quantidade: 280, unidade: 'Resmas', estoqueMinimo: 150, fornecedor: 'Suzano Papel', valorUnit: 18.9, status: 'Normal' },
  { id: 3, item: 'Tinta CMYK UV', categoria: 'Tinta', quantidade: 12, unidade: 'Litros', estoqueMinimo: 20, fornecedor: 'Gráfica Supply', valorUnit: 185.0, status: 'Baixo' },
  { id: 4, item: 'Tinta Pantone 485', categoria: 'Tinta', quantidade: 4, unidade: 'Litros', estoqueMinimo: 10, fornecedor: 'Gráfica Supply', valorUnit: 220.0, status: 'Crítico' },
  { id: 5, item: 'Lona Backlight 440g', categoria: 'Substrato', quantidade: 180, unidade: 'Metros', estoqueMinimo: 100, fornecedor: 'Display Total', valorUnit: 12.5, status: 'Normal' },
  { id: 6, item: 'Vinil Adesivo Branco', categoria: 'Substrato', quantidade: 85, unidade: 'Metros', estoqueMinimo: 50, fornecedor: 'Display Total', valorUnit: 18.0, status: 'Normal' },
  { id: 7, item: 'Fio de Costura 40/2', categoria: 'Acabamento', quantidade: 22, unidade: 'Cones', estoqueMinimo: 15, fornecedor: 'Acabamento Pro', valorUnit: 24.0, status: 'Normal' },
  { id: 8, item: 'Espiral Plástico 20mm', categoria: 'Acabamento', quantidade: 350, unidade: 'Unid', estoqueMinimo: 200, fornecedor: 'Acabamento Pro', valorUnit: 0.85, status: 'Normal' },
];

export const painelEstrategico = {
  ticketMedio: 2572.06,
  ticketMedioAnterior: 2190.0,
  produtoMaisVendido: 'Folder A4 - 4x4',
  produtoMaisVendidoQtd: 45200,
  clienteQueMaisCompra: 'Construtora Horizonte',
  clienteQueMaisCompraValor: 18400.0,
  taxaConversaoOrcamentos: 68.5,
  prazoMedioEntrega: 7.2,
  produtosPorCategoria: [
    { categoria: 'Folders', valor: 28400 },
    { categoria: 'Banners', valor: 19800 },
    { categoria: 'Catálogos', valor: 17200 },
    { categoria: 'Embalagens', valor: 11500 },
    { categoria: 'Cartões', valor: 6200 },
    { categoria: 'Outros', valor: 4350 },
  ],
  topClientes: [
    { cliente: 'Construtora Horizonte', valor: 18400, pedidos: 7 },
    { cliente: 'Prefeitura Municipal', valor: 12500, pedidos: 1 },
    { cliente: 'Escola Futuro Brilhante', valor: 9800, pedidos: 3 },
    { cliente: 'Supermercado União', valor: 7600, pedidos: 8 },
    { cliente: 'Clínica Saúde Plena', valor: 5200, pedidos: 5 },
  ],
};

export const dadosMensaisFinanceiro = [
  { mes: 'Jan', mesNum: 1, faturamento: 52000, custos: 31200, lucro: 20800 },
  { mes: 'Fev', mesNum: 2, faturamento: 61000, custos: 35380, lucro: 25620 },
  { mes: 'Mar', mesNum: 3, faturamento: 55000, custos: 33000, lucro: 22000 },
  { mes: 'Abr', mesNum: 4, faturamento: 67000, custos: 38190, lucro: 28810 },
  { mes: 'Mai', mesNum: 5, faturamento: 72000, custos: 40320, lucro: 31680 },
  { mes: 'Jun', mesNum: 6, faturamento: 68000, custos: 38760, lucro: 29240 },
  { mes: 'Jul', mesNum: 7, faturamento: 81000, custos: 45360, lucro: 35640 },
  { mes: 'Ago', mesNum: 8, faturamento: 74000, custos: 42180, lucro: 31820 },
  { mes: 'Set', mesNum: 9, faturamento: 87450, custos: 49347, lucro: 38103 },
  { mes: 'Out', mesNum: 10, faturamento: 0, custos: 0, lucro: 0 },
  { mes: 'Nov', mesNum: 11, faturamento: 0, custos: 0, lucro: 0 },
  { mes: 'Dez', mesNum: 12, faturamento: 0, custos: 0, lucro: 0 },
];

export const metasTrimestraisFinanceiro = [
  {
    trimestre: 'Q1',
    periodo: 'Jan — Mar',
    meses: 'Janeiro a Março',
    metaFaturamento: 195000,
    realizadoFaturamento: 168000,
    metaReducaoCustos: 10,
    realizadoReducaoCustos: 8.2,
    status: 'Encerrado',
  },
  {
    trimestre: 'Q2',
    periodo: 'Abr — Jun',
    meses: 'Abril a Junho',
    metaFaturamento: 220000,
    realizadoFaturamento: 207000,
    metaReducaoCustos: 12,
    realizadoReducaoCustos: 11.5,
    status: 'Encerrado',
  },
  {
    trimestre: 'Q3',
    periodo: 'Jul — Set',
    meses: 'Julho a Setembro',
    metaFaturamento: 260000,
    realizadoFaturamento: 242450,
    metaReducaoCustos: 15,
    realizadoReducaoCustos: 9.8,
    status: 'Em andamento',
  },
  {
    trimestre: 'Q4',
    periodo: 'Out — Dez',
    meses: 'Outubro a Dezembro',
    metaFaturamento: 290000,
    realizadoFaturamento: 0,
    metaReducaoCustos: 18,
    realizadoReducaoCustos: 0,
    status: 'Futuro',
  },
];

export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  custo: number;
  preco: number;
  margem: number;
  unidade: string;
  descricao: string;
  ativo: boolean;
}
