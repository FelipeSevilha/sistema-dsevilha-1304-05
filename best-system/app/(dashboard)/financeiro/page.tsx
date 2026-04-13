"use client";

import { useState } from "react";

type TipoConta = "Felipe Pessoal" | "Gráfica Itu" | "Gráfica SP";

type Lancamento = {
  id: number;
  descricao: string;
  valor: number;
  tipo: TipoConta;
  parcelas?: number;
};

export default function FinanceiroPage() {
  const [lista, setLista] = useState<Lancamento[]>([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("Gráfica Itu");
  const [parcelas, setParcelas] = useState(1);

  const adicionar = () => {
    if (!descricao || !valor) return;

    const novos: Lancamento[] = [];

    for (let i = 0; i < parcelas; i++) {
      novos.push({
        id: Date.now() + i,
        descricao: `${descricao} (${i + 1}/${parcelas})`,
        valor: Number(valor),
        tipo,
        parcelas,
      });
    }

    setLista([...lista, ...novos]);
    setDescricao("");
    setValor("");
    setParcelas(1);
  };

  const prefill = (tipo: TipoConta) => {
    setTipo(tipo);
  };

  const totalPorTipo = (t: TipoConta) =>
    lista
      .filter((l) => l.tipo === t)
      .reduce((acc, l) => acc + l.valor, 0);

  return (
    <div style={{ padding: 20 }}>
      <h1>Financeiro</h1>

      {/* BOTÕES */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => prefill("Felipe Pessoal")}>
          Felipe Pessoal
        </button>
        <button onClick={() => prefill("Gráfica Itu")}>
          Gráfica Itu
        </button>
        <button onClick={() => prefill("Gráfica SP")}>
          Gráfica SP
        </button>
      </div>

      {/* FORM */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input
          placeholder="Valor"
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoConta)}
        >
          <option>Felipe Pessoal</option>
          <option>Gráfica Itu</option>
          <option>Gráfica SP</option>
        </select>

        <input
          type="number"
          min={1}
          value={parcelas}
          onChange={(e) => setParcelas(Number(e.target.value))}
        />

        <button onClick={adicionar}>Adicionar</button>
      </div>

      {/* RESUMO */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div>Felipe: R$ {totalPorTipo("Felipe Pessoal")}</div>
        <div>Itu: R$ {totalPorTipo("Gráfica Itu")}</div>
        <div>SP: R$ {totalPorTipo("Gráfica SP")}</div>
      </div>

      {/* LISTA */}
      <table width="100%">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((l) => (
            <tr key={l.id}>
              <td>{l.descricao}</td>
              <td>R$ {l.valor}</td>
              <td>{l.tipo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
