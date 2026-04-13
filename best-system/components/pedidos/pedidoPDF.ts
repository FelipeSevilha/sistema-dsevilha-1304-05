import { Pedido } from '@/lib/supabase';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR');
};

const statusColors: Record<string, string> = {
  Aguardando: '#f59e0b',
  'Em Andamento': '#3b82f6',
  'Em Produção': '#8b5cf6',
  'Em Acabamento': '#0ea5e9',
  Pronto: '#10b981',
  Entregue: '#059669',
  Atrasado: '#ef4444',
  Cancelado: '#6b7280',
};

export function gerarPedidoPDF(pedido: Pedido): void {
  const color = statusColors[pedido.status] ?? '#6b7280';
  const hoje = new Date().toLocaleDateString('pt-BR');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Pedido ${pedido.numero}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; font-size: 13px; }
  .page { max-width: 760px; margin: 0 auto; padding: 40px 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 24px; margin-bottom: 28px; }
  .brand { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .brand span { color: #0ea5e9; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 20px; font-weight: 700; color: #0f172a; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 15px; color: #0ea5e9; font-weight: 700; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: #fff; background: ${color}; margin-top: 6px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; }
  .meta-card .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; }
  .meta-card .value { font-size: 14px; font-weight: 600; color: #1e293b; }
  .meta-card .value.mono { font-family: 'Courier New', monospace; color: #0ea5e9; }
  .meta-card .value.large { font-size: 18px; font-weight: 800; color: #0f172a; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  .detail-table th { background: #f1f5f9; text-align: left; padding: 8px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  .detail-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
  .detail-table tr:last-child td { border-bottom: none; }
  .detail-table .text-right { text-align: right; }
  .total-row { background: #f0f9ff; }
  .total-row td { font-weight: 700; color: #0f172a; font-size: 14px; border-bottom: none !important; }
  .obs-box { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin-bottom: 28px; }
  .obs-box p { color: #475569; line-height: 1.6; }
  .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .footer p { font-size: 11px; color: #94a3b8; }
  .delayed-warn { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; color: #b91c1c; font-size: 12px; font-weight: 600; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">DS<span>Evilha</span> ERP</div>
      <p style="color:#64748b;font-size:11px;margin-top:4px;">Sistema de Gestão Empresarial</p>
    </div>
    <div class="doc-title">
      <h1>Pedido de Produção</h1>
      <div class="num">${pedido.numero}</div>
      <div class="status-badge">${pedido.status.toUpperCase()}</div>
    </div>
  </div>

  ${pedido.status === 'Atrasado' ? `<div class="delayed-warn">⚠ PEDIDO EM ATRASO — Prazo: ${fmtDate(pedido.prazo)}</div>` : ''}

  <div class="meta-grid">
    <div class="meta-card">
      <div class="label">Cliente</div>
      <div class="value">${pedido.cliente_nome}</div>
    </div>
    <div class="meta-card">
      <div class="label">Data do pedido</div>
      <div class="value">${fmtDate(pedido.created_at)}</div>
    </div>
    <div class="meta-card">
      <div class="label">Prazo de entrega</div>
      <div class="value">${fmtDate(pedido.prazo)}</div>
    </div>
    <div class="meta-card">
      <div class="label">Orçamento vinculado</div>
      <div class="value mono">${pedido.orcamento_numero || '—'}</div>
    </div>
  </div>

  <p class="section-title">Itens do Pedido</p>
  <table class="detail-table">
    <thead>
      <tr>
        <th>Descrição</th>
        <th class="text-right" style="width:80px">Qtd</th>
        <th class="text-right" style="width:130px">Valor Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${pedido.produto}</td>
        <td class="text-right">${pedido.quantidade.toLocaleString('pt-BR')}</td>
        <td class="text-right">${fmt(pedido.valor)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2" class="text-right" style="font-size:12px;color:#64748b;">Total do Pedido</td>
        <td class="text-right">${fmt(pedido.valor)}</td>
      </tr>
    </tbody>
  </table>

  ${pedido.observacoes ? `
  <p class="section-title">Observações</p>
  <div class="obs-box"><p>${pedido.observacoes}</p></div>
  ` : ''}

  <div class="footer">
    <p>Emitido em ${hoje}</p>
    <p>DSEvilha ERP — Documento gerado automaticamente</p>
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}
