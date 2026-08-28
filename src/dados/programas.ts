/**
 * Programa padrão: força, corpo inteiro, 3x por semana, A/B alternado.
 *
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
 */
import type { GrupoMuscular } from '../tipos';

export interface ExercicioProgramado {
  nome: string;
  grupo: GrupoMuscular;
  series: number;
  repsAlvo: number;
  /** Quanto subir quando fechar todas as séries no alvo. */
  incremento: number;
  nota?: string;
}

export interface Programa {
  id: string;
  nome: string;
  foco: string;
  exercicios: ExercicioProgramado[];
}

export const PROGRAMAS: Programa[] = [
  {
    id: 'A',
    nome: 'Treino A',
    foco: 'Agachamento, empurrar horizontal, puxar horizontal',
    exercicios: [
      { nome: 'Agachamento livre', grupo: 'pernas', series: 3, repsAlvo: 5, incremento: 5, nota: 'Desce até a coxa passar da paralela. Carga só sobe se as 3 séries fecharem.' },
      { nome: 'Supino reto', grupo: 'peito', series: 3, repsAlvo: 5, incremento: 2.5 },
      { nome: 'Remada curvada', grupo: 'costas', series: 3, repsAlvo: 8, incremento: 2.5 },
      { nome: 'Face pull', grupo: 'ombro', series: 3, repsAlvo: 15, incremento: 1, nota: 'Prevenção de ombro. Não é acessório opcional pra quem joga raquete.' },
      { nome: 'Prancha', grupo: 'core', series: 3, repsAlvo: 45, incremento: 5, nota: 'Registre segundos no campo de reps.' },
    ],
  },
  {
    id: 'B',
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

export const GRUPOS: { id: GrupoMuscular; nome: string }[] = [
  { id: 'pernas', nome: 'Pernas' },
  { id: 'peito', nome: 'Peito' },
  { id: 'costas', nome: 'Costas' },
  { id: 'ombro', nome: 'Ombro' },
  { id: 'braco', nome: 'Braço' },
  { id: 'core', nome: 'Core' },
  { id: 'corpo-todo', nome: 'Corpo todo' },
];
