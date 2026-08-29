/**
 * O imposto, onde ele realmente machuca: em cima da receita, não do lucro.
 *
 * Este módulo existe por causa de um erro de conta que aparece em quase todo
 * evento amador, e que estava dentro deste app até agora. A intuição diz "o
 * imposto sai do lucro, então se eu empatar não pago nada". No Simples
 * Nacional não é assim: o DAS incide sobre a **receita bruta do mês**. Um
 * evento que gira R$ 20.000 e devolve R$ 6.000 de margem paga imposto sobre os
 * 20.000 — perto de R$ 1.200 na primeira faixa do Anexo III, que é **20% da
 * margem**, não 6% dela. Um evento desenhado para empatar termina no vermelho
 * exatamente por esse valor.
 *
 * Por isso a alíquota entra em todo lugar em que o app promete um número de
 * decisão: ponto de equilíbrio, preço, capital exposto e projeção de caixa.
 *
 * ── O que este módulo NÃO é ─────────────────────────────────────────────
 *
 * Não é apuração. Não substitui contador, não emite guia, não sabe o seu RBT12
 * e não decide anexo. É uma **régua de decisão**: quanto do que entra não é
 * seu. A alíquota é um número que você digita porque alguém que apura te
 * disse qual é — e é o único jeito honesto, porque a alíquota efetiva do
 * Simples sobe com o faturamento dos últimos 12 meses e muda de anexo pelo
 * Fator R (folha abaixo de 28% da receita joga serviço do Anexo III para o
 * Anexo V, e a conta praticamente dobra).
 *
 * O padrão de 6% é a primeira faixa do Anexo III, que é onde começa quem
 * fatura até R$ 180 mil em doze meses. É um chute defensável para não deixar a
 * conta zerada; não é a sua alíquota até você confirmar.
 */
import type { Lancamento, Perfil } from '../tipos';
import { hoje, mesDe, mesRelativo } from '../formato';

/** Anexo III, primeira faixa (RBT12 até R$ 180 mil). Ponto de partida, não verdade. */
export const ALIQUOTA_PADRAO = 0.06;

/** O DAS vence no dia 20 do mês seguinte ao da receita. */
export const DIA_DO_DAS = 20;

/** Nunca deixa a conta explodir por um campo digitado errado. */
export const limitar = (a: number) => Math.min(0.9, Math.max(0, a || 0));

export function aliquotaDe(perfil?: Perfil, override?: number) {
  if (override !== undefined) return limitar(override);
  if (perfil?.aliquotaImposto !== undefined) return limitar(perfil.aliquotaImposto);
  return ALIQUOTA_PADRAO;
}

/** Quanto do que entrou é do governo. */
export const imposto = (receitaBruta: number, aliq: number) => receitaBruta * limitar(aliq);

/** O que sobra de uma receita depois do imposto. */
export const liquido = (receitaBruta: number, aliq: number) => receitaBruta * (1 - limitar(aliq));

/**
 * O caminho inverso: quanto preciso faturar para me sobrar tanto.
 *
 * É a conta que quase ninguém faz na hora de repassar imposto ao preço. Para
 * sobrar R$ 100 com 6%, o preço não é R$ 106 — é R$ 106,38. Somar a alíquota
 * ao preço deixa um furo pequeno em cada inscrição e grande no evento inteiro.
 */
export const bruto = (liquidoDesejado: number, aliq: number) => liquidoDesejado / (1 - limitar(aliq));

/** A data em que o DAS daquele mês de receita vence. */
export function vencimentoDoDas(mes: string) {
  return `${mesRelativo(mes, 1)}-${String(DIA_DO_DAS).padStart(2, '0')}`;
}

export interface ReservaDeImposto {
  aliquota: number;
  /** Verdadeiro quando a alíquota é o padrão, não uma que você confirmou. */
  presumida: boolean;
  /** Receita bruta do mês corrente até hoje. */
  receitaDoMes: number;
  /** O que essa receita já gerou de imposto — o dinheiro que não é seu. */
  aGuardar: number;
  /** A receita do mês passado e o DAS que ela gerou. */
  receitaAnterior: number;
  aPagar: number;
  /** Quando o DAS do mês passado vence. */
  venceEm: string;
  /** Entradas marcadas como fora do CNPJ — ficaram fora de tudo isto. */
  foraDaBase: number;
}

/**
 * Quanto do que entrou este mês já é do imposto.
 *
 * A pergunta que isto responde não é contábil, é de caixa: no dia 20 sai uma
 * guia, e ela é proporcional ao mês que passou — justamente ao mês bom. Quem
 * organiza evento quebra depois da temporada boa, não durante a fraca, e é
 * quase sempre por isto: o mês de R$ 40 mil paga um DAS que chega quando a
 * conta já voltou ao normal.
 */
export function reservaDeImposto(
  lancamentos: Lancamento[],
  perfil?: Perfil,
  data = hoje(),
): ReservaDeImposto {
  const aliq = aliquotaDe(perfil);
  const mes = mesDe(data);
  const anterior = mesRelativo(mes, -1);

  const receitaDe = (m: string) => lancamentos
    .filter((l) => l.tipo === 'entrada' && !l.foraDoCnpj && mesDe(l.data) === m)
    .reduce((s, l) => s + l.valor, 0);

  const receitaDoMes = receitaDe(mes);
  const receitaAnterior = receitaDe(anterior);

  return {
    aliquota: aliq,
    presumida: perfil?.aliquotaImposto === undefined,
    receitaDoMes,
    aGuardar: imposto(receitaDoMes, aliq),
    receitaAnterior,
    aPagar: imposto(receitaAnterior, aliq),
    venceEm: vencimentoDoDas(anterior),
    foraDaBase: lancamentos
      .filter((l) => l.tipo === 'entrada' && l.foraDoCnpj && mesDe(l.data) === mes)
      .reduce((s, l) => s + l.valor, 0),
  };
}
