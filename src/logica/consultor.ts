/**
 * O consultor: a leitura de cada área, por regra.
 *
 * Não é IA e não finge ser. São regras determinísticas sobre os seus próprios
 * dados — funciona offline, custa zero, e a mesma entrada dá sempre a mesma
 * saída. A conversa de verdade continua sendo o briefing, colado numa conversa
 * com uma IA que tem contexto e consegue discordar.
 *
 * **O ponto de calibragem mais importante: os limiares são frouxos de
 * propósito.** Você disse que não quer rigor de 100%, e está certo — sistema que
 * cobra perfeição é abandonado por quem erra uma vez. Aqui 80% de adesão é
 * verde, não amarelo; dois treinos na semana contam; e nenhum sinal vira alerta
 * por um dia ruim. Alerta é para o que compromete o mês, não para o que
 * incomoda o dia.
 */
import type { Eixo } from '../tipos';

export type Gravidade = 'ok' | 'atencao' | 'alerta' | 'sem-dado';

export interface Sinal {
  id: string;
  eixo: Eixo;
  area: string;
  gravidade: Gravidade;
  titulo: string;
  detalhe: string;
  /** O que fazer. Ausente quando não há nada a fazer além de seguir. */
  acao?: string;
}

/** Tudo que o consultor precisa, já mastigado pelas telas. */
export interface Leitura {
  // Dinheiro
  sobraDoMes: number;
  previsivel: number;
  pisoFixo: number;
  jurosMensais: number;
  aporteDisponivel: number;
  lancamentosNoMes: number;
  acoesAbertas: number;
  // Corpo
  vereditoPeso?: { tipo: string; texto: string; sugestao?: string };
  proteinaMedia: number;
  proteinaPiso: number;
  adesaoRefeicoes: number;
  diasComRefeicao: number;
  treinosNaSemana: number;
  // Mente
  sonoMedia: number | null;
  habitos30d: number;
  habitosEmRisco: string[];
  // Ofício
  afazeresAtrasados: number;
  medidasBatidas: number;
  medidasTotal: number;
  frenteSemRetorno?: { nome: string; horas: number; margem: number };
  // Estudo
  revisoesVencidas: number;
  materiaisAbertos: number;
  materiaisNaFila: number;
}

const ordem: Record<Gravidade, number> = { alerta: 0, atencao: 1, 'sem-dado': 2, ok: 3 };

/**
 * A leitura completa.
 *
 * Cada sinal diz o que está acontecendo, e — quando há o que fazer — uma ação
 * concreta. Sinal sem ação é ruído: serve só para você se sentir vigiado.
 */
export function lerVida(l: Leitura): Sinal[] {
  const s: Sinal[] = [];
  const add = (x: Sinal) => s.push(x);

  // ───────────── Dinheiro ─────────────
  if (!l.lancamentosNoMes) {
    add({
      id: 'caixa-sem-dado', eixo: 'dinheiro', area: 'Caixa', gravidade: 'sem-dado',
      titulo: 'Nenhum lançamento neste mês',
      detalhe: 'Sem registro de dinheiro, metade deste consultor fica cega — e é a metade que decide as outras.',
      acao: 'Lance uma coisa hoje. Uma só já tira do zero.',
    });
  } else if (l.sobraDoMes < 0) {
    add({
      id: 'caixa-vermelho', eixo: 'dinheiro', area: 'Caixa', gravidade: 'alerta',
      titulo: 'O mês está no vermelho',
      detalhe: `Faltam R$ ${Math.abs(Math.round(l.sobraDoMes))} para fechar. Enquanto a sobra for negativa, nenhuma decisão de negócio é livre: ela é tomada sob pressão de caixa.`,
      acao: 'Olhe as ações estruturais antes de cortar gasto. Trocar contrato move mais que apertar o mês.',
    });
  } else {
    add({
      id: 'caixa-ok', eixo: 'dinheiro', area: 'Caixa', gravidade: 'ok',
      titulo: 'O mês fecha positivo',
      detalhe: `Sobra de R$ ${Math.round(l.sobraDoMes)} até agora.`,
    });
  }

  if (l.pisoFixo > 0) {
    const cobertura = l.previsivel / l.pisoFixo;
    if (cobertura >= 1) {
      add({
        id: 'previsivel-ok', eixo: 'dinheiro', area: 'Receita previsível', gravidade: 'ok',
        titulo: 'O piso fixo está coberto por receita previsível',
        detalhe: 'Tudo que entrar de avulso daqui é avanço, não sobrevivência.',
      });
    } else {
      add({
        id: 'previsivel-falta', eixo: 'dinheiro', area: 'Receita previsível',
        gravidade: cobertura < 0.6 ? 'alerta' : 'atencao',
        titulo: `${Math.round(cobertura * 100)}% do piso vem de receita previsível`,
        detalhe: `Faltam R$ ${Math.round(l.pisoFixo - l.previsivel)} por mês de receita que se repete sozinha. Enquanto isso não fechar, todo mês recomeça do zero e depende de evento novo.`,
        acao: 'É o objetivo central do seu plano. Cada frente contratada e cada patrocínio anual empurram esta linha.',
      });
    }
  }

  if (l.jurosMensais > 0) {
    const cobreJuro = l.aporteDisponivel >= l.jurosMensais;
    add({
      id: 'divida', eixo: 'dinheiro', area: 'Dívida',
      gravidade: cobreJuro ? 'atencao' : 'alerta',
      titulo: cobreJuro
        ? `A dívida custa R$ ${Math.round(l.jurosMensais)} por mês de juros`
        : `O que você paga não cobre nem o juro`,
      detalhe: cobreJuro
        ? 'O aporte cobre o juro, então o saldo desce. Continue.'
        : `Os juros somam R$ ${Math.round(l.jurosMensais)} e o aporte disponível é R$ ${Math.round(l.aporteDisponivel)}. O saldo cresce todo mês e não existe data de quitação.`,
      acao: cobreJuro
        ? undefined
        : 'A saída não é gastar menos: é renegociar a taxa. Procon e a Lei 14.181 existem exatamente para isto.',
    });
  }

  if (l.acoesAbertas > 0) {
    add({
      id: 'acoes', eixo: 'dinheiro', area: 'Ações estruturais', gravidade: 'atencao',
      titulo: `${l.acoesAbertas} mudança(s) de contrato em aberto`,
      detalhe: 'São as alavancas que mudam o mês sem depender de receita nova — e cada uma é um número finito de ligações.',
      acao: 'Empurre uma por semana. Uma só.',
    });
  }

  // ───────────── Corpo ─────────────
  if (l.vereditoPeso && l.vereditoPeso.tipo !== 'sem-dado') {
    const bom = l.vereditoPeso.tipo === 'no-ritmo' || l.vereditoPeso.tipo === 'recomposicao';
    add({
      id: 'peso', eixo: 'corpo', area: 'Peso e composição',
      gravidade: bom ? 'ok' : 'atencao',
      titulo: l.vereditoPeso.texto,
      detalhe: l.vereditoPeso.sugestao || '',
    });
  } else {
    add({
      id: 'peso-sem-dado', eixo: 'corpo', area: 'Peso e composição', gravidade: 'sem-dado',
      titulo: 'Pesagens insuficientes para ler tendência',
      detalhe: 'A leitura oficial é a média de sete dias, e ela precisa de pelo menos quatro pesagens por semana.',
      acao: 'Pese ao acordar, antes de comer. Leva dez segundos.',
    });
  }

  if (l.diasComRefeicao >= 3) {
    const ok = l.adesaoRefeicoes >= 0.7;
    add({
      id: 'comida', eixo: 'corpo', area: 'Alimentação',
      gravidade: ok ? 'ok' : 'atencao',
      titulo: `${Math.round(l.adesaoRefeicoes * 100)}% do plano de refeições aconteceu`,
      detalhe: ok
        ? 'Adesão nessa faixa é o que sustenta resultado. Não precisa ser 100% — precisa ser repetido.'
        : 'Abaixo de 70%, o plano não está sendo seguido o bastante para explicar o resultado, seja ele qual for.',
      acao: ok ? undefined : 'Se uma refeição falha toda semana, o problema é ela: mude a âncora ou baixe o piso.',
    });
  }

  if (l.proteinaPiso > 0 && l.proteinaMedia > 0) {
    const ok = l.proteinaMedia >= l.proteinaPiso;
    add({
      id: 'proteina', eixo: 'corpo', area: 'Proteína',
      gravidade: ok ? 'ok' : 'atencao',
      titulo: `${l.proteinaMedia} g por dia, na média`,
      detalhe: ok
        ? `Acima do piso de ${l.proteinaPiso} g.`
        : `Abaixo do piso de ${l.proteinaPiso} g. Em déficit e treinando, o que falta de proteína sai de músculo.`,
      acao: ok ? undefined : 'A refeição mais fácil de consertar costuma ser a primeira do dia.',
    });
  }

  if (l.treinosNaSemana < 2) {
    add({
      id: 'treino', eixo: 'corpo', area: 'Treino de força', gravidade: 'atencao',
      titulo: `${l.treinosNaSemana} treino(s) de força na semana`,
      detalhe: 'Você joga muito e levanta pouco. O risco não é só desempenho: é a lesão que tira você da quadra — e a quadra é onde está a sua rede de contatos.',
      acao: 'Duas sessões por semana já seguram. Não precisa de três.',
    });
  } else {
    add({
      id: 'treino-ok', eixo: 'corpo', area: 'Treino de força', gravidade: 'ok',
      titulo: `${l.treinosNaSemana} treinos na semana`,
      detalhe: 'Frequência suficiente para progredir e proteger a articulação.',
    });
  }

  // ───────────── Mente ─────────────
  if (l.sonoMedia === null) {
    add({
      id: 'sono-sem-dado', eixo: 'mente', area: 'Sono', gravidade: 'sem-dado',
      titulo: 'Sono não registrado',
      detalhe: 'Para quem trabalha à noite, é a variável que mais mexe em fome, humor e recuperação — e a que mais explica semana ruim.',
      acao: 'Um toque por dia no painel de Hoje.',
    });
  } else if (l.sonoMedia < 6.5) {
    add({
      id: 'sono', eixo: 'mente', area: 'Sono', gravidade: 'alerta',
      titulo: `${l.sonoMedia} h de sono, na média`,
      detalhe: 'Abaixo de 7 h a fome sobe, a saciedade cai, a recuperação piora e a decisão fica pior. Nenhum ajuste de dieta ou de treino compensa isso.',
      acao: 'Antes de mexer em qualquer outra coisa, tente ganhar 30 minutos de sono. É a alavanca mais barata que você tem.',
    });
  } else if (l.sonoMedia < 7) {
    add({
      id: 'sono', eixo: 'mente', area: 'Sono', gravidade: 'atencao',
      titulo: `${l.sonoMedia} h de sono, na média`,
      detalhe: 'Perto do limite. Meia hora a mais mudaria o humor e a fome mais do que qualquer ajuste de prato.',
    });
  } else {
    add({
      id: 'sono', eixo: 'mente', area: 'Sono', gravidade: 'ok',
      titulo: `${l.sonoMedia} h de sono, na média`,
      detalhe: 'Faixa boa, inclusive para quem tem horário deslocado.',
    });
  }

  if (l.habitosEmRisco.length) {
    add({
      id: 'habitos-risco', eixo: 'mente', area: 'Hábitos', gravidade: 'alerta',
      titulo: `${l.habitosEmRisco.length} hábito(s) na segunda falta`,
      detalhe: `${l.habitosEmRisco.join(', ')}. A primeira falta não significa nada; a segunda seguida é onde o ciclo quebra.`,
      acao: 'Faça só o piso hoje. O piso existe exatamente para o dia ruim.',
    });
  } else if (l.habitos30d > 0) {
    const ok = l.habitos30d >= 0.6;
    add({
      id: 'habitos', eixo: 'mente', area: 'Hábitos',
      gravidade: ok ? 'ok' : 'atencao',
      titulo: `${Math.round(l.habitos30d * 100)}% de constância em 30 dias`,
      detalhe: ok
        ? 'Constância nessa faixa constrói. Perfeição não é o alvo, repetição é.'
        : 'Abaixo de 60% o hábito ainda não pegou. Costuma ser sinal de que tem hábito demais na lista, não de falta de disciplina.',
      acao: ok ? undefined : 'Corte a lista pela metade e mantenha dois. Os outros voltam depois.',
    });
  }

  // ───────────── Ofício ─────────────
  if (l.afazeresAtrasados > 0) {
    add({
      id: 'atrasados', eixo: 'oficio', area: 'Agenda',
      gravidade: l.afazeresAtrasados >= 5 ? 'alerta' : 'atencao',
      titulo: `${l.afazeresAtrasados} afazer(es) vencido(s)`,
      detalhe: l.afazeresAtrasados >= 5
        ? 'Uma lista com muitos vencidos para de ser consultada — e aí ela some junto com o que era importante.'
        : 'Poucos vencidos ainda dá para recuperar sem faxina.',
      acao: 'Para cada um: faça, remarque com data nova, ou apague. As três respostas valem; deixar como está, não.',
    });
  }

  if (l.medidasTotal > 0) {
    const taxa = l.medidasBatidas / l.medidasTotal;
    add({
      id: 'medidas', eixo: 'oficio', area: 'Medidas de direção',
      gravidade: taxa >= 0.6 ? 'ok' : 'atencao',
      titulo: `${l.medidasBatidas} de ${l.medidasTotal} medidas bateram na semana`,
      detalhe: taxa >= 0.6
        ? 'É o que você controla, e está acontecendo. O resultado costuma vir atrás.'
        : 'Quando a meta não anda, é quase sempre aqui que se explica — e não na meta.',
      acao: taxa >= 0.6 ? undefined : 'Olhe qual medida parou. Se ela nunca acontece, o alvo semanal está errado, não você.',
    });
  }

  if (l.frenteSemRetorno) {
    add({
      id: 'frente', eixo: 'oficio', area: 'Rentabilidade', gravidade: 'atencao',
      titulo: `${l.frenteSemRetorno.nome} consome ${Math.round(l.frenteSemRetorno.horas)} h por semana`,
      detalhe: `E devolveu R$ ${Math.round(l.frenteSemRetorno.margem)} de margem no período. É a frente que está comendo a sua semana sem pagar por ela.`,
      acao: 'Não precisa ser abandonada — precisa ser renegociada, empacotada ou passada adiante de olhos abertos.',
    });
  }

  // ───────────── Estudo ─────────────
  if (l.revisoesVencidas > 0) {
    add({
      id: 'revisoes', eixo: 'mente', area: 'Estudo',
      gravidade: l.revisoesVencidas >= 15 ? 'atencao' : 'ok',
      titulo: `${l.revisoesVencidas} revisão(ões) vencida(s)`,
      detalhe: l.revisoesVencidas >= 15
        ? 'A fila acumulou. Fila grande vira motivo para não abrir — e aí o que foi lido evapora.'
        : 'Fila pequena, dá para zerar em poucos minutos.',
      acao: l.revisoesVencidas >= 15
        ? 'Faça cinco por dia até zerar, em vez de tentar tudo de uma vez.'
        : undefined,
    });
  }
  if (l.materiaisAbertos > 2) {
    add({
      id: 'estudo-aberto', eixo: 'mente', area: 'Estudo', gravidade: 'atencao',
      titulo: `${l.materiaisAbertos} materiais abertos ao mesmo tempo`,
      detalhe: 'Ler vários em paralelo é a forma educada de não terminar nenhum.',
      acao: 'Escolha um e mande os outros de volta para a fila.',
    });
  }

  return s.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
}

/**
 * A única coisa.
 *
 * Prioridade explícita, e não é a mesma de todo mundo: dinheiro e sono vêm
 * antes porque, no seu quadro, os dois contaminam todo o resto — caixa negativo
 * tira a liberdade de decidir, e sono curto estraga dieta, treino e humor de
 * uma vez só.
 */
export function aUnicaCoisa(sinais: Sinal[]): Sinal | null {
  const prioridade = ['caixa-vermelho', 'divida', 'sono', 'habitos-risco', 'previsivel-falta'];
  for (const id of prioridade) {
    const achado = sinais.find((s) => s.id === id && (s.gravidade === 'alerta' || s.gravidade === 'atencao'));
    if (achado) return achado;
  }
  return sinais.find((s) => s.gravidade === 'alerta')
    ?? sinais.find((s) => s.gravidade === 'atencao')
    ?? null;
}

/** Quantos sinais de cada gravidade — o retrato de uma linha. */
export function contarSinais(sinais: Sinal[]) {
  return {
    alerta: sinais.filter((s) => s.gravidade === 'alerta').length,
    atencao: sinais.filter((s) => s.gravidade === 'atencao').length,
    ok: sinais.filter((s) => s.gravidade === 'ok').length,
    semDado: sinais.filter((s) => s.gravidade === 'sem-dado').length,
  };
}
