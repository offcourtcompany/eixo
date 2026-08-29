/**
 * A matemática da nutrição — e as decisões clínicas por trás dela.
 *
 * Três escolhas mandam neste módulo, e todas são para o plano sobreviver ao
 * mês dois, não para parecer preciso no dia um:
 *
 * **1. Não se conta caloria, conta-se proteína.** Registrar tudo o que entra na
 * boca é o jeito mais rápido de abandonar dieta — dá trabalho demais para a
 * informação que devolve. Proteína é o único macro que vale o atrito: é o que
 * protege músculo em déficit, o que mais sacia, e o que quase ninguém acerta
 * sem olhar. Caloria entra como *estimativa de alvo*, para calibrar o tamanho
 * do prato, e não como planilha diária.
 *
 * **2. O peso do dia é ruído; o que decide é a média de 7 dias.** Uma pessoa
 * de 96 kg oscila 1,5 kg entre sábado e domingo só por água, sal, glicogênio e
 * intestino. Quem olha o número diário conclui coisa errada e desiste na
 * semana em que a balança sobe apesar do trabalho feito. Aqui a leitura oficial
 * é a média móvel, e a comparação é entre médias.
 *
 * **3. O ajuste vem do resultado real, não da tabela.** Toda equação de gasto
 * energético erra entre 10% e 15% para o indivíduo. Então o número calculado é
 * só o ponto de partida: depois de duas semanas de dado, quem manda é o ritmo
 * observado, e o app recalibra a partir dele.
 *
 * Nada aqui é prescrição médica. É estimativa calculada a partir do que você
 * informou, para orientar tamanho de porção — não substitui acompanhamento,
 * principalmente se houver condição de saúde, medicação ou histórico alimentar
 * que peça cuidado.
 */
import type { Dia, Perfil, Refeicao, NivelAtividade } from '../tipos';
import { somaDias, ymd } from '../formato';

/** ~7.700 kcal por quilo de gordura — a constante clássica, boa o bastante para alvo. */
const KCAL_POR_KG = 7700;

export const FATORES: Record<NivelAtividade, { fator: number; nome: string; descricao: string }> = {
  leve: {
    fator: 1.375, nome: 'Leve',
    descricao: 'Sentado a maior parte do dia, esporte uma ou duas vezes por semana',
  },
  moderado: {
    fator: 1.55, nome: 'Moderado',
    descricao: 'Em pé boa parte do dia, esporte três vezes por semana',
  },
  alto: {
    fator: 1.725, nome: 'Alto',
    descricao: 'Em pé quase o dia todo, esporte quatro a cinco vezes por semana mais musculação',
  },
  'muito-alto': {
    fator: 1.9, nome: 'Muito alto',
    descricao: 'Treino ou jogo praticamente todo dia, muitas vezes duas sessões',
  },
};

/** Mifflin-St Jeor: a equação com menor erro médio para adultos sem obesidade grave. */
export function tmb(pesoKg: number, alturaCm: number, idade: number, sexo: 'm' | 'f') {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  return sexo === 'm' ? base + 5 : base - 161;
}

export interface Alvos {
  /** Faltou dado para calcular — a tela pede em vez de inventar. */
  faltando: string[];
  tmb: number;
  gasto: number;
  /** O peso que entrou na conta — a média móvel, quando existe. */
  pesoUsado?: number;
  /** Calorias-alvo do dia, já com o déficit ou superávit pedido. */
  calorias: number;
  /** Foi preciso frear o déficit para não descer demais. */
  freado: boolean;
  proteinaAlvo: number;
  proteinaPiso: number;
  gorduraMin: number;
  /** O que sobra para carboidrato depois de proteína e gordura mínima. */
  carboAprox: number;
  semanasAteAlvo: number | null;
}

/**
 * Os alvos do dia.
 *
 * A proteína é ancorada no **peso-alvo**, não no atual: alguém de 96 kg mirando
 * 88 kg não precisa de proteína para manter 96 kg de massa que ele não quer
 * manter. 1,8 g/kg de peso-alvo é a faixa alta da recomendação para déficit com
 * treino de força, que é exatamente o caso de quem está cortando peso e
 * levantando pela primeira vez.
 *
 * A gordura tem um mínimo real (0,8 g/kg de peso-alvo) porque abaixo disso
 * começa a atrapalhar hormônio e absorção de vitamina — cortar gordura a zero é
 * o erro clássico de dieta agressiva.
 */
export function calcularAlvos(perfil: Perfil, pesoAtual?: number): Alvos {
  const faltando: string[] = [];
  if (!perfil.alturaCm) faltando.push('altura');
  if (!perfil.idade) faltando.push('idade');
  if (!perfil.sexo) faltando.push('sexo biológico');
  if (!pesoAtual) faltando.push('peso atual');

  const alvoPeso = perfil.pesoAlvo || pesoAtual || 0;
  const vazio: Alvos = {
    faltando, tmb: 0, gasto: 0, pesoUsado: pesoAtual, calorias: 0, freado: false,
    proteinaAlvo: 0, proteinaPiso: 0, gorduraMin: 0, carboAprox: 0, semanasAteAlvo: null,
  };
  if (faltando.length || !pesoAtual) return vazio;

  const metabolismo = tmb(pesoAtual, perfil.alturaCm!, perfil.idade!, perfil.sexo!);
  const fator = FATORES[perfil.nivelAtividade || 'moderado'].fator;
  const gasto = metabolismo * fator;

  // Ritmo alvo: por padrão, 0,6% do peso por semana. Mais rápido que ~1% custa
  // músculo e adesão; mais devagar que 0,3% não aparece na balança e desanima.
  const ritmo = perfil.ritmoSemanal ?? -(pesoAtual * 0.006);
  const ajusteDiario = (ritmo * KCAL_POR_KG) / 7;

  // Freio de segurança: nunca abaixo da taxa metabólica basal, nem de 1.500 kcal.
  // Déficit agressivo demais derruba treino, sono e humor — e some com a adesão.
  const piso = Math.max(metabolismo, 1500);
  const bruto = gasto + ajusteDiario;
  const calorias = Math.max(piso, bruto);

  const proteinaAlvo = Math.round((alvoPeso * 1.8) / 5) * 5;
  const proteinaPiso = Math.round((alvoPeso * 1.5) / 5) * 5;
  const gorduraMin = Math.round(alvoPeso * 0.8);
  const carboAprox = Math.max(
    0,
    Math.round((calorias - proteinaAlvo * 4 - gorduraMin * 9) / 4),
  );

  const faltaKg = perfil.pesoAlvo ? pesoAtual - perfil.pesoAlvo : 0;
  const semanasAteAlvo = faltaKg > 0 && ritmo < 0
    ? Math.ceil(faltaKg / Math.abs(ritmo))
    : null;

  return {
    faltando: [],
    tmb: Math.round(metabolismo),
    gasto: Math.round(gasto),
    pesoUsado: pesoAtual,
    calorias: Math.round(calorias),
    freado: bruto < piso,
    proteinaAlvo, proteinaPiso, gorduraMin, carboAprox,
    semanasAteAlvo,
  };
}

export interface PontoDePeso {
  data: string;
  peso?: number;
  /** Média móvel de 7 dias — a leitura oficial. */
  media?: number;
}

/**
 * Série de peso com média móvel de 7 dias.
 *
 * A média só aparece quando existem pelo menos 3 pesagens dentro da janela;
 * com menos que isso ela mentiria com cara de suavizada.
 */
export function seriePeso(porData: Map<string, Dia>, dias = 90, hojeYmd = ymd()): PontoDePeso[] {
  const saida: PontoDePeso[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const data = somaDias(hojeYmd, -i);
    const peso = porData.get(data)?.peso;

    const janela: number[] = [];
    for (let j = 0; j < 7; j++) {
      const p = porData.get(somaDias(data, -j))?.peso;
      if (typeof p === 'number') janela.push(p);
    }
    saida.push({
      data,
      peso: typeof peso === 'number' ? peso : undefined,
      media: janela.length >= 3
        ? Math.round((janela.reduce((s, v) => s + v, 0) / janela.length) * 100) / 100
        : undefined,
    });
  }
  return saida;
}

export interface Tendencia {
  /** kg por semana, a partir das médias móveis. Negativo = perdendo. */
  ritmo: number | null;
  mediaAtual: number | null;
  mediaAnterior: number | null;
  /** Quantas pesagens existem nos últimos 14 dias. */
  pesagens: number;
}

/** Compara a média de agora com a de 7 dias atrás — média contra média, nunca dia contra dia. */
export function tendencia(serie: PontoDePeso[]): Tendencia {
  const comMedia = serie.filter((p) => p.media !== undefined);
  const pesagens = serie.slice(-14).filter((p) => p.peso !== undefined).length;
  if (comMedia.length < 2) return { ritmo: null, mediaAtual: null, mediaAnterior: null, pesagens };

  const atual = comMedia[comMedia.length - 1];
  const alvoData = somaDias(atual.data, -7);
  const anterior = [...comMedia].reverse().find((p) => p.data <= alvoData) || comMedia[0];

  const distanciaDias = Math.round(
    (new Date(atual.data).getTime() - new Date(anterior.data).getTime()) / 86400000,
  );
  if (!distanciaDias) return { ritmo: null, mediaAtual: atual.media!, mediaAnterior: null, pesagens };

  return {
    ritmo: ((atual.media! - anterior.media!) / distanciaDias) * 7,
    mediaAtual: atual.media!,
    mediaAnterior: anterior.media!,
    pesagens,
  };
}

export type Veredito =
  | { tipo: 'sem-dado'; texto: string }
  | {
      tipo: 'no-ritmo' | 'devagar' | 'rapido' | 'subindo' | 'recomposicao';
      texto: string;
      sugestao: string;
    };

const numeroCm = (v: number) => v.toFixed(1).replace('.', ',');

/** O mínimo de queda de cintura que não é erro de fita: 0,6 cm em quatro semanas. */
const CINTURA_ENCOLHENDO = -0.15;

/**
 * O que um nutricionista faria na consulta de retorno: comparar o ritmo real
 * com o combinado e mexer na comida — para cima ou para baixo.
 *
 * A margem é 25% do alvo, com piso absoluto de 0,15 kg por semana: percentual
 * sozinho elogiaria um resultado um terço abaixo do combinado, e valor absoluto
 * sozinho perseguiria o ruído de quem tem alvo pequeno.
 *
 * **A cintura tem poder de veto**, e é a correção mais importante desta função.
 * Quem começa a treinar força ganha músculo enquanto perde gordura: o peso
 * trava ou desce devagar enquanto a composição melhora. Sem olhar a cintura, o
 * veredito leria isso como fracasso e mandaria cortar comida — o pior conselho
 * possível no único período em que a recomposição acontece com facilidade. Por
 * isso, se a cintura está encolhendo, nenhuma sugestão de corte é emitida,
 * mesmo com a balança parada.
 */
export function vereditoSemanal(
  t: Tendencia,
  alvoRitmo: number,
  cintura?: { ritmo: number | null; medidas: number },
): Veredito {
  if (t.ritmo === null || t.pesagens < 4) {
    return {
      tipo: 'sem-dado',
      texto: t.pesagens < 4
        ? `Só ${t.pesagens} pesagem(ns) nos últimos 14 dias. Pese pelo menos quatro vezes por semana, sempre ao acordar, antes de comer e beber — sem isso a média não significa nada.`
        : 'Ainda não há duas semanas de média para comparar.',
    };
  }

  const margem = Math.max(Math.abs(alvoRitmo) * 0.25, 0.15);
  const kcal = (dif: number) => Math.round((Math.abs(dif) * KCAL_POR_KG) / 7 / 10) * 10;

  // O veto da cintura vem antes de tudo que sugeriria comer menos.
  const encolhendo = cintura?.ritmo !== null
    && cintura !== undefined
    && cintura.medidas >= 2
    && (cintura.ritmo as number) <= CINTURA_ENCOLHENDO;
  const abaixoDoAlvo = t.ritmo > alvoRitmo + margem;

  if (encolhendo && abaixoDoAlvo) {
    const cm = Math.abs(cintura!.ritmo as number);
    return {
      tipo: 'recomposicao',
      texto: `A balança está mais devagar que o combinado, mas a cintura está descendo ${numeroCm(cm)} cm por semana.`,
      sugestao: 'Isto é recomposição, não estagnação: você está trocando gordura por músculo, o que acontece com facilidade em quem começou a treinar força agora. **Não corte comida.** Cortar aqui atrapalha o treino e desperdiça a única janela em que ganhar músculo e perder gordura ao mesmo tempo é fácil. Continue igual e deixe a fita métrica ser o placar por algumas semanas.',
    };
  }

  if (t.ritmo > 0 && alvoRitmo < 0) {
    return {
      tipo: 'subindo',
      texto: 'A média de peso subiu enquanto o plano previa descer.',
      sugestao: `Antes de cortar comida, confira duas coisas: a proteína bateu na maioria dos dias e as refeições do plano aconteceram? Se sim, tire cerca de ${kcal(t.ritmo - alvoRitmo)} kcal por dia — o equivalente a uma porção de carboidrato em duas refeições.`,
    };
  }
  if (Math.abs(t.ritmo - alvoRitmo) <= margem) {
    return {
      tipo: 'no-ritmo',
      texto: 'O ritmo está dentro do combinado.',
      sugestao: 'Não mexa em nada. A parte difícil de um plano que funciona é resistir a otimizá-lo.',
    };
  }
  if (Math.abs(t.ritmo) < Math.abs(alvoRitmo)) {
    return {
      tipo: 'devagar',
      texto: 'Está descendo mais devagar que o combinado.',
      sugestao: `Se a adesão estiver boa, tire cerca de ${kcal(t.ritmo - alvoRitmo)} kcal por dia. Se não estiver, o problema não é o alvo — é o plano não estar acontecendo, e cortar mais só piora a adesão.`,
    };
  }
  // Descer rápido com a cintura parada é o sinal clássico de que o que saiu não
  // era só gordura — vale dizer, porque a balança sozinha parece boa notícia.
  const cinturaParada = cintura !== undefined
    && cintura.medidas >= 2
    && (cintura.ritmo ?? 0) > CINTURA_ENCOLHENDO;

  return {
    tipo: 'rapido',
    texto: 'Está descendo mais rápido que o combinado.',
    sugestao: `Rápido demais custa músculo, treino e humor, e quase sempre termina em recaída. Acrescente cerca de ${kcal(t.ritmo - alvoRitmo)} kcal por dia, de preferência em carboidrato perto do treino.${cinturaParada ? ' E repare: a cintura não acompanhou a queda do peso, o que costuma indicar que parte do que saiu não era gordura.' : ''}`,
  };
}

/** Quanto do plano de refeições aconteceu no dia. */
export function adesaoDoDia(refeicoes: Refeicao[], dia?: Dia) {
  const ativas = refeicoes.filter((r) => r.ativa);
  const feitas = ativas.filter((r) => dia?.refeicoes?.[r.id]).length;
  return { feitas, total: ativas.length, taxa: ativas.length ? feitas / ativas.length : 0 };
}

/** Adesão e proteína média nos últimos N dias — a régua honesta do mês. */
export function adesaoRecente(
  refeicoes: Refeicao[],
  porData: Map<string, Dia>,
  dias = 14,
  hojeYmd = ymd(),
) {
  let somaTaxa = 0;
  let diasComRegistro = 0;
  let somaProteina = 0;
  let diasComProteina = 0;

  for (let i = 0; i < dias; i++) {
    const dia = porData.get(somaDias(hojeYmd, -i));
    if (!dia) continue;
    if (dia.refeicoes) {
      somaTaxa += adesaoDoDia(refeicoes, dia).taxa;
      diasComRegistro++;
    }
    if (typeof dia.proteinaG === 'number') {
      somaProteina += dia.proteinaG;
      diasComProteina++;
    }
  }

  return {
    adesao: diasComRegistro ? somaTaxa / diasComRegistro : 0,
    diasComRegistro,
    proteinaMedia: diasComProteina ? Math.round(somaProteina / diasComProteina) : 0,
    diasComProteina,
  };
}

// ─────────────────────── cintura, sono e líquido ───────────────────────

/**
 * Cintura ao longo do tempo.
 *
 * Medida uma vez por semana, não todo dia: ela se move devagar e o erro de
 * medição é maior que a variação diária. Por isso aqui não há média móvel — os
 * pontos são poucos e valem como estão.
 */
export function serieCintura(porData: Map<string, Dia>, dias = 90, hojeYmd = ymd()) {
  const saida: { data: string; cintura: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const data = somaDias(hojeYmd, -i);
    const c = porData.get(data)?.cinturaCm;
    if (typeof c === 'number') saida.push({ data, cintura: c });
  }
  return saida;
}

/** cm por semana entre a primeira e a última medida dos últimos 28 dias. */
export function tendenciaCintura(serie: { data: string; cintura: number }[]) {
  if (serie.length < 2) return { ritmo: null as number | null, atual: serie[0]?.cintura ?? null, medidas: serie.length };
  const primeiro = serie[0];
  const ultimo = serie[serie.length - 1];
  const dias = Math.round(
    (new Date(ultimo.data).getTime() - new Date(primeiro.data).getTime()) / 86400000,
  );
  return {
    ritmo: dias > 0 ? ((ultimo.cintura - primeiro.cintura) / dias) * 7 : null,
    atual: ultimo.cintura,
    medidas: serie.length,
  };
}

/**
 * Meta de líquido do dia.
 *
 * Base de 35 ml por quilo, que é a referência para adulto ativo, mais 600 ml
 * por hora de quadra. Em Salvador — calor e umidade alta — a perda por suor em
 * esporte de raquete passa fácil de um litro por hora, então isto é piso, não
 * teto: sede e urina escura mandam mais que a conta.
 */
export function metaDeLiquido(pesoKg?: number, horasDeJogo = 0) {
  const base = Math.round(((pesoKg || 80) * 35) / 100) * 100;
  return base + Math.round(horasDeJogo * 600);
}

/** Média de sono dos últimos N dias, e quantas noites foram registradas. */
export function sonoRecente(porData: Map<string, Dia>, dias = 14, hojeYmd = ymd()) {
  let soma = 0;
  let noites = 0;
  for (let i = 0; i < dias; i++) {
    const h = porData.get(somaDias(hojeYmd, -i))?.sonoHoras;
    if (typeof h === 'number' && h > 0) { soma += h; noites++; }
  }
  return { media: noites ? Math.round((soma / noites) * 10) / 10 : null, noites };
}
