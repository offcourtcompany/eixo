/**
 * A capacidade da semana.
 *
 * É a projeção de caixa aplicada ao tempo, e existe pelo mesmo motivo: com
 * quatro frentes rodando, a pergunta que trava não é "o que eu tenho hoje" —
 * é se a semana que você acabou de montar **cabe** na semana que você tem.
 *
 * O que essa conta desfaz é uma ilusão específica e cara: a agenda mostra
 * espaços vazios entre os compromissos, e espaço vazio parece disponibilidade.
 * Não é. Entre um compromisso e outro há deslocamento, comida, banho, o
 * telefone tocando — e sobretudo há uma pilha de afazeres sem hora marcada que
 * não aparece em lugar nenhum do calendário e mesmo assim consome a semana
 * inteira.
 *
 * A frase que este módulo pode dizer e nenhum outro pode: **não é falta de
 * disciplina, é que não cabe.** Quem ouve isso reprograma; quem não ouve
 * conclui que o problema é o próprio caráter, e continua marcando o mesmo
 * tanto na semana seguinte.
 */
import type { Rotina, Evento, Tarefa, Frente, Treino, Dia } from '../tipos';
import { hoje, somaDias, diaSemana } from '../formato';
import { segundaDa } from './semana';

/**
 * O que sai das 168 horas antes de qualquer decisão sua.
 *
 * Sono vem do alvo, não da média — a conta é de planejamento, e planejar em
 * cima das cinco horas que você tem dormido é transformar a dívida de sono em
 * política. Manutenção é comer, banho, deslocamento e o resto do atrito de
 * existir; três horas por dia é a estimativa conservadora, e ela está aqui
 * escrita para você poder discordar dela com conhecimento de causa.
 */
export const HORAS_DA_SEMANA = 168;
export const SONO_ALVO_PADRAO = 7.5;
export const MANUTENCAO_POR_DIA = 3;

/** Sem estimativa, um afazer custa isto. Chave pesa mais porque é mais fundo. */
export const MIN_TAREFA_NORMAL = 45;
export const MIN_TAREFA_CHAVE = 120;

export type ZonaDeSemana = 'folga' | 'ok' | 'cheia' | 'estourada';

export interface FatiaDaSemana {
  chave: string;
  nome: string;
  cor: string;
  horas: number;
}

export interface Capacidade {
  segunda: string;
  sono: number;
  manutencao: number;
  /** As horas que sobram para trabalho, treino e vida depois do básico. */
  disponivel: number;
  comprometido: number;
  livre: number;
  ocupacao: number;
  zona: ZonaDeSemana;
  rotinas: number;
  eventos: number;
  tarefas: number;
  corpo: number;
  /** Afazeres que entraram por estimativa padrão em vez de tempo declarado. */
  semEstimativa: number;
  porFrente: FatiaDaSemana[];
}

export interface EntradaCapacidade {
  rotinas: Rotina[];
  eventos: Evento[];
  tarefas: Tarefa[];
  frentes: Frente[];
  treinos: Treino[];
  dias: Dia[];
  sonoAlvo?: number;
  data?: string;
}

const minutosDaTarefa = (t: Tarefa) =>
  t.estimativaMin || (t.peso === 'chave' ? MIN_TAREFA_CHAVE : MIN_TAREFA_NORMAL);

/**
 * O tempo de corpo da semana: treino e quadra.
 *
 * Sai do que já aconteceu nas últimas quatro semanas, não de uma intenção. Se
 * você jogou seis horas por semana no último mês, a semana que vem também vai
 * ter seis — e é assim que essa conta precisa tratar, porque a quadra é
 * compromisso social tanto quanto esporte, e some do planejamento justamente
 * por não estar escrita em lugar nenhum.
 */
export function horasDeCorpo(treinos: Treino[], dias: Dia[], data = hoje()) {
  const inicio = somaDias(data, -28);
  const minTreino = treinos
    .filter((t) => t.data > inicio && t.data <= data)
    .reduce((s, t) => s + (t.duracaoMin || t.exercicios.flatMap((e) => e.series).length * 3.5), 0);
  const minQuadra = dias
    .filter((d) => d.id > inicio && d.id <= data)
    .reduce((s, d) => s + (d.quadraMin || (d.diaDeJogo ? 90 : 0)), 0);
  return (minTreino + minQuadra) / 60 / 4;
}

export function calcularCapacidade(e: EntradaCapacidade): Capacidade {
  const data = e.data || hoje();
  const segunda = segundaDa(data);
  const fimDaSemana = somaDias(segunda, 6);

  const sono = (e.sonoAlvo ?? SONO_ALVO_PADRAO) * 7;
  const manutencao = MANUTENCAO_POR_DIA * 7;
  const disponivel = Math.max(0, HORAS_DA_SEMANA - sono - manutencao);

  const porFrente = new Map<string, number>();
  const somar = (frenteId: string | undefined, minutos: number) => {
    const chave = frenteId || 'sem-frente';
    porFrente.set(chave, (porFrente.get(chave) || 0) + minutos);
  };

  let minRotinas = 0;
  for (const r of e.rotinas) {
    if (!r.ativo) continue;
    const min = (r.duracaoMin || 60) * r.dias.length;
    minRotinas += min;
    somar(r.frenteId, min);
  }

  let minEventos = 0;
  for (const ev of e.eventos) {
    if (ev.data < segunda || ev.data > fimDaSemana) continue;
    const min = ev.duracaoMin || 60;
    minEventos += min;
    somar(ev.frenteId, min);
  }

  // Afazer entra quando o prazo cai nesta semana ou já venceu: atraso não
  // some da carga, ele se acumula nela. Essa é a diferença entre um app que
  // ajuda e um que faz a semana parecer mais leve do que é.
  let minTarefas = 0;
  let semEstimativa = 0;
  for (const t of e.tarefas) {
    if (t.feita) continue;
    if (!t.prazo || t.prazo > fimDaSemana) continue;
    const min = minutosDaTarefa(t);
    if (!t.estimativaMin) semEstimativa++;
    minTarefas += min;
    somar(t.frenteId, min);
  }

  const corpo = horasDeCorpo(e.treinos, e.dias, data);
  const comprometido = (minRotinas + minEventos + minTarefas) / 60 + corpo;
  const livre = disponivel - comprometido;
  const ocupacao = disponivel > 0 ? comprometido / disponivel : 0;

  const nomes = new Map(e.frentes.map((f) => [f.id, f]));
  const fatias: FatiaDaSemana[] = [...porFrente.entries()]
    .map(([chave, min]) => ({
      chave,
      nome: nomes.get(chave)?.nome || 'sem frente',
      cor: nomes.get(chave)?.cor || '#8A8380',
      horas: min / 60,
    }))
    .sort((a, b) => b.horas - a.horas);

  return {
    segunda,
    sono,
    manutencao,
    disponivel,
    comprometido,
    livre,
    ocupacao,
    zona: zonaDaSemana(ocupacao),
    rotinas: minRotinas / 60,
    eventos: minEventos / 60,
    tarefas: minTarefas / 60,
    corpo,
    semEstimativa,
    porFrente: fatias,
  };
}

/**
 * As faixas.
 *
 * O teto não é 100%. Semana planejada até a última hora quebra no primeiro
 * imprevisto, e imprevisto em operação de evento não é exceção, é o trabalho.
 * Por isso "cheia" começa em 85%: a folga de 15% é o que absorve o atraso do
 * fornecedor sem derrubar o resto.
 */
export function zonaDaSemana(ocupacao: number): ZonaDeSemana {
  if (ocupacao > 1) return 'estourada';
  if (ocupacao > 0.85) return 'cheia';
  if (ocupacao > 0.5) return 'ok';
  return 'folga';
}

/**
 * O cruzamento que só existe quando tempo e dinheiro estão no mesmo app:
 * a frente que mais come a semana, e quanto ela paga por hora.
 *
 * É a pergunta que muda decisão de carreira. Não "qual frente dá mais
 * dinheiro" — qual devolve mais por hora sua. A resposta costuma contrariar a
 * intuição, porque a frente que dá mais dinheiro no mês é quase sempre a que
 * consome mais semana.
 */
export function frenteQueComeASemana(
  c: Capacidade,
  resultados: { frente: { id: string } | null; margem: number }[],
  mesesDaJanela = 3,
) {
  const maior = c.porFrente.find((f) => f.chave !== 'sem-frente' && f.horas > 0);
  if (!maior) return null;
  const r = resultados.find((x) => x.frente?.id === maior.chave);
  const margem = r?.margem ?? 0;
  // As horas da janela inteira: a semana repetida pelas semanas médias do mês.
  const horasDaJanela = maior.horas * 4.345 * mesesDaJanela;
  return {
    ...maior,
    margem,
    porHora: horasDaJanela > 0 ? margem / horasDaJanela : 0,
    fatiaDaSemana: c.comprometido > 0 ? maior.horas / c.comprometido : 0,
  };
}

/** Quantas horas por dia sobram, para a conta virar coisa do tamanho de um dia. */
export const porDia = (horas: number) => horas / 7;

/** O dia mais cheio da semana — onde o estouro costuma acontecer primeiro. */
export function diaMaisCheio(e: EntradaCapacidade) {
  const data = e.data || hoje();
  const segunda = segundaDa(data);
  let pior = { data: segunda, minutos: 0 };

  for (let i = 0; i < 7; i++) {
    const d = somaDias(segunda, i);
    const dow = diaSemana(d);
    let min = 0;
    for (const r of e.rotinas) if (r.ativo && r.dias.includes(dow)) min += r.duracaoMin || 60;
    for (const ev of e.eventos) if (ev.data === d) min += ev.duracaoMin || 60;
    for (const t of e.tarefas) if (!t.feita && t.prazo === d) min += minutosDaTarefa(t);
    if (min > pior.minutos) pior = { data: d, minutos: min };
  }
  return { ...pior, horas: pior.minutos / 60 };
}
