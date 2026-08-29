/**
 * O ponto de equilíbrio de um evento próprio.
 *
 * Quem organiza torneio decide no escuro por um motivo específico: o custo é
 * quase todo conhecido e quase todo antecipado — arbitragem, troféu, estrutura,
 * mídia —, enquanto a receita depende de gente que ainda não se inscreveu. A
 * conta que fecha esse escuro é velha e simples, e mesmo assim quase ninguém a
 * faz antes de abrir inscrição.
 *
 * Três respostas saem daqui, em ordem de importância:
 *
 * 1. **Quantas inscrições pagam o evento.** Custo fixo dividido pela margem de
 *    contribuição de cada inscrição. É um número inteiro, e ele deveria estar
 *    escrito antes do primeiro post.
 *
 * 2. **Se ele cabe.** Ponto de equilíbrio acima da capacidade é o achado que
 *    salva a temporada: o evento não perde por venda fraca, perde por
 *    desenho — e nenhuma campanha de inscrição conserta isso. Ou o custo cai,
 *    ou a cota entra, ou o preço sobe.
 *
 * 3. **Quanto do seu dinheiro fica exposto.** Custo fixo menos patrocínio
 *    assinado é o que você paga antes de saber quantos vêm. Com dívida a 15%
 *    ao mês, esse número é a diferença entre um evento e uma aposta.
 *
 * E uma regra de decisão que contraria a intuição: na hora de seguir ou
 * cancelar, **o que já foi pago não entra na conta.** Só o que ainda dá para
 * evitar. Ver isso escrito é o que impede a decisão de "já gastei tanto que
 * agora tenho que ir até o fim".
 */
import type { PlanoEvento, CustoEvento } from '../tipos';

export interface ResultadoEmVolume {
  inscritos: number;
  receita: number;
  custo: number;
  lucro: number;
  ocupacao: number;
}

export interface AnaliseEvento {
  custoFixo: number;
  custoPorInscrito: number;
  /** O que já foi contratado e não volta se cancelar. */
  comprometido: number;
  /** Receita que não depende de inscrição: cota assinada e outras entradas. */
  receitaGarantida: number;
  /** Preço menos o custo de cada inscrição. É o que sobra para pagar o fixo. */
  margemContribuicao: number;
  /** Quantas inscrições pagam o evento. */
  pontoDeEquilibrio: number;
  /** Fração da capacidade que o ponto de equilíbrio consome. */
  ocupacaoNecessaria: number;
  /** Verdadeiro quando nem lotado o evento se paga. O achado que salva a temporada. */
  impossivel: boolean;
  /** Cada inscrição a mais dá prejuízo — preço abaixo do próprio custo. */
  margemNegativa: boolean;
  /** Quanto de cota faltaria para o evento fechar mesmo lotado. */
  patrocinioFaltante: number;
  /** Custo fixo menos cota assinada: o seu dinheiro exposto. */
  capitalEmRisco: number;
  faltamInscritos: number;
  /** Quanto acima do ponto de equilíbrio você já está, em fração. */
  margemDeSeguranca: number;
  agora: ResultadoEmVolume;
  lotado: ResultadoEmVolume;
  cenarios: ResultadoEmVolume[];
}

export const somaCustos = (custos: CustoEvento[], tipo: CustoEvento['tipo']) =>
  custos.filter((c) => c.tipo === tipo).reduce((s, c) => s + c.valor, 0);

export function analisar(p: PlanoEvento): AnaliseEvento {
  const custoFixo = somaCustos(p.custos, 'fixo');
  const custoPorInscrito = somaCustos(p.custos, 'porInscrito');
  const comprometido = p.custos.filter((c) => c.comprometido)
    .reduce((s, c) => s + (c.tipo === 'fixo' ? c.valor : c.valor * p.inscritos), 0);

  // Só entra o que está assinado. Cota em negociação não paga arbitragem.
  const receitaGarantida = p.patrocinioContratado + (p.outrasReceitas || 0);
  const margemContribuicao = p.precoInscricao - custoPorInscrito;
  const aCobrir = custoFixo - receitaGarantida;

  const margemNegativa = margemContribuicao <= 0;
  const pontoDeEquilibrio = aCobrir <= 0
    ? 0
    : margemNegativa
      ? Infinity
      : Math.ceil(aCobrir / margemContribuicao);

  const emVolume = (inscritos: number): ResultadoEmVolume => {
    const receita = receitaGarantida + inscritos * p.precoInscricao;
    const custo = custoFixo + inscritos * custoPorInscrito;
    return {
      inscritos,
      receita,
      custo,
      lucro: receita - custo,
      ocupacao: p.capacidade > 0 ? inscritos / p.capacidade : 0,
    };
  };

  const lotado = emVolume(p.capacidade);
  const impossivel = lotado.lucro < 0;

  return {
    custoFixo,
    custoPorInscrito,
    comprometido,
    receitaGarantida,
    margemContribuicao,
    pontoDeEquilibrio,
    ocupacaoNecessaria: p.capacidade > 0 ? pontoDeEquilibrio / p.capacidade : Infinity,
    impossivel,
    margemNegativa,
    patrocinioFaltante: impossivel ? -lotado.lucro : 0,
    capitalEmRisco: Math.max(0, custoFixo - p.patrocinioContratado),
    faltamInscritos: Number.isFinite(pontoDeEquilibrio)
      ? Math.max(0, pontoDeEquilibrio - p.inscritos)
      : Infinity,
    margemDeSeguranca: p.inscritos > 0 && Number.isFinite(pontoDeEquilibrio)
      ? (p.inscritos - pontoDeEquilibrio) / p.inscritos
      : 0,
    agora: emVolume(p.inscritos),
    lotado,
    cenarios: [0.5, 0.75, 1].map((f) => emVolume(Math.round(p.capacidade * f))),
  };
}

/**
 * Seguir ou cancelar, com o custo afundado fora da conta.
 *
 * A pergunta certa não é "já gastei quanto?", é **"o que ainda dá para
 * evitar?"**. O que foi pago some dos dois lados da comparação: ele acontece
 * realizando e acontece cancelando, então não separa as opções.
 *
 * O que separa é: a receita que ainda entra cobre os custos que ainda vão
 * sair? Se cobre, realizar é melhor que cancelar mesmo com prejuízo no papel —
 * porque o prejuízo já existe e realizar o diminui.
 */
export function seguirOuCancelar(p: PlanoEvento, inscritosEsperados = p.inscritos) {
  const a = analisar(p);
  const receitaAindaAEntrar = inscritosEsperados * p.precoInscricao + a.receitaGarantida;
  const fixoEvitavel = p.custos
    .filter((c) => c.tipo === 'fixo' && !c.comprometido)
    .reduce((s, c) => s + c.valor, 0);
  const custoAindaEvitavel = fixoEvitavel + inscritosEsperados * a.custoPorInscrito;

  // Cancelando, a cota não entra: patrocínio se paga contra evento realizado.
  // Sobra o que já foi comprometido, e ele vira perda limpa.
  const perdaSeCancelar = a.comprometido;
  const resultadoSeRealizar = receitaAindaAEntrar - a.custoFixo - inscritosEsperados * a.custoPorInscrito;

  return {
    inscritosEsperados,
    custoAfundado: a.comprometido,
    receitaAindaAEntrar,
    custoAindaEvitavel,
    /** Realizar melhora o resultado em relação a cancelar? */
    valeRealizar: receitaAindaAEntrar > custoAindaEvitavel,
    /** Quanto realizar melhora em relação a cancelar. Negativo = cancelar é melhor. */
    diferenca: receitaAindaAEntrar - custoAindaEvitavel,
    perdaSeCancelar,
    resultadoSeRealizar,
  };
}

/**
 * O preço que faria o evento fechar na ocupação que você espera de verdade.
 *
 * Existe porque o erro mais caro em torneio amador não é gastar demais — é
 * precificar pela primeira edição e nunca mais mexer, enquanto arbitragem,
 * troféu e estrutura sobem todo ano.
 */
export function precoDeEquilibrio(p: PlanoEvento, ocupacaoEsperada = 0.8) {
  const a = analisar(p);
  const inscritos = Math.max(1, Math.round(p.capacidade * ocupacaoEsperada));
  const preciso = (a.custoFixo - a.receitaGarantida) / inscritos + a.custoPorInscrito;
  return {
    inscritos,
    preco: Math.max(0, preciso),
    diferenca: Math.max(0, preciso) - p.precoInscricao,
  };
}

/** O total de um portfólio de eventos — a pergunta "a temporada fecha?". */
export function resumoDaTemporada(planos: PlanoEvento[]) {
  const vivos = planos.filter((p) => p.status === 'confirmado' || p.status === 'rascunho');
  const analises = vivos.map((p) => ({ plano: p, a: analisar(p) }));
  return {
    quantidade: vivos.length,
    capitalEmRisco: analises.reduce((s, x) => s + x.a.capitalEmRisco, 0),
    resultadoAgora: analises.reduce((s, x) => s + x.a.agora.lucro, 0),
    resultadoLotado: analises.reduce((s, x) => s + x.a.lotado.lucro, 0),
    /** Os que não fecham nem lotados. Estes precisam de decisão, não de esforço. */
    impossiveis: analises.filter((x) => x.a.impossivel).map((x) => x.plano),
  };
}
