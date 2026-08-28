/**
 * Agregações do mês a partir dos lançamentos.
 *
 * A conta que importa não é "quanto entrou", é **quanto entrou de recorrente
 * contra o piso de custo fixo**. Um mês bom de evento avulso esconde que a base
 * não mudou — e a base é o que paga o mês seguinte.
 */
import type { Lancamento, OrigemReceita } from '../tipos';
import { mesDe, mesRelativo } from '../formato';

export interface ResumoMes {
  mes: string;
  entradas: number;
  saidas: number;
  sobra: number;
  porOrigem: Record<OrigemReceita, number>;
  /** fixa + recorrente: a parte da receita com que dá para contar. */
  previsivel: number;
  saidasFixas: number;
  saidasVariaveis: number;
  porCategoria: { categoria: string; valor: number }[];
  lancamentos: Lancamento[];
}

export function resumoDoMes(lancamentos: Lancamento[], mes: string): ResumoMes {
  const doMes = lancamentos.filter((l) => mesDe(l.data) === mes);
  const porOrigem: Record<OrigemReceita, number> = { fixa: 0, recorrente: 0, avulsa: 0 };
  const cats = new Map<string, number>();
  let entradas = 0, saidas = 0, saidasFixas = 0;

  for (const l of doMes) {
    if (l.tipo === 'entrada') {
      entradas += l.valor;
      porOrigem[l.origem || 'avulsa'] += l.valor;
    } else {
      saidas += l.valor;
      if (l.fixo) saidasFixas += l.valor;
      cats.set(l.categoria, (cats.get(l.categoria) || 0) + l.valor);
    }
  }

  return {
    mes,
    entradas,
    saidas,
    sobra: entradas - saidas,
    porOrigem,
    previsivel: porOrigem.fixa + porOrigem.recorrente,
    saidasFixas,
    saidasVariaveis: saidas - saidasFixas,
    porCategoria: [...cats.entries()]
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor),
    lancamentos: doMes.sort((a, b) => b.data.localeCompare(a.data)),
  };
}

export function serieDeMeses(lancamentos: Lancamento[], mesFinal: string, quantos = 6) {
  const saida: ResumoMes[] = [];
  for (let i = quantos - 1; i >= 0; i--) saida.push(resumoDoMes(lancamentos, mesRelativo(mesFinal, -i)));
  return saida;
}

export const CATEGORIAS_SAIDA = [
  'Moradia', 'Comida', 'Combustível', 'Carro', 'Dívida / juros', 'Seguro',
  'Consórcio', 'Filha', 'Saúde', 'Academia', 'Estudo', 'Assinaturas',
  'Evento / operação', 'Lazer', 'Outros',
];

export const CATEGORIAS_ENTRADA = [
  'Gestão de arena', 'Torneio próprio', 'Evento contratado', 'Patrocínio',
  'Comissão', 'Consultoria', 'Outros',
];
