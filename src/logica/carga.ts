/**
 * A carga total: academia mais quadra, na mesma régua.
 *
 * O buraco que isto fecha é específico e comum em quem joga e treina: os dois
 * esforços são anotados em unidades que não conversam — tonelagem de um lado,
 * horas de jogo do outro — então **ninguém soma**. A pessoa acha que treinou
 * pouco porque foi só duas vezes à academia, e esquece as seis horas de areia
 * da semana. O corpo não separa; a lesão vem do total.
 *
 * A régua usada é a de Foster, **sessão-RPE**: minutos × esforço percebido de
 * 1 a 10. É grosseira de propósito, e é justamente por isso que funciona para
 * comparar musculação com futevôlei — as duas viram um número só, sem exigir
 * equipamento nem planilha.
 *
 * Em cima dela vem a razão aguda/crônica: a semana contra o mês. Muito abaixo
 * de 1, você destreinou; muito acima, subiu rápido demais. Não é lei da física,
 * é semáforo — e a faixa aqui é folgada de propósito, porque o objetivo não é
 * periodizar temporada de atleta profissional, é não se machucar por besteira
 * na semana em que o torneio é seu.
 */
import type { Treino, Dia } from '../tipos';
import { hoje, somaDias, deYmd } from '../formato';

/** Sem RIR anotado, o padrão é 7: treino sério, longe da falha. */
const RPE_PADRAO = 7;
/** Sem duração anotada, cada série custa três minutos e meio de sessão. */
const MIN_POR_SERIE = 3.5;

/**
 * A carga de uma sessão de academia.
 *
 * O RPE sai do RIR quando ele existe — dez menos as repetições em reserva é a
 * tradução direta e aceita. Sem RIR, o padrão evita o pior erro possível aqui,
 * que é uma sessão pesada valer zero por falta de um campo opcional.
 */
export function cargaDoTreino(t: Treino): number {
  const series = t.exercicios.flatMap((e) => e.series);
  if (!series.length) return 0;

  const comRir = series.filter((s) => s.rir !== undefined);
  const rpe = comRir.length
    ? comRir.reduce((s, x) => s + Math.max(1, Math.min(10, 10 - (x.rir as number))), 0) / comRir.length
    : RPE_PADRAO;

  const minutos = t.duracaoMin || series.length * MIN_POR_SERIE;
  return Math.round(minutos * rpe);
}

/**
 * A carga da quadra.
 *
 * Quando você anotou minutos e esforço, é a conta direta. Quando só marcou
 * "dia de jogo", vale uma sessão típica: 90 minutos a esforço 6. Estimativa
 * anunciada é melhor que buraco silencioso — sem ela, a semana de quatro
 * rodadas apareceria como semana leve.
 */
export function cargaDaQuadra(d?: Dia): number {
  if (!d) return 0;
  if (d.quadraMin) return Math.round(d.quadraMin * (d.quadraEsforco || 6));
  if (d.diaDeJogo) return Math.round(90 * 6);
  return 0;
}

/** Verdadeiro quando a carga da quadra daquele dia foi estimada, não medida. */
export const quadraEstimada = (d?: Dia) => Boolean(d?.diaDeJogo && !d?.quadraMin);

export interface DiaDeCarga {
  data: string;
  academia: number;
  quadra: number;
  total: number;
  estimado: boolean;
}

export function serieDeCarga(
  treinos: Treino[], dias: Dia[], ate = hoje(), quantos = 28,
): DiaDeCarga[] {
  const porData = new Map(dias.map((d) => [d.id, d]));
  const treinoPorData = new Map<string, Treino[]>();
  for (const t of treinos) {
    treinoPorData.set(t.data, [...(treinoPorData.get(t.data) || []), t]);
  }

  const saida: DiaDeCarga[] = [];
  for (let i = quantos - 1; i >= 0; i--) {
    const data = somaDias(ate, -i);
    const academia = (treinoPorData.get(data) || []).reduce((s, t) => s + cargaDoTreino(t), 0);
    const d = porData.get(data);
    const quadra = cargaDaQuadra(d);
    saida.push({ data, academia, quadra, total: academia + quadra, estimado: quadraEstimada(d) });
  }
  return saida;
}

export type ZonaDeCarga = 'parado' | 'leve' | 'ok' | 'alta' | 'pico';

export interface LeituraDeCarga {
  /** Média diária dos últimos 7 dias. */
  aguda: number;
  /** Média diária do mês — dividida pelos dias que existem, não sempre por 28. */
  cronica: number;
  razao: number;
  zona: ZonaDeCarga;
  /** Precisa de histórico: antes de 21 dias a razão oscila e não diz nada. */
  confiavel: boolean;
  diasComRegistro: number;
  totalSemana: number;
  academiaSemana: number;
  quadraSemana: number;
  sessoesSemana: number;
  /** Dias sem nenhuma carga na semana. Descanso é dado, não ausência de dado. */
  diasParados: number;
  /** Quanto a semana pode crescer sem sair da faixa. */
  margemDeSubida: number;
  temEstimativa: boolean;
}

/**
 * As faixas.
 *
 * Deliberadamente largas. A literatura discute 0,8–1,3 como janela e 1,5 como
 * alerta; aqui o alerta só acende em 1,6, porque quem treina três vezes por
 * semana tem a razão pulando por causa de um único jogo a mais — e um app que
 * grita toda semana é um app que se aprende a ignorar.
 */
export function zonaDe(razao: number, cronica: number): ZonaDeCarga {
  if (cronica <= 0) return 'parado';
  if (razao < 0.6) return 'parado';
  if (razao < 0.85) return 'leve';
  if (razao <= 1.35) return 'ok';
  if (razao <= 1.6) return 'alta';
  return 'pico';
}

export function lerCarga(treinos: Treino[], dias: Dia[], ate = hoje()): LeituraDeCarga {
  const serie = serieDeCarga(treinos, dias, ate, 28);
  const semana = serie.slice(-7);

  // Histórico é dia com registro de qualquer tipo — treino, jogo ou o próprio
  // documento do dia. Sem isso, 28 dias vazios pareceriam 28 dias de descanso.
  const comRegistro = new Set([
    ...treinos.filter((t) => t.data > somaDias(ate, -28) && t.data <= ate).map((t) => t.data),
    ...dias.filter((d) => d.id > somaDias(ate, -28) && d.id <= ate).map((d) => d.id),
  ]);

  // A média do mês divide pelos dias que existem desde o primeiro registro, não
  // pelos 28 sempre. Dividir por 28 em quem começou há três semanas faz o
  // passado parecer descanso e a semana atual parecer um pico — o app acusaria
  // excesso justamente em quem acabou de começar a anotar.
  const primeiro = [...comRegistro].sort()[0];
  const janela = primeiro
    ? Math.min(28, Math.round((deYmd(ate).getTime() - deYmd(primeiro).getTime()) / 86400000) + 1)
    : 28;

  const aguda = semana.reduce((s, d) => s + d.total, 0) / 7;
  const cronica = serie.reduce((s, d) => s + d.total, 0) / janela;
  const razao = cronica > 0 ? aguda / cronica : 0;

  const totalSemana = semana.reduce((s, d) => s + d.total, 0);
  const academiaSemana = semana.reduce((s, d) => s + d.academia, 0);

  return {
    aguda,
    cronica,
    razao,
    zona: zonaDe(razao, cronica),
    confiavel: comRegistro.size >= 21,
    diasComRegistro: comRegistro.size,
    totalSemana,
    academiaSemana,
    quadraSemana: totalSemana - academiaSemana,
    sessoesSemana: semana.filter((d) => d.total > 0).length,
    diasParados: semana.filter((d) => d.total === 0).length,
    margemDeSubida: Math.max(0, cronica * 1.35 * 7 - totalSemana),
    temEstimativa: semana.some((d) => d.estimado),
  };
}

/**
 * A leitura em uma frase, com o sono junto.
 *
 * O sono entra aqui e não em outro lugar porque é ele que muda o significado da
 * carga: a mesma semana pesada é estímulo com sete horas de sono e é buraco com
 * cinco. Separar os dois é o que faz o app dar o conselho errado com convicção.
 */
export function recadoDaCarga(l: LeituraDeCarga, sonoMedio?: number): {
  titulo: string; texto: string; tom: 'bom' | 'info' | 'alerta';
} {
  const dormindoPouco = sonoMedio !== undefined && sonoMedio < 6;

  if (!l.confiavel) {
    return {
      titulo: 'Ainda medindo',
      tom: 'info',
      texto: `Com ${l.diasComRegistro} dias registrados no mês, a comparação entre a semana e o `
        + 'mês ainda não diz nada. A partir de três semanas ela começa a valer. Registre treino e '
        + 'quadra mesmo nos dias fracos — dia leve anotado é o que faz o dia pesado significar algo.',
    };
  }

  if (l.zona === 'pico') {
    return {
      titulo: 'Semana muito acima do seu normal',
      tom: 'alerta',
      texto: `A semana está ${Math.round((l.razao - 1) * 100)}% acima da média do mês.`
        + (dormindoPouco
          ? ' E o sono está abaixo de seis horas — é a combinação em que a lesão costuma aparecer.'
            + ' Corte uma sessão desta semana, não da próxima.'
          : ' Não é proibido, é para saber: se aparecer dor nova, essa é a causa. Uma semana leve'
            + ' depois desta resolve.'),
    };
  }

  if (l.zona === 'alta') {
    return {
      titulo: 'Subiu rápido',
      tom: 'info',
      texto: 'A semana está acima da sua média do mês, mas dentro do que o corpo acompanha.'
        + (dormindoPouco ? ' Com o sono curto, segure o ritmo por uns dias antes de subir mais.' : ''),
    };
  }

  if (l.zona === 'parado') {
    return {
      titulo: 'Semana parada',
      tom: 'info',
      texto: l.cronica > 0
        ? 'A semana ficou bem abaixo do seu normal. Uma é descanso; três seguidas são o começo de'
          + ' voltar do zero, que é a parte cara.'
        : 'Nenhuma carga registrada. Anote treino e quadra por três semanas e esta leitura passa a'
          + ' existir.',
    };
  }

  if (l.zona === 'leve') {
    return {
      titulo: 'Semana leve',
      tom: 'bom',
      texto: 'Abaixo da média do mês, o que é exatamente o que uma semana de descarga deve ser.'
        + ' Se não foi de propósito, dá para somar até '
        + Math.round(l.margemDeSubida) + ' de carga ainda dentro da faixa.',
    };
  }

  return {
    titulo: 'Na faixa',
    tom: 'bom',
    texto: `Semana em linha com o mês: ${l.sessoesSemana} ${l.sessoesSemana === 1 ? 'sessão' : 'sessões'}, `
      + `${l.diasParados} ${l.diasParados === 1 ? 'dia parado' : 'dias parados'}.`
      + (dormindoPouco
        ? ' O sono é que está curto — é ele que decide se essa carga vira força ou vira cansaço.'
        : ' É assim que se chega inteiro no torneio.'),
  };
}
