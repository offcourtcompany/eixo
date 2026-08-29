/**
 * Estudar pelo conteúdo, não pelo livro.
 *
 * O pedido que originou isto é honesto e vale ser levado a sério: não vou ler
 * os treze livros, mas quero as ideias e quero saber onde aplicar. A resposta
 * errada seria um resumo longo de cada obra — que ninguém lê pelo mesmo motivo
 * pelo qual não leu o livro.
 *
 * A resposta que funciona é **uma ideia por dia**. Cinquenta e duas ideias, uma
 * por vez, é a biblioteca inteira em dois meses, em doses que cabem num
 * intervalo entre dois jogos. E cada ideia vem com o lugar onde ela encosta na
 * arena, no torneio ou na dívida — porque ideia sem aplicação escrita vira
 * conversa de mesa, não muda nada.
 *
 * A ordem é a da estante, e a estante foi montada em ordem de diagnóstico. Por
 * isso a escolha do dia é determinística: a próxima não estudada. Sorteio faria
 * parecer variedade e entregaria fragmento.
 */
import type { Ideia, Estudo } from '../tipos';

export interface EstadoDasIdeias {
  total: number;
  estudadas: number;
  progresso: number;
  /** A próxima, na ordem da estante. */
  proxima: Ideia | null;
  /** Quantos dias, no ritmo de uma por dia, até acabar. */
  diasRestantes: number;
}

/**
 * A ordem da biblioteca: primeiro pelo material, depois pela sequência dentro
 * dele. Cada ideia de um livro pressupõe a anterior, então embaralhar destrói o
 * encadeamento que faz o conjunto significar mais que a soma.
 */
export function ordenarIdeias(ideias: Ideia[], estudos: Estudo[]): Ideia[] {
  const ordemDoEstudo = new Map(estudos.map((e) => [e.id, e.ordem]));
  return [...ideias].sort((a, b) => {
    const ea = ordemDoEstudo.get(a.estudoId) ?? 999;
    const eb = ordemDoEstudo.get(b.estudoId) ?? 999;
    return ea !== eb ? ea - eb : a.ordem - b.ordem;
  });
}

export function estadoDasIdeias(ideias: Ideia[], estudos: Estudo[]): EstadoDasIdeias {
  const ordenadas = ordenarIdeias(ideias, estudos);
  const estudadas = ordenadas.filter((i) => i.estudada).length;
  const proxima = ordenadas.find((i) => !i.estudada) || null;
  return {
    total: ordenadas.length,
    estudadas,
    progresso: ordenadas.length ? estudadas / ordenadas.length : 0,
    proxima,
    diasRestantes: ordenadas.length - estudadas,
  };
}

/** As ideias de um material, na ordem, com o progresso dele. */
export function ideiasDoEstudo(ideias: Ideia[], estudoId: string) {
  const doEstudo = ideias.filter((i) => i.estudoId === estudoId).sort((a, b) => a.ordem - b.ordem);
  const estudadas = doEstudo.filter((i) => i.estudada).length;
  return {
    itens: doEstudo,
    estudadas,
    total: doEstudo.length,
    progresso: doEstudo.length ? estudadas / doEstudo.length : 0,
  };
}

/**
 * O recado do ritmo.
 *
 * Existe para não deixar a barra de progresso ser a única coisa que fala.
 * Cinquenta e duas ideias assustam de uma vez e não assustam a uma por dia — e
 * quem vê o número em dias entende que a biblioteca acaba, o que é exatamente
 * o que faz alguém começar.
 */
export function recadoDasIdeias(e: EstadoDasIdeias): string {
  if (!e.total) return '';
  if (!e.proxima) {
    return 'Todas as ideias da estante foram estudadas. O que sustenta isso agora são as revisões '
      + 'espaçadas — e as aplicações que viraram afazer.';
  }
  if (e.estudadas === 0) {
    return `${e.total} ideias, uma por dia, dão ${e.diasRestantes} dias. É a estante inteira em `
      + 'menos de dois meses, sem ler nenhum dos livros por completo — o que não substitui lê-los, '
      + 'mas resolve o problema de não ler nenhum.';
  }
  return `${e.estudadas} de ${e.total}. No ritmo de uma por dia, faltam ${e.diasRestantes} dias.`;
}
