/**
 * Os treinos que o app conhece, organizados em planos.
 *
 * **Força 3x** é o programa padrão: força, corpo inteiro, A/B alternado.
 * O desenho parte de um caso específico: alguém que joga muito (beach tennis,
 * futevôlei, tênis, pickleball) e não treina força. Isso não é só perda de
 * desempenho — é risco de lesão em cima da rede de contatos que gera receita.
 *
 * Referências: Rippetoe (*Starting Strength*) para os padrões básicos e a
 * progressão linear; Matthews (*Bigger Leaner Stronger*) para o formato 3x/semana
 * sustentável por quem tem agenda irregular. Face pull e rotação externa entram
 * por prevenção de ombro — quem faz esporte de raquete acumula desequilíbrio.
 *
 * Poucos exercícios, de propósito: o programa que você faz vence o programa
 * ótimo que você abandona.
 *
 * **Quadril & Tênis** é o plano de 4 dias vindo do guia de performance para
 * tênis (6 a 8 semanas): estabilidade de quadril, glúteo médio e movimentação
 * lateral. Não é plano de hipertrofia — é resposta a uma dor específica. O que
 * sustenta o resultado ali não é carga máxima: é ativação de glúteo antes de
 * tudo e trabalho unilateral, que é como o tênis cobra o corpo.
 */
import type { GrupoMuscular } from '../tipos';

/**
 * Nem tudo que se registra é kg × repetição. Passo com miniband, segundo de
 * prancha e minuto de mobilidade contam o mesmo trabalho em unidades diferentes.
 */
export type Unidade = 'reps' | 'seg' | 'min' | 'passos' | 'voltas';

export const UNIDADES: Record<Unidade, { curto: string; longo: string; singular: string }> = {
  reps: { curto: 'Reps', longo: 'reps', singular: 'rep' },
  seg: { curto: 'Seg.', longo: 'segundos', singular: 'segundo' },
  min: { curto: 'Min.', longo: 'minutos', singular: 'minuto' },
  passos: { curto: 'Passos', longo: 'passos', singular: 'passo' },
  voltas: { curto: 'Voltas', longo: 'voltas', singular: 'volta' },
};

export interface ExercicioProgramado {
  nome: string;
  grupo: GrupoMuscular;
  series: number;
  repsAlvo: number;
  /**
   * Quanto subir quando fechar todas as séries no alvo. Zero significa peso
   * corporal ou mobilidade: ali a progressão é por repetição, não por carga.
   */
  incremento: number;
  /** Padrão 'reps'. */
  unidade?: Unidade;
  /** O alvo vale por lado, não no total. */
  porLado?: boolean;
  /** Se o dia tiver que ser cortado pela metade, é isto que fica. */
  essencial?: boolean;
  /** Bloco dentro do dia: ativação, principais, potência, estabilidade. */
  bloco?: string;
  /** Busca no YouTube pela execução, como no guia original. */
  video?: string;
  nota?: string;
}

export interface Programa {
  id: string;
  plano: string;
  nome: string;
  foco: string;
  /** Dia sugerido na semana, quando o plano fixa um. */
  dia?: string;
  exercicios: ExercicioProgramado[];
}

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  /** Ordem da rotação. O app segue esta lista a partir do último treino feito. */
  sequencia: string[];
  /** Dias da semana sugeridos, no padrão do `Date.getDay()` (0 = domingo). */
  diasSemana: number[];
  /** Programas fora da rotação — aquecimento avulso, por exemplo. */
  avulsos?: string[];
  observacoes?: string[];
  resultado?: string[];
}

const yt = (busca: string) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(busca);

export const PROGRAMAS: Programa[] = [
  // ─────────────────────── Quadril & Tênis (4 dias) ───────────────────────
  {
    id: 'IA',
    plano: 'quadril',
    nome: 'Inferior A',
    foco: 'Força + estabilidade de quadril',
    dia: 'Segunda',
    exercicios: [
      { bloco: 'Ativação', essencial: true, nome: 'Caminhada Lateral com Miniband', grupo: 'pernas', series: 3, repsAlvo: 15, incremento: 0, unidade: 'passos', video: yt('Caminhada Lateral com Miniband exercício quadril'), nota: 'Banda acima do joelho, tronco levemente inclinado, tensão constante.' },
      { bloco: 'Ativação', essencial: true, nome: 'Clamshell com Faixa', grupo: 'pernas', series: 3, repsAlvo: 15, incremento: 0, video: yt('Clamshell com faixa elástica exercício'), nota: 'Joelhos dobrados. Abrir o joelho sem girar o tronco.' },
      { bloco: 'Ativação', nome: 'Ponte Unilateral', grupo: 'pernas', series: 3, repsAlvo: 12, incremento: 0, porLado: true, video: yt('Ponte unilateral de glúteo exercício'), nota: 'Subir contraindo o glúteo.' },
      { bloco: 'Ativação', nome: 'Mobilidade de Quadril', grupo: 'corpo-todo', series: 1, repsAlvo: 2, incremento: 0, unidade: 'min', video: yt('Mobilidade de quadril aquecimento circular'), nota: 'Movimentos circulares e abertura de quadril.' },

      { bloco: 'Principais', nome: 'Agachamento Goblet', grupo: 'pernas', series: 4, repsAlvo: 8, incremento: 2.5, video: yt('Agachamento Goblet técnica execução'), nota: 'Descer controlando, coluna neutra.' },
      { bloco: 'Principais', essencial: true, nome: 'Terra Romeno', grupo: 'pernas', series: 4, repsAlvo: 10, incremento: 2.5, video: yt('Terra romeno stiff técnica execução'), nota: 'Alongar o posterior, quadril para trás.' },
      { bloco: 'Principais', essencial: true, nome: 'Afundo Búlgaro', grupo: 'pernas', series: 3, repsAlvo: 10, incremento: 2, porLado: true, video: yt('Afundo búlgaro bulgarian split squat técnica'), nota: 'Controle na descida, joelho alinhado.' },
      { bloco: 'Principais', nome: 'Step-Up no Banco', grupo: 'pernas', series: 3, repsAlvo: 10, incremento: 2, video: yt('Step up no banco exercício técnica'), nota: 'Subir usando o glúteo, sem impulso.' },
      { bloco: 'Principais', essencial: true, nome: 'Cadeira Abdutora', grupo: 'pernas', series: 3, repsAlvo: 20, incremento: 2.5, video: yt('Cadeira abdutora exercício técnica'), nota: 'Movimento controlado, contração forte.' },
      { bloco: 'Principais', nome: 'Panturrilha', grupo: 'pernas', series: 4, repsAlvo: 15, incremento: 2.5, video: yt('Elevação de panturrilha técnica'), nota: 'Pausa em cima.' },

      { bloco: 'Estabilidade', essencial: true, nome: 'Prancha Lateral', grupo: 'core', series: 3, repsAlvo: 40, incremento: 0, unidade: 'seg', porLado: true, video: yt('Prancha lateral técnica correta'), nota: 'Quadril elevado e alinhado, sem cair.' },
      { bloco: 'Estabilidade', nome: 'Farmer Carry Unilateral', grupo: 'core', series: 3, repsAlvo: 1, incremento: 2.5, unidade: 'voltas', video: yt('Farmer carry unilateral exercício'), nota: 'Halter só de um lado. Tronco alinhado — é o oblíquo que segura.' },
    ],
  },
  {
    id: 'SA',
    plano: 'quadril',
    nome: 'Superior A',
    foco: 'Ombro saudável + core',
    dia: 'Terça',
    exercicios: [
      { bloco: 'Principais', nome: 'Remada Baixa', grupo: 'costas', series: 4, repsAlvo: 10, incremento: 2.5, video: yt('Remada baixa no cabo técnica execução'), nota: 'Escápulas para trás.' },
      { bloco: 'Principais', nome: 'Supino Halter Neutro', grupo: 'peito', series: 3, repsAlvo: 10, incremento: 2, video: yt('Supino halter pegada neutra técnica'), nota: 'Controle total. A pegada neutra poupa o ombro.' },
      { bloco: 'Principais', nome: 'Puxada Frontal', grupo: 'costas', series: 3, repsAlvo: 10, incremento: 2.5, video: yt('Puxada frontal pulley técnica execução'), nota: 'Sem jogar o tronco.' },
      { bloco: 'Principais', essencial: true, nome: 'Face Pull', grupo: 'ombro', series: 4, repsAlvo: 15, incremento: 1, video: yt('Face pull técnica execução ombro'), nota: 'Cotovelos altos. Nenhum exercício paga mais pela postura de quem joga.' },
      { bloco: 'Principais', nome: 'Desenvolvimento Leve', grupo: 'ombro', series: 3, repsAlvo: 10, incremento: 2, video: yt('Desenvolvimento de ombro com halteres técnica'), nota: 'Movimento controlado. Leve é parte do exercício, não falta de coragem.' },
      { bloco: 'Principais', nome: 'Rotação Externa no Cabo', grupo: 'ombro', series: 3, repsAlvo: 15, incremento: 1, video: yt('Rotação externa de ombro no cabo manguito rotador'), nota: 'Foco no manguito rotador.' },

      { bloco: 'Core para tênis', essencial: true, nome: 'Pallof Press', grupo: 'core', series: 3, repsAlvo: 12, incremento: 2.5, porLado: true, video: yt('Pallof press técnica execução core'), nota: 'Resistir à rotação do tronco. É o core que o tênis cobra de verdade.' },
      { bloco: 'Core para tênis', nome: 'Dead Bug', grupo: 'core', series: 3, repsAlvo: 12, incremento: 0, video: yt('Dead bug exercício core técnica'), nota: 'Lombar apoiada no chão.' },
      { bloco: 'Core para tênis', nome: 'Woodchopper no Cabo', grupo: 'core', series: 3, repsAlvo: 12, incremento: 2.5, porLado: true, video: yt('Woodchopper no cabo rotação de tronco'), nota: 'Movimento diagonal, tipo golpe de tênis.' },
    ],
  },
  {
    id: 'IB',
    plano: 'quadril',
    nome: 'Inferior B',
    foco: 'Potência + posterior',
    dia: 'Quinta',
    exercicios: [
      { bloco: 'Ativação', nome: 'Monster Walk', grupo: 'pernas', series: 3, repsAlvo: 15, incremento: 0, unidade: 'passos', video: yt('Monster walk exercício com miniband') },
      { bloco: 'Ativação', nome: 'Mini Saltos Laterais', grupo: 'pernas', series: 2, repsAlvo: 20, incremento: 0, unidade: 'seg', video: yt('Mini saltos laterais lateral hops técnica') },
      { bloco: 'Ativação', nome: 'Ponte de Glúteo', grupo: 'pernas', series: 2, repsAlvo: 20, incremento: 0, video: yt('Ponte de glúteo glute bridge técnica') },

      { bloco: 'Principais', essencial: true, nome: 'Hip Thrust', grupo: 'pernas', series: 4, repsAlvo: 10, incremento: 5, video: yt('Hip thrust técnica execução completa'), nota: 'Pausa no topo, contração máxima. É o exercício-chave do plano.' },
      { bloco: 'Principais', nome: 'Terra Sumô', grupo: 'pernas', series: 4, repsAlvo: 8, incremento: 5, video: yt('Levantamento terra sumô técnica execução'), nota: 'Pés abertos, glúteo ativo.' },
      { bloco: 'Principais', nome: 'Passada Andando', grupo: 'pernas', series: 3, repsAlvo: 12, incremento: 2, porLado: true, video: yt('Passada andando walking lunge técnica'), nota: 'Passos controlados.' },
      { bloco: 'Principais', nome: 'Mesa Flexora', grupo: 'pernas', series: 3, repsAlvo: 12, incremento: 2.5, video: yt('Mesa flexora técnica execução posterior de coxa'), nota: 'Movimento lento.' },
      { bloco: 'Principais', essencial: true, nome: 'Cadeira Abdutora Inclinada', grupo: 'pernas', series: 3, repsAlvo: 20, incremento: 2.5, video: yt('Cadeira abdutora inclinada glúteo médio'), nota: 'Inclinar o tronco à frente joga a carga no glúteo médio.' },

      { bloco: 'Potência', nome: 'Step Explosivo', grupo: 'pernas', series: 3, repsAlvo: 8, incremento: 0, porLado: true, video: yt('Step up explosivo pliometria técnica'), nota: 'Subida rápida e explosiva.' },
      { bloco: 'Potência', nome: 'Saltos Laterais Curtos', grupo: 'pernas', series: 3, repsAlvo: 20, incremento: 0, unidade: 'seg', video: yt('Saltos laterais curtos agilidade lateral bounds'), nota: 'Foco em agilidade.' },

      { bloco: 'Estabilidade', nome: 'Equilíbrio Unilateral', grupo: 'pernas', series: 3, repsAlvo: 30, incremento: 0, unidade: 'seg', porLado: true, video: yt('Equilíbrio unilateral em uma perna exercício') },
      { bloco: 'Estabilidade', nome: 'Prancha Lateral com Elevação', grupo: 'core', series: 3, repsAlvo: 10, incremento: 0, porLado: true, video: yt('Prancha lateral com elevação de quadril técnica') },
    ],
  },
  {
    id: 'SB',
    plano: 'quadril',
    nome: 'Superior B',
    foco: 'Resistência + mobilidade',
    dia: 'Sexta',
    exercicios: [
      { bloco: 'Principais', nome: 'Remada Unilateral', grupo: 'costas', series: 4, repsAlvo: 10, incremento: 2, porLado: true, video: yt('Remada unilateral com halter técnica') },
      { bloco: 'Principais', nome: 'Flexão', grupo: 'peito', series: 3, repsAlvo: 12, incremento: 0, video: yt('Flexão de braço técnica correta') },
      { bloco: 'Principais', nome: 'Pulldown', grupo: 'costas', series: 3, repsAlvo: 12, incremento: 2.5, video: yt('Pulldown no cabo técnica execução') },
      { bloco: 'Principais', nome: 'Face Pull', grupo: 'ombro', series: 3, repsAlvo: 15, incremento: 1, video: yt('Face pull técnica execução ombro') },
      { bloco: 'Principais', nome: 'Elevação Lateral', grupo: 'ombro', series: 3, repsAlvo: 15, incremento: 1, video: yt('Elevação lateral de ombro halteres técnica'), nota: 'Leve e controlado.' },
      { bloco: 'Principais', nome: 'Rosca + Tríceps', grupo: 'braco', series: 2, repsAlvo: 12, incremento: 2, video: yt('Rosca bíceps e tríceps corda técnica') },

      { bloco: 'Mobilidade', nome: 'Mobilidade Torácica', grupo: 'corpo-todo', series: 1, repsAlvo: 5, incremento: 0, unidade: 'min', video: yt('Mobilidade torácica exercícios coluna') },
      { bloco: 'Mobilidade', nome: 'Alongamento Flexor de Quadril', grupo: 'corpo-todo', series: 2, repsAlvo: 30, incremento: 0, unidade: 'seg', porLado: true, video: yt('Alongamento flexor de quadril técnica') },
      { bloco: 'Mobilidade', nome: 'Liberação Glúteo/TFL', grupo: 'corpo-todo', series: 1, repsAlvo: 2, incremento: 0, unidade: 'min', video: yt('Liberação miofascial glúteo e TFL com rolo'), nota: 'Bola ou rolo.' },
    ],
  },
  {
    id: 'AQ',
    plano: 'quadril',
    nome: 'Antes do tênis',
    foco: 'Aquecimento rápido, 5 a 8 minutos',
    exercicios: [
      { nome: 'Caminhada Lateral com Miniband', grupo: 'pernas', series: 2, repsAlvo: 15, incremento: 0, unidade: 'passos', video: yt('Caminhada Lateral com Miniband exercício quadril') },
      { nome: 'Ponte de Glúteo', grupo: 'pernas', series: 2, repsAlvo: 15, incremento: 0, video: yt('Ponte de glúteo glute bridge técnica') },
      { nome: 'Mobilidade de Quadril', grupo: 'corpo-todo', series: 1, repsAlvo: 2, incremento: 0, unidade: 'min', video: yt('Mobilidade de quadril aquecimento circular') },
      { nome: 'Saltos Laterais Leves', grupo: 'pernas', series: 2, repsAlvo: 20, incremento: 0, unidade: 'seg', video: yt('Saltos laterais leves aquecimento agilidade') },
    ],
  },

  // ─────────────────────────── Força 3x (A/B) ───────────────────────────
  {
    id: 'A',
    plano: 'forca',
    nome: 'Treino A',
    foco: 'Agachamento, empurrar horizontal, puxar horizontal',
    exercicios: [
      { nome: 'Agachamento livre', grupo: 'pernas', series: 3, repsAlvo: 5, incremento: 5, nota: 'Desce até a coxa passar da paralela. Carga só sobe se as 3 séries fecharem.' },
      { nome: 'Supino reto', grupo: 'peito', series: 3, repsAlvo: 5, incremento: 2.5 },
      { nome: 'Remada curvada', grupo: 'costas', series: 3, repsAlvo: 8, incremento: 2.5 },
      { nome: 'Face pull', grupo: 'ombro', series: 3, repsAlvo: 15, incremento: 1, nota: 'Prevenção de ombro. Não é acessório opcional pra quem joga raquete.' },
      { nome: 'Prancha', grupo: 'core', series: 3, repsAlvo: 45, incremento: 5, unidade: 'seg' },
    ],
  },
  {
    id: 'B',
    plano: 'forca',
    nome: 'Treino B',
    foco: 'Levantamento terra, empurrar vertical, puxar vertical',
    exercicios: [
      { nome: 'Levantamento terra', grupo: 'pernas', series: 2, repsAlvo: 5, incremento: 5, nota: 'Só 2 séries pesadas. Terra cobra caro na recuperação.' },
      { nome: 'Desenvolvimento militar', grupo: 'ombro', series: 3, repsAlvo: 5, incremento: 2.5 },
      { nome: 'Puxada alta', grupo: 'costas', series: 3, repsAlvo: 8, incremento: 2.5, nota: 'Troque por barra fixa quando fizer 8 reps limpas.' },
      { nome: 'Rosca direta', grupo: 'braco', series: 3, repsAlvo: 10, incremento: 2 },
      { nome: 'Rotação externa', grupo: 'ombro', series: 3, repsAlvo: 15, incremento: 1, nota: 'Manguito rotador. Carga leve, execução lenta.' },
    ],
  },
];

export const PLANOS: Plano[] = [
  {
    id: 'quadril',
    nome: 'Quadril & Tênis',
    descricao: '4 dias por semana, 6 a 8 semanas. Estabilidade de quadril, glúteo forte e movimentação lateral: jogar melhor e sentir menos dor.',
    sequencia: ['IA', 'SA', 'IB', 'SB'],
    diasSemana: [1, 2, 4, 5],
    avulsos: ['AQ'],
    observacoes: [
      'Ativação de glúteo é obrigatória. Não é aquecimento opcional — é o motivo do plano existir.',
      'Execução perfeita antes de carga máxima. Estabilidade primeiro.',
      'Os unilaterais são o coração do plano: o tênis nunca cobra as duas pernas juntas.',
      'Não destrua as pernas na véspera de jogo importante.',
      'Dor aguda é ordem de parada, não de aguentar. Reduza a carga.',
    ],
    resultado: [
      'Menos dor no quadril',
      'Mais estabilidade lateral',
      'Mais explosão em quadra',
      'Mais resistência nas pernas',
      'Menos sobrecarga lombar',
      'Ombro mais saudável',
      'Melhor recuperação pós-jogo',
    ],
  },
  {
    id: 'forca',
    nome: 'Força 3x',
    descricao: '3 dias por semana, A e B alternados. Corpo inteiro, poucos exercícios, carga subindo.',
    sequencia: ['A', 'B'],
    diasSemana: [1, 3, 5],
  },
];

export const programaPorId = (id: string) => PROGRAMAS.find((p) => p.id === id) || null;

export const programasDoPlano = (plano: string) => PROGRAMAS.filter((p) => p.plano === plano);

export const GRUPOS: { id: GrupoMuscular; nome: string }[] = [
  { id: 'pernas', nome: 'Pernas' },
  { id: 'peito', nome: 'Peito' },
  { id: 'costas', nome: 'Costas' },
  { id: 'ombro', nome: 'Ombro' },
  { id: 'braco', nome: 'Braço' },
  { id: 'core', nome: 'Core' },
  { id: 'corpo-todo', nome: 'Corpo todo' },
];
