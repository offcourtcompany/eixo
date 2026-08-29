/**
 * Projeção de caixa de 90 dias.
 *
 * O resumo do mês responde "como foi". Esta conta responde a única pergunta que
 * tira o sono de quem vive de evento: **até quando o dinheiro que já existe
 * dura.** Receita de temporada chega em degraus — três meses fortes, dois
 * fracos — enquanto o custo fixo chega todo mês, igual. Quem olha só o mês
 * fechado descobre o buraco quando ele já é presente.
 *
 * Três decisões de desenho, todas na direção de não mentir para o dono:
 *
 * 1. **Duas linhas, nunca uma.** A linha base só conta o que está contratado:
 *    fixos cadastrados, lançamentos já feitos com data à frente, e o gasto
 *    variável que o seu próprio histórico mostra. A segunda linha soma o funil
 *    ponderado. Misturar as duas num número só é como quase toda projeção de
 *    autônomo quebra: o pipeline vira caixa antes de existir.
 *
 * 2. **Só entra o que você disse.** Nenhuma oportunidade entra sem data de
 *    previsão escrita por você. As que não têm são contadas e mostradas — o
 *    vazio aparece como vazio, não como zero.
 *
 * 3. **Nada é inventado onde não há dado.** Sem histórico, o gasto variável é
 *    zero e a projeção se declara não confiável em vez de chutar um número
 *    redondo que pareceria sério.
 */
import type { Lancamento, Recorrente, Divida, Oportunidade, Perfil } from '../tipos';
import { hoje, somaDias, mesDe, mesRelativo, rotuloMes } from '../formato';
import { dataNoMes } from './recorrentes';
import { ETAPAS, emAndamento } from './funil';
import { aliquotaDe, imposto, vencimentoDoDas } from './imposto';

export type FonteMovimento =
  | 'lancado' | 'fixo' | 'divida' | 'variavel' | 'funil'
  /** A guia do mês seguinte, sobre a receita contratada. */
  | 'imposto'
  /** A guia sobre a receita que ainda é só funil — só afeta a linha pontilhada. */
  | 'impostoFunil';

export interface MovimentoPrevisto {
  data: string;
  /** Positivo entra, negativo sai. */
  valor: number;
  rotulo: string;
  fonte: FonteMovimento;
  /** Entrada que compõe a base do imposto do mês. */
  tributavel?: boolean;
}

export interface DiaDeCaixa {
  data: string;
  /** Saldo ao fim do dia contando só o contratado. */
  saldo: number;
  /** ...e somando o funil ponderado. */
  comFunil: number;
  /** Os movimentos com nome deste dia. O gasto diluído não entra aqui. */
  movimentos: MovimentoPrevisto[];
}

export interface Projecao {
  saldoInicial: number;
  /** Falso quando a reserva atual não foi informada: a linha vira variação. */
  temSaldo: boolean;
  dias: DiaDeCaixa[];
  /** O primeiro dia em que a linha base cruza o zero. A data do aperto. */
  aperto?: string;
  menorSaldo: number;
  menorSaldoEm: string;
  saldoFinal: number;
  entradas: number;
  saidas: number;
  /** Quanto de receita nova precisa entrar para a linha base não furar. */
  faltaParaNaoFurar: number;
  /** Gasto variável médio por dia, tirado do seu histórico. */
  variavelDiaria: number;
  mesesDeHistorico: number;
  confiavel: boolean;
  /** As mínimas de dívida entraram? Não entram se já existirem como fixo. */
  incluiuDividas: boolean;
  entradasDoFunil: number;
  /** A alíquota usada sobre a receita bruta, em fração. */
  aliquota: number;
  /** O imposto que sai da linha base dentro da janela — receita já contratada. */
  impostoPrevisto: number;
  /** Oportunidades abertas sem previsão de entrada — não entram em nada. */
  semPrevisao: number;
}

export interface EntradaProjecao {
  lancamentos: Lancamento[];
  recorrentes: Recorrente[];
  dividas: Divida[];
  oportunidades: Oportunidade[];
  /** De onde sai a alíquota do imposto. Sem ele, o app presume a faixa inicial. */
  perfil?: Perfil;
  /** A reserva atual do perfil. Sem ela a projeção vira variação de caixa. */
  saldoInicial?: number;
  horizonte?: number;
  data?: string;
}

/**
 * O gasto variável médio, a partir dos meses fechados.
 *
 * Fica de fora tudo que já é contado de outro jeito: saída marcada como fixa e
 * saída nascida de um fixo cadastrado. O que sobra é o gasto que varia — comida
 * fora, combustível, o imprevisto — que é justamente o que a projeção precisa
 * estimar, porque é o único que ninguém cadastra.
 *
 * Meses fechados, e não os últimos 90 dias corridos, porque mês pela metade
 * puxa a média para baixo e a projeção fica otimista exatamente onde não pode.
 */
export function gastoVariavel(lancamentos: Lancamento[], data = hoje(), meses = 3) {
  const mesCorrente = mesDe(data);
  let total = 0;
  let comDado = 0;

  for (let i = 1; i <= meses; i++) {
    const mes = mesRelativo(mesCorrente, -i);
    const doMes = lancamentos.filter((l) => mesDe(l.data) === mes);
    if (!doMes.length) continue;
    comDado++;
    total += doMes
      .filter((l) => l.tipo === 'saida' && !l.fixo && !l.deRecorrente)
      .reduce((s, l) => s + l.valor, 0);
  }

  return {
    mesesDeHistorico: comDado,
    mensal: comDado ? total / comDado : 0,
    diaria: comDado ? total / comDado / 30 : 0,
    confiavel: comDado >= 2,
  };
}

/**
 * Os movimentos com nome dentro da janela.
 *
 * Guarda contra contar duas vezes: um fixo já gerado como lançamento naquele
 * mês não é projetado de novo. Sem isso, o mês corrente apareceria com o seguro
 * saindo duas vezes.
 */
export function movimentosPrevistos(e: EntradaProjecao): MovimentoPrevisto[] {
  const inicio = e.data || hoje();
  const fim = somaDias(inicio, e.horizonte ?? 90);
  const movimentos: MovimentoPrevisto[] = [];

  // 1. O que você já lançou com data à frente. É o mais confiável que existe.
  for (const l of e.lancamentos) {
    if (l.data <= inicio || l.data > fim) continue;
    movimentos.push({
      data: l.data,
      valor: l.tipo === 'entrada' ? l.valor : -l.valor,
      rotulo: l.descricao || l.categoria,
      fonte: 'lancado',
      tributavel: l.tipo === 'entrada' && !l.foraDoCnpj,
    });
  }

  // 2. Os fixos, mês a mês, pulando os que já viraram lançamento.
  const jaGerado = new Set(
    e.lancamentos.filter((l) => l.deRecorrente).map((l) => `${l.deRecorrente}|${mesDe(l.data)}`),
  );
  for (const r of e.recorrentes) {
    if (!r.ativo) continue;
    for (let mes = mesDe(inicio); mes <= mesDe(fim); mes = mesRelativo(mes, 1)) {
      if (jaGerado.has(`${r.id}|${mes}`)) continue;
      const data = dataNoMes(mes, r.diaDoMes);
      if (data <= inicio || data > fim) continue;
      movimentos.push({
        data,
        valor: r.tipo === 'entrada' ? r.valor : -r.valor,
        rotulo: r.nome,
        fonte: 'fixo',
        tributavel: r.tipo === 'entrada' && !r.foraDoCnpj,
      });
    }
  }

  // 3. O funil — só o que tem previsão escrita, e só pelo valor ponderado.
  for (const o of e.oportunidades) {
    if (!emAndamento(o) || !o.previsaoEm) continue;
    if (o.previsaoEm <= inicio || o.previsaoEm > fim) continue;
    movimentos.push({
      data: o.previsaoEm,
      valor: o.valor * ETAPAS[o.etapa].prob,
      rotulo: `${o.empresa} (ponderado)`,
      fonte: 'funil',
      tributavel: true,
    });
  }

  return movimentos.sort((a, b) => a.data.localeCompare(b.data));
}

/**
 * As mínimas de dívida, diluídas por dia.
 *
 * Diluídas, e não numa data, porque o app não sabe o vencimento — e inventar um
 * dia criaria um penhasco falso no gráfico bem no lugar em que você iria olhar
 * para decidir. Num horizonte de noventa dias o efeito no saldo final é o
 * mesmo; o que muda é não dar um susto que não é verdade.
 *
 * E elas só entram se a dívida ainda não estiver cadastrada como fixo: quem já
 * lançou "cartão" nos fixos veria a mesma parcela sair duas vezes.
 */
export function dividaDiluida(dividas: Divida[], recorrentes: Recorrente[]) {
  const jaNosFixos = recorrentes.some(
    (r) => r.ativo && r.tipo === 'saida' && r.categoria === 'Dívida / juros',
  );
  const mensal = dividas.filter((d) => d.ativa && d.saldo > 0).reduce((s, d) => s + d.parcelaMinima, 0);
  return { incluir: !jaNosFixos && mensal > 0, mensal: jaNosFixos ? 0 : mensal, diaria: jaNosFixos ? 0 : mensal / 30 };
}

/**
 * A guia do imposto, saindo no dia em que ela sai de verdade.
 *
 * Esta é a correção de um defeito que a projeção tinha desde o primeiro dia:
 * ela tratava faturado como recebido e inteiro. Não é. Do que entra numa
 * temporada de eventos, uma fatia é do governo, e ela sai **no dia 20 do mês
 * seguinte** — ou seja, o mês bom cobra a conta quando o caixa já voltou ao
 * normal. É assim que produtor de evento quebra depois da temporada boa, e é
 * exatamente o tipo de penhasco que uma projeção de noventa dias existe para
 * mostrar antes.
 *
 * Duas guias saem daqui, e não uma, pelo mesmo motivo das duas linhas do
 * gráfico: o imposto da receita contratada é dívida certa e entra na linha
 * cheia; o da receita que ainda é só funil só existe se o funil virar dinheiro,
 * então acompanha a linha pontilhada. Misturar faria a linha base descer por
 * causa de uma receita que ela nem contou.
 */
export function impostosPrevistos(
  e: EntradaProjecao,
  movimentos: MovimentoPrevisto[],
): MovimentoPrevisto[] {
  const aliq = aliquotaDe(e.perfil);
  if (aliq <= 0) return [];

  const inicio = e.data || hoje();
  const fim = somaDias(inicio, e.horizonte ?? 90);

  const contratada = new Map<string, number>();
  const doFunil = new Map<string, number>();
  const somar = (m: Map<string, number>, mes: string, v: number) => m.set(mes, (m.get(mes) || 0) + v);

  // A receita que já entrou e cuja guia ainda não venceu. É o pedaço que mais
  // surpreende: o mês passado já gerou imposto e ele ainda não saiu.
  for (const l of e.lancamentos) {
    if (l.tipo !== 'entrada' || l.foraDoCnpj || l.data > inicio) continue;
    somar(contratada, mesDe(l.data), l.valor);
  }

  // E a receita projetada. Lançamentos futuros já chegam aqui como movimento.
  for (const m of movimentos) {
    if (!m.tributavel || m.valor <= 0) continue;
    somar(m.fonte === 'funil' ? doFunil : contratada, mesDe(m.data), m.valor);
  }

  const guias: MovimentoPrevisto[] = [];
  const emitir = (base: Map<string, number>, fonte: FonteMovimento) => {
    for (const [mes, receita] of base) {
      const vence = vencimentoDoDas(mes);
      if (vence <= inicio || vence > fim) continue;
      guias.push({
        data: vence,
        valor: -imposto(receita, aliq),
        rotulo: `Imposto da receita de ${rotuloMes(mes)}`,
        fonte,
      });
    }
  };
  emitir(contratada, 'imposto');
  emitir(doFunil, 'impostoFunil');

  return guias;
}

export function projetarCaixa(e: EntradaProjecao): Projecao {
  const inicio = e.data || hoje();
  const horizonte = e.horizonte ?? 90;
  const variavel = gastoVariavel(e.lancamentos, inicio);
  const divida = dividaDiluida(e.dividas, e.recorrentes);
  const movimentos = movimentosPrevistos(e);
  const guias = impostosPrevistos(e, movimentos);
  movimentos.push(...guias);
  movimentos.sort((a, b) => a.data.localeCompare(b.data));

  const porDia = new Map<string, MovimentoPrevisto[]>();
  for (const m of movimentos) {
    const lista = porDia.get(m.data) || [];
    lista.push(m);
    porDia.set(m.data, lista);
  }

  const drenoDiario = variavel.diaria + divida.diaria;
  const saldoInicial = e.saldoInicial ?? 0;

  let saldo = saldoInicial;
  let comFunil = saldoInicial;
  let entradas = 0;
  let saidas = 0;
  let entradasDoFunil = 0;
  let menorSaldo = saldoInicial;
  let menorSaldoEm = inicio;
  let aperto: string | undefined;

  const dias: DiaDeCaixa[] = [];

  for (let i = 1; i <= horizonte; i++) {
    const data = somaDias(inicio, i);
    const doDia = porDia.get(data) || [];

    saldo -= drenoDiario;
    comFunil -= drenoDiario;
    saidas += drenoDiario;

    for (const m of doDia) {
      // O funil e o imposto que ele gera vivem só na linha pontilhada.
      if (m.fonte === 'funil' || m.fonte === 'impostoFunil') {
        comFunil += m.valor;
        if (m.fonte === 'funil') entradasDoFunil += m.valor;
        continue;
      }
      saldo += m.valor;
      comFunil += m.valor;
      if (m.valor >= 0) entradas += m.valor; else saidas += -m.valor;
    }

    if (saldo < menorSaldo) { menorSaldo = saldo; menorSaldoEm = data; }
    if (aperto === undefined && saldo < 0) aperto = data;

    dias.push({ data, saldo, comFunil, movimentos: doDia });
  }

  return {
    saldoInicial,
    temSaldo: e.saldoInicial !== undefined,
    dias,
    aperto,
    menorSaldo,
    menorSaldoEm,
    saldoFinal: saldo,
    entradas,
    saidas,
    faltaParaNaoFurar: Math.max(0, -menorSaldo),
    variavelDiaria: variavel.diaria,
    mesesDeHistorico: variavel.mesesDeHistorico,
    confiavel: variavel.confiavel,
    incluiuDividas: divida.incluir,
    entradasDoFunil,
    aliquota: aliquotaDe(e.perfil),
    impostoPrevisto: guias
      .filter((g) => g.fonte === 'imposto')
      .reduce((soma, g) => soma - g.valor, 0),
    semPrevisao: e.oportunidades.filter((o) => emAndamento(o) && !o.previsaoEm).length,
  };
}

/**
 * A linha semanal, para o gráfico.
 *
 * Noventa pontos num celular viram uma mancha. Treze pontos, cada um o saldo ao
 * fim daquela semana, mostram a mesma forma e ainda cabem num rótulo legível.
 */
export function porSemana(p: Projecao) {
  return p.dias.filter((_, i) => (i + 1) % 7 === 0 || i === p.dias.length - 1);
}

/**
 * O que explica o mês seguinte, em três linhas.
 *
 * É o resumo que responde "por que esse número" sem obrigar a abrir a lista:
 * quanto entra de garantido, quanto sai de fixo, e o que sobra por mês antes de
 * qualquer evento novo.
 */
export function ritmoMensal(e: EntradaProjecao) {
  const ativos = e.recorrentes.filter((r) => r.ativo);
  const entradaFixa = ativos.filter((r) => r.tipo === 'entrada').reduce((s, r) => s + r.valor, 0);
  // Só a parte que passa pelo CNPJ gera guia. O resto entra inteiro.
  const tributavel = ativos
    .filter((r) => r.tipo === 'entrada' && !r.foraDoCnpj)
    .reduce((s, r) => s + r.valor, 0);
  const tributo = imposto(tributavel, aliquotaDe(e.perfil));
  const saidaFixa = ativos.filter((r) => r.tipo === 'saida').reduce((s, r) => s + r.valor, 0);
  const variavel = gastoVariavel(e.lancamentos, e.data || hoje()).mensal;
  const divida = dividaDiluida(e.dividas, e.recorrentes).mensal;
  return {
    entradaFixa,
    saidaFixa,
    variavel,
    divida,
    imposto: tributo,
    sobra: entradaFixa - tributo - saidaFixa - variavel - divida,
  };
}
