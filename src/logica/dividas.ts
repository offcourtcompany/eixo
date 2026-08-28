/**
 * Simulação de quitação de dívida — bola de neve x avalanche.
 *
 * Bola de neve (Ramsey, *Total Money Makeover*): ataca o menor saldo primeiro.
 * Custa mais juros, mas entrega vitórias rápidas — e o comportamento é o que
 * quebra na prática, não a matemática.
 *
 * Avalanche: ataca a maior taxa primeiro. É sempre o mais barato em juros.
 *
 * O app mostra os dois lado a lado justamente porque a diferença de custo entre
 * eles é a informação que decide. Quando ela é pequena, escolha a que você
 * consegue sustentar; quando é grande, a avalanche paga o desconforto.
 */
import type { Divida } from '../tipos';

export type Estrategia = 'bola-de-neve' | 'avalanche';

export interface MesSimulado {
  mes: number;              // 1 = próximo mês
  juros: number;
  amortizado: number;
  saldoFinal: number;
  quitou: string[];         // nomes quitados neste mês
}

export interface Simulacao {
  estrategia: Estrategia;
  viavel: boolean;
  /** Quando não é viável: quanto falta por mês só para cobrir os juros. */
  faltaPorMes: number;
  meses: number;
  jurosTotais: number;
  totalPago: number;
  linha: MesSimulado[];
  ordem: string[];          // ordem de ataque
}

const LIMITE_MESES = 600;

export function jurosMensaisDe(dividas: Divida[]) {
  return dividas.filter((d) => d.ativa).reduce((s, d) => s + d.saldo * d.taxaMensal, 0);
}

export function saldoTotal(dividas: Divida[]) {
  return dividas.filter((d) => d.ativa).reduce((s, d) => s + d.saldo, 0);
}

/**
 * @param aporteMensal total disponível por mês para TODAS as dívidas
 *                     (mínimos somados + o que sobrar).
 */
export function simular(dividas: Divida[], aporteMensal: number, estrategia: Estrategia): Simulacao {
  const ativas = dividas
    .filter((d) => d.ativa && d.saldo > 0)
    .map((d) => ({ nome: d.nome, saldo: d.saldo, taxa: d.taxaMensal, minima: d.parcelaMinima }));

  const vazio: Simulacao = {
    estrategia, viavel: true, faltaPorMes: 0, meses: 0,
    jurosTotais: 0, totalPago: 0, linha: [], ordem: [],
  };
  if (!ativas.length) return vazio;

  // O aporte precisa, no mínimo, cobrir os juros do primeiro mês. Abaixo disso
  // o saldo cresce todo mês e não existe data de quitação — dizer isso é mais
  // útil que devolver "600 meses".
  const jurosIniciais = ativas.reduce((s, d) => s + d.saldo * d.taxa, 0);
  if (aporteMensal <= jurosIniciais) {
    return { ...vazio, viavel: false, faltaPorMes: jurosIniciais - aporteMensal + 1, ordem: [] };
  }

  const ordenar = (lista: typeof ativas) =>
    [...lista].sort((a, b) =>
      estrategia === 'bola-de-neve' ? a.saldo - b.saldo : b.taxa - a.taxa);

  const ordem = ordenar(ativas).map((d) => d.nome);
  const linha: MesSimulado[] = [];
  let jurosTotais = 0;
  let totalPago = 0;

  for (let mes = 1; mes <= LIMITE_MESES; mes++) {
    const abertas = ativas.filter((d) => d.saldo > 0.005);
    if (!abertas.length) break;

    // 1. Juros do mês entram no saldo.
    let jurosMes = 0;
    for (const d of abertas) {
      const j = d.saldo * d.taxa;
      d.saldo += j;
      jurosMes += j;
    }
    jurosTotais += jurosMes;

    // 2. Mínimos primeiro (mantém tudo em dia), depois todo o resto no alvo.
    let disponivel = aporteMensal;
    for (const d of abertas) {
      const pago = Math.min(d.saldo, Math.min(d.minima, disponivel));
      d.saldo -= pago;
      disponivel -= pago;
    }
    for (const d of ordenar(abertas)) {
      if (disponivel <= 0) break;
      const pago = Math.min(d.saldo, disponivel);
      d.saldo -= pago;
      disponivel -= pago;
    }

    const gasto = aporteMensal - disponivel;
    totalPago += gasto;
    const quitou = abertas.filter((d) => d.saldo <= 0.005).map((d) => d.nome);

    linha.push({
      mes,
      juros: jurosMes,
      amortizado: gasto - jurosMes,
      saldoFinal: ativas.reduce((s, d) => s + Math.max(0, d.saldo), 0),
      quitou,
    });
  }

  return {
    estrategia, viavel: true, faltaPorMes: 0,
    meses: linha.length, jurosTotais, totalPago, linha, ordem,
  };
}

/** O custo de escolher o conforto: quanto a bola de neve cobra a mais. */
export function comparar(dividas: Divida[], aporteMensal: number) {
  const neve = simular(dividas, aporteMensal, 'bola-de-neve');
  const aval = simular(dividas, aporteMensal, 'avalanche');
  return {
    neve,
    aval,
    custoDoConforto: neve.viavel && aval.viavel ? neve.jurosTotais - aval.jurosTotais : 0,
    mesesAMais: neve.viavel && aval.viavel ? neve.meses - aval.meses : 0,
  };
}
