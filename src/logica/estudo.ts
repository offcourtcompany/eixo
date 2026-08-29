/**
 * Estudo com prática de recuperação e reforço espaçado.
 *
 * Duas decisões de método, e as duas contrariam o jeito intuitivo de estudar:
 *
 * **Reler não é estudar.** Passar o olho de novo produz fluência — o texto
 * parece familiar — e fluência é confundida com domínio. O que fixa é tentar
 * puxar da memória *antes* de olhar a resposta. Por isso as perguntas aparecem
 * sem alternativa: reconhecer a opção certa numa lista dá a sensação de saber
 * sem o saber.
 *
 * **Rever tudo toda semana é desperdício.** O intervalo cresce quando você
 * acerta e desaba quando erra, então o tempo de revisão vai para o que ainda
 * não está firme. É o mesmo princípio do Anki, na versão mínima que cabe aqui.
 */
import type { Estudo, Pergunta } from '../tipos';
import { hoje, somaDias } from '../formato';

/** Quanto o intervalo estica a cada acerto. Errou volta para um dia. */
const FATOR = 2.4;
const TETO_DIAS = 120;

export type Resultado = 'acertei' | 'quase' | 'errei';

/**
 * O novo agendamento depois de uma tentativa.
 *
 * "Quase" existe porque a resposta binária é grosseira demais: lembrar pela
 * metade não merece voltar amanhã nem sumir por um mês.
 */
export function reagendar(p: Pergunta, r: Resultado, data = hoje()): Partial<Pergunta> & { id: string } {
  const intervalo = r === 'errei'
    ? 1
    : r === 'quase'
      ? Math.max(2, Math.round(p.intervalo * 0.6))
      : Math.min(TETO_DIAS, Math.max(2, Math.round((p.intervalo || 1) * FATOR)));

  return {
    id: p.id,
    intervalo,
    proximaEm: somaDias(data, intervalo),
    acertos: p.acertos + (r === 'acertei' ? 1 : 0),
    erros: p.erros + (r === 'errei' ? 1 : 0),
  };
}

/** As perguntas vencidas hoje, mais antigas primeiro. */
export const paraRevisar = (perguntas: Pergunta[], data = hoje()) =>
  perguntas
    .filter((p) => p.proximaEm <= data)
    .sort((a, b) => a.proximaEm.localeCompare(b.proximaEm));

export interface EstadoDoEstudo {
  fila: Estudo[];
  lendo: Estudo[];
  lidos: Estudo[];
  largados: Estudo[];
  /** Quantas revisões estão vencidas agora. */
  vencidas: number;
  /** Perguntas que ainda não têm nenhuma tentativa. */
  novas: number;
}

export function estadoDoEstudo(
  estudos: Estudo[],
  perguntas: Pergunta[],
  data = hoje(),
): EstadoDoEstudo {
  const por = (s: Estudo['status']) =>
    estudos.filter((e) => e.status === s).sort((a, b) => a.ordem - b.ordem);

  return {
    fila: por('fila'),
    lendo: por('lendo'),
    lidos: por('lido'),
    largados: por('largado'),
    vencidas: paraRevisar(perguntas, data).length,
    novas: perguntas.filter((p) => p.acertos === 0 && p.erros === 0).length,
  };
}

/**
 * O sinal de que o estudo está travado: mais de dois materiais abertos ao mesmo
 * tempo. Ler três livros em paralelo é a forma mais educada de não terminar
 * nenhum — e quem tem quatro frentes de trabalho abertas já sabe como isso
 * acaba.
 */
export const abertosDemais = (estado: EstadoDoEstudo) => estado.lendo.length > 2;

/** Aproveitamento das tentativas registradas — só serve depois de umas dez. */
export function aproveitamento(perguntas: Pergunta[]) {
  const tentativas = perguntas.reduce((s, p) => s + p.acertos + p.erros, 0);
  const acertos = perguntas.reduce((s, p) => s + p.acertos, 0);
  return { tentativas, taxa: tentativas ? acertos / tentativas : 0 };
}
