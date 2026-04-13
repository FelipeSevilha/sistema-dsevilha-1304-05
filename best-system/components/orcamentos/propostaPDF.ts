interface OrcamentoItemPDF {
  id: string | number;
  descricao: string;
  quantidade: number;
  valorUnit: number;
}

interface Orcamento {
  id: string;
  numero: string;
  cliente: string;
  produto: string;
  itens: OrcamentoItemPDF[];
  valor: number;
  criacao: string;
  validade: string;
  status: string;
  obs: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function imprimirProposta(orcamento: Orcamento) {
  const itensHTML = orcamento.itens.map((item, i) => `
    <tr style="background: ${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding: 10px 14px; font-size: 13px; color: #334155;">${item.descricao}</td>
      <td style="padding: 10px 14px; text-align: center; font-size: 13px; color: #475569;">${item.quantidade.toLocaleString('pt-BR')}</td>
      <td style="padding: 10px 14px; text-align: right; font-size: 13px; color: #475569;">${fmt(item.valorUnit)}</td>
      <td style="padding: 10px 14px; text-align: right; font-size: 13px; font-weight: 600; color: #1e293b;">${fmt(item.quantidade * item.valorUnit)}</td>
    </tr>
  `).join('');

  const dataFormatada = new Date(orcamento.criacao + 'T00:00:00').toLocaleDateString('pt-BR');
  const validadeFormatada = new Date(orcamento.validade + 'T00:00:00').toLocaleDateString('pt-BR');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Proposta Comercial — ${orcamento.numero}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 40px 60px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #0ea5e9; }
    .logo-area h1 { font-size: 22px; font-weight: 800; color: #0ea5e9; letter-spacing: -0.5px; }
    .logo-area p { font-size: 11px; color: #64748b; margin-top: 3px; }
    .proposta-info { text-align: right; }
    .proposta-info .numero { font-size: 22px; font-weight: 700; color: #1e293b; }
    .proposta-info .tipo { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .proposta-info .datas { font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.7; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 10px; }
    .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; }
    .client-box .name { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
    .client-box .sub { font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
    .table-header th { background: #0ea5e9; color: #fff; padding: 11px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .table-header th:not(:first-child) { text-align: right; }
    .table-header th:nth-child(2) { text-align: center; }
    .total-row td { padding: 13px 14px; font-size: 15px; font-weight: 800; background: #0f172a; color: #fff; }
    .total-row td:last-child { text-align: right; }
    .obs-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 18px; }
    .obs-box p { font-size: 13px; color: #92400e; line-height: 1.6; }
    .validade-banner { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; }
    .validade-banner .label { font-size: 12px; color: #0369a1; font-weight: 600; }
    .validade-banner .date { font-size: 14px; color: #0369a1; font-weight: 700; }
    .signature-area { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
    .sig-line { border-top: 1px solid #cbd5e1; padding-top: 8px; }
    .sig-line .name { font-size: 12px; font-weight: 600; color: #475569; }
    .sig-line .role { font-size: 11px; color: #94a3b8; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-area">
        <h1>Gráfica D'Sevilha</h1>
        <p>Soluções Gráficas Profissionais</p>
        <p style="margin-top:8px; font-size:11px; color:#94a3b8;">CNPJ: 00.000.000/0001-00 | contato@graficadesevilha.com.br</p>
      </div>
      <div class="proposta-info">
        <div class="tipo">Proposta Comercial</div>
        <div class="numero">${orcamento.numero}</div>
        <div class="datas">
          Emissão: ${dataFormatada}<br/>
          Validade: ${validadeFormatada}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Cliente</div>
      <div class="client-box">
        <div class="name">${orcamento.cliente}</div>
        <div class="sub">Proposta referente a: ${orcamento.produto}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Itens da Proposta</div>
      <table>
        <thead class="table-header">
          <tr>
            <th style="text-align:left; border-radius:8px 0 0 0;">Descrição</th>
            <th>Qtd</th>
            <th>Valor Unitário</th>
            <th style="border-radius:0 8px 0 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">Valor Total da Proposta</td>
            <td>${fmt(orcamento.valor)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="section">
      <div class="validade-banner">
        <span class="label">Esta proposta é válida até:</span>
        <span class="date">${validadeFormatada}</span>
      </div>
    </div>

    ${orcamento.obs ? `
    <div class="section">
      <div class="section-title">Observações</div>
      <div class="obs-box">
        <p>${orcamento.obs}</p>
      </div>
    </div>
    ` : ''}

    <div class="signature-area">
      <div class="sig-line">
        <div class="name">Gráfica D'Sevilha</div>
        <div class="role">Responsável Comercial</div>
      </div>
      <div class="sig-line">
        <div class="name">${orcamento.cliente}</div>
        <div class="role">Cliente — Aprovação</div>
      </div>
    </div>

    <div class="footer">
      Proposta gerada pelo sistema ERP — Gráfica D'Sevilha &bull; ${new Date().toLocaleDateString('pt-BR')}
    </div>
  </div>
  <script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
