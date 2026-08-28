/**
 * A lógica da agenda: transformar três coleções diferentes numa única resposta
 * para "o que eu tenho neste dia".
 *
 * Evento é data marcada, rotina é regra semanal, tarefa é afazer com prazo. Na
 * tela isso precisa virar uma lista só, ordenada por hora — separar por tipo
 * seria fiel ao banco e inútil para quem está olhando o dia.
 *
 * Nada aqui escreve. A geração de ocorrências de rotina é virtual, calculada a
 * cada render: uma agenda de um ano cabe em memória sem esforço, e assim mudar
 * o horário da rodada de segunda corrige o passado e o futuro de uma vez.
 */
import type { Evento, Rotina, Tarefa, Frente } from '../tipos';
import { hoje, deYmd, ymd, somaDias, diaSemana } from '../formato';

export interface ItemDaAgenda {
  /** Único dentro do dia renderizado — rotina repete id entre dias. */
  chave: string;
  origem: 'evento' | 'rotina' | 'tarefa';
  id: string;
  titulo: string;
  hora?: string;
  duracaoMin?: number;
  local?: string;
  frenteId?: string;
  nota?: string;
  /** Só tarefa. */
  feita?: boolean;
  peso?: 'normal' | 'chave';
}

export interface Fontes {
  eventos: Evento[];
  rotinas: Rotina[];
  tarefas: Tarefa[];
}

/** Compromisso com hora vem antes; sem hora fica no fim, na ordem do título. */
function ordenar(itens: ItemDaAgenda[]) {
  return itens.sort((a, b) => {
    if (a.hora && b.hora) return a.hora.localeCompare(b.hora) || a.titulo.localeCompare(b.titulo);
    if (a.hora) return -1;
    if (b.hora) return 1;
    return a.titulo.localeCompare(b.titulo);
  });
}

export function itensDoDia(data: string, f: Fontes, frenteId?: string): ItemDaAgenda[] {
  const daFrente = <T extends { frenteId?: string }>(x: T) => !frenteId || x.frenteId === frenteId;
  const dow = diaSemana(data);
  const itens: ItemDaAgenda[] = [];

  for (const e of f.eventos) {
    if (e.data !== data || !daFrente(e)) continue;
    itens.push({
      chave: 'e' + e.id, origem: 'evento', id: e.id, titulo: e.titulo, hora: e.hora,
      duracaoMin: e.duracaoMin, local: e.local, frenteId: e.frenteId, nota: e.nota,
    });
  }

  for (const r of f.rotinas) {
    if (!r.ativo || !r.dias.includes(dow) || !daFrente(r)) continue;
    itens.push({
      chave: 'r' + r.id + data, origem: 'rotina', id: r.id, titulo: r.titulo, hora: r.hora,
      duracaoMin: r.duracaoMin, local: r.local, frenteId: r.frenteId,
    });
  }

  for (const t of f.tarefas) {
    if (t.prazo !== data || !daFrente(t)) continue;
    itens.push({
      chave: 't' + t.id, origem: 'tarefa', id: t.id, titulo: t.titulo,
      frenteId: t.frenteId, feita: t.feita, peso: t.peso, nota: t.nota,
    });
  }

  return ordenar(itens);
}

/** Quantos itens e quais cores cada dia tem — alimenta os pontos da grade. */
export function marcasDoPeriodo(datas: string[], f: Fontes, frentes: Frente[], frenteId?: string) {
  const cor = new Map(frentes.map((x) => [x.id, x.cor]));
  const mapa = new Map<string, { total: number; cores: string[] }>();
  for (const data of datas) {
    const itens = itensDoDia(data, f, frenteId).filter((i) => !(i.origem === 'tarefa' && i.feita));
    if (!itens.length) continue;
    const cores: string[] = [];
    for (const i of itens) {
      const c = i.frenteId ? cor.get(i.frenteId) : undefined;
      const usar = c || 'var(--color-suave)';
      if (!cores.includes(usar)) cores.push(usar);
    }
    mapa.set(data, { total: itens.length, cores: cores.slice(0, 3) });
  }
  return mapa;
}

/**
 * A grade do mês, sempre começando no domingo e fechando a última semana.
 * Vem com os dias vizinhos para a grade não ter buraco — a tela os desenha
 * apagados.
 */
export function gradeDoMes(mes: string): string[][] {
  const [ano, m] = mes.split('-').map(Number);
  const primeiro = new Date(ano, m - 1, 1);
  const inicio = somaDias(ymd(primeiro), -primeiro.getDay());
  const ultimo = new Date(ano, m, 0);
  const fim = somaDias(ymd(ultimo), 6 - ultimo.getDay());

  const semanas: string[][] = [];
  let cursor = inicio;
  while (cursor <= fim) {
    const semana: string[] = [];
    for (let i = 0; i < 7; i++) { semana.push(cursor); cursor = somaDias(cursor, 1); }
    semanas.push(semana);
  }
  return semanas;
}

export const dias = (inicio: string, quantos: number) =>
  Array.from({ length: quantos }, (_, i) => somaDias(inicio, i));

/** O próximo compromisso a partir de agora — o que a tela mostra primeiro. */
export function proximoCompromisso(f: Fontes, frenteId?: string, alcanceDias = 60) {
  const inicio = hoje();
  const agora = new Date();
  const horaAgora = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

  for (const data of dias(inicio, alcanceDias)) {
    for (const item of itensDoDia(data, f, frenteId)) {
      if (item.origem === 'tarefa') continue;
      if (data === inicio && item.hora && item.hora < horaAgora) continue;
      return { data, item };
    }
  }
  return null;
}

export interface Afazeres {
  atrasadas: Tarefa[];
  hoje: Tarefa[];
  proximas: Tarefa[];
  semPrazo: Tarefa[];
  feitas: Tarefa[];
}

/**
 * Os afazeres separados pelo que a data faz com eles. Atrasado no topo e
 * contado: uma lista onde o vencido se mistura com o resto é uma lista que você
 * para de abrir.
 */
export function separarAfazeres(tarefas: Tarefa[], frenteId?: string, data = hoje()): Afazeres {
  const fora: Afazeres = { atrasadas: [], hoje: [], proximas: [], semPrazo: [], feitas: [] };
  const porPrazo = (a: Tarefa, b: Tarefa) => (a.prazo || '9').localeCompare(b.prazo || '9');

  for (const t of tarefas) {
    if (frenteId && t.frenteId !== frenteId) continue;
    if (t.feita) { fora.feitas.push(t); continue; }
    if (!t.prazo) fora.semPrazo.push(t);
    else if (t.prazo < data) fora.atrasadas.push(t);
    else if (t.prazo === data) fora.hoje.push(t);
    else fora.proximas.push(t);
  }

  fora.atrasadas.sort(porPrazo);
  fora.proximas.sort(porPrazo);
  fora.feitas.sort((a, b) => (b.feitaEm || '').localeCompare(a.feitaEm || ''));
  return fora;
}

/** Quantos dias de atraso — para a tela dizer "3 dias", não só "atrasada". */
export const diasDeAtraso = (prazo: string, data = hoje()) =>
  Math.round((deYmd(data).getTime() - deYmd(prazo).getTime()) / 86400000);

/**
 * Quanto tempo por semana cada frente ocupa, contando só rotina — que é a parte
 * previsível. Serve para a pergunta que interessa: a frente que paga o mês tem
 * mais horas que a que não paga?
 */
export function horasSemanaisPorFrente(rotinas: Rotina[]) {
  const mapa = new Map<string, number>();
  for (const r of rotinas) {
    if (!r.ativo) continue;
    const chave = r.frenteId || 'sem-frente';
    const min = (r.duracaoMin || 60) * r.dias.length;
    mapa.set(chave, (mapa.get(chave) || 0) + min);
  }
  return mapa;
}
