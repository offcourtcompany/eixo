/** Os quatro eixoes. Toda meta e todo hábito pertence a um deles. */
export type Eixo = 'dinheiro' | 'corpo' | 'mente' | 'oficio';

export const EIXOS: Record<Eixo, { nome: string; cor: string; descricao: string }> = {
  dinheiro: { nome: 'Finanças', cor: '#EE6018', descricao: 'Sobra mensal, dívida, receita recorrente' },
  corpo:    { nome: 'Corpo',    cor: '#F2A07A', descricao: 'Força, peso, sono, comida' },
  mente:    { nome: 'Mente',    cor: '#B8B3B0', descricao: 'Humor, foco, descompressão' },
  oficio:   { nome: 'Ofício',   cor: '#A0CA92', descricao: 'Gestão esportiva, estudo, autoridade' },
};

// ─────────────────────────── Financeiro ───────────────────────────

export type TipoFluxo = 'entrada' | 'saida';

/**
 * De onde a entrada veio. Essa distinção é o coração do módulo: o objetivo
 * declarado é receita RECORRENTE ≥ piso de custo fixo. Sem separar avulso de
 * recorrente, o mês bom de evento esconde que a base não mudou.
 */
export type OrigemReceita = 'fixa' | 'recorrente' | 'avulsa';

export interface Lancamento {
  id: string;
  data: string;              // YYYY-MM-DD
  tipo: TipoFluxo;
  valor: number;             // sempre positivo; o tipo diz o sinal
  categoria: string;
  descricao?: string;
  origem?: OrigemReceita;    // só faz sentido em entradas
  fixo?: boolean;            // saída que se repete todo mês
  criadoEm: string;
  /** Gerado a partir de um fixo cadastrado — guarda de qual. */
  deRecorrente?: string;
  /** A qual frente de trabalho este dinheiro pertence — o mesmo cadastro da
   *  Agenda. É o que permite perguntar quanto cada torneio deu de margem e
   *  quanto a arena paga por hora. Vazio = não pertence a nenhuma. */
  frenteId?: string;
  /** Entrou sozinho e ainda espera um toque seu. Conta nos totais mesmo assim:
   *  o compromisso existe, confirmado ou não. Confirmar serve para você ajustar
   *  o valor real do mês, que quase nunca bate na vírgula. */
  aConfirmar?: boolean;
}

/**
 * Um compromisso que se repete todo mês — seguro, consórcio, filha, o fixo da
 * arena. Você cadastra uma vez e ele passa a aparecer sozinho todo mês,
 * esperando confirmação.
 *
 * Isso não é importar dado de fora: é parar de digitar de novo o que você já
 * disse uma vez. O que o app nunca faz é inventar um valor que você não deu.
 */
export interface Recorrente {
  id: string;
  nome: string;
  tipo: TipoFluxo;
  valor: number;
  categoria: string;
  diaDoMes: number;          // 1–31; meses curtos caem no último dia
  origem?: OrigemReceita;    // só entradas
  fixo: boolean;             // saídas: conta como custo fixo
  ativo: boolean;
  /** Último mês (YYYY-MM) já gerado. Impede ressuscitar o que você apagou. */
  geradoAte?: string;
  criadoEm: string;
}

export interface Divida {
  id: string;
  nome: string;
  saldo: number;
  taxaMensal: number;        // 0.15 = 15% a.m.
  parcelaMinima: number;
  ativa: boolean;
  criadoEm: string;
}

/**
 * As mudanças de contrato — não de comportamento.
 * Organização não vence 15% ao mês; troca de contrato vence.
 */
export interface AcaoEstrutural {
  id: string;
  titulo: string;
  detalhe: string;
  impactoMensal: number;     // quanto sobra por mês se sair
  status: 'aberta' | 'andamento' | 'feita' | 'descartada';
  prazo?: string;
  nota?: string;
  ordem: number;
}

// ─────────────────────── Hábitos, metas, dias ───────────────────────

export interface Habito {
  id: string;
  nome: string;
  /** A versão ridícula de 2 minutos. O piso é o que conta como presença. */
  piso: string;
  quando: string;            // intenção de implementação: quando
  onde: string;              // ...e onde
  depoisDe?: string;         // empilhamento sobre hábito já existente
  dias: number[];            // 0=dom … 6=sáb
  eixo: Eixo;
  ativo: boolean;
  ordem: number;
  criadoEm: string;
}

/** Um documento por dia. id = YYYY-MM-DD. */
export interface Dia {
  id: string;
  habitos?: Record<string, boolean>;
  humor?: number;            // 1–5
  energia?: number;          // 1–5
  sonoHoras?: number;
  peso?: number;
  nota?: string;
}

export interface ResultadoChave {
  id: string;
  nome: string;
  unidade: string;
  inicio: number;
  alvo: number;
  atual: number;
}

export interface Meta {
  id: string;
  objetivo: string;
  porque: string;
  eixo: Eixo;
  trimestre: string;         // 2026-T3
  krs: ResultadoChave[];
  /** 4DX: o que você controla e faz toda semana, não o resultado. */
  medidasDirecao: string[];
  status: 'ativa' | 'concluida' | 'arquivada';
  criadoEm: string;
}

// ───────────────────────────── Treino ─────────────────────────────

export type GrupoMuscular =
  | 'pernas' | 'peito' | 'costas' | 'ombro' | 'braco' | 'core' | 'corpo-todo';

export interface SerieFeita {
  carga: number;             // kg
  reps: number;
  rir?: number;              // repetições em reserva
}

export interface ExercicioFeito {
  nome: string;
  grupo: GrupoMuscular;
  series: SerieFeita[];
}

export interface Treino {
  id: string;
  data: string;
  programa: string;          // 'A' | 'B' | livre
  exercicios: ExercicioFeito[];
  duracaoMin?: number;
  nota?: string;
  criadoEm: string;
}

export interface Perfil {
  nome?: string;
  pesoAlvo?: number;
  rendaFixa?: number;        // o piso que precisa ser coberto todo mês
  custoFixoMensal?: number;
  reservaAlvoMeses?: number;
  reservaAtual?: number;
  atualizadoEm?: string;
}

// ─────────────────────────── Agenda ───────────────────────────

/**
 * Uma frente de trabalho: o emprego fixo, um torneio, um projeto, a vida
 * pessoal. Tudo que você marca pode pertencer a uma.
 *
 * Isso existe por um motivo específico: com quatro frentes rodando ao mesmo
 * tempo, a pergunta que trava não é "o que eu tenho hoje" — é "quanto do meu
 * tempo está indo para a que não paga". Sem essa etiqueta, a agenda vira uma
 * lista longa onde tudo parece igualmente urgente.
 */
export interface Frente {
  id: string;
  nome: string;
  cor: string;
  /** `fixo` = emprego/contrato recorrente. `projeto` = tem fim. `pessoal` = sua vida. */
  tipo: 'fixo' | 'projeto' | 'pessoal';
  /**
   * Os dois modelos de receita, que se comportam de formas opostas:
   *
   * `contratado` — alguém te paga para executar. Receita garantida por
   * contrato, zero capital seu em risco, prejuízo de bilheteria é do
   * contratante. `proprio` — o evento é seu: upside alto, capital e risco de
   * ocupação também seus.
   *
   * Enquanto houver dívida e nenhum colchão, contratado ganha de próprio. Sem
   * esta etiqueta a proporção entre os dois fica na intuição em vez de ficar
   * no gráfico.
   */
  modelo?: 'contratado' | 'proprio';
  ativo: boolean;
  ordem: number;
  criadoEm: string;
}

/**
 * Cores de frente: tons e sombras dos dois acentos da referência mais os
 * neutros quentes. Nenhuma matiz nova entra aqui — a regra é que cor só existe
 * para identificar dado, e oito frentes num calendário precisam se distinguir
 * à distância de um ponto de 6px.
 */
export const CORES_FRENTE = [
  '#EE6018', '#A0CA92', '#B8B3B0', '#F2A07A',
  '#6F8F66', '#8A8380', '#EEEEEE', '#4D4947',
];

/** Compromisso com data marcada. Acontece uma vez. */
export interface Evento {
  id: string;
  titulo: string;
  data: string;              // YYYY-MM-DD
  hora?: string;             // HH:MM — sem hora vira compromisso do dia inteiro
  duracaoMin?: number;
  local?: string;
  frenteId?: string;
  nota?: string;
  criadoEm: string;
}

/**
 * Compromisso que se repete nos mesmos dias da semana — a rodada de segunda,
 * o expediente da arena, a reunião quinzenal que virou semanal.
 *
 * Diferente dos fixos do dinheiro, rotina NÃO gera documento por ocorrência:
 * ela é desenhada na grade a partir da regra. Guardar 52 cópias de "toda
 * segunda" só encheria o banco de linhas que ninguém edita. E marcar rotina
 * como feita é papel do módulo de Hábitos, que já existe e já sabe contar
 * sequência — aqui a rotina responde "o que ocupa o meu dia", não "eu fiz".
 */
export interface Rotina {
  id: string;
  titulo: string;
  dias: number[];            // 0=dom … 6=sáb
  hora?: string;
  duracaoMin?: number;
  local?: string;
  frenteId?: string;
  ativo: boolean;
  criadoEm: string;
}

/** Afazer. Com prazo aparece no dia; sem prazo fica na lista da frente. */
export interface Tarefa {
  id: string;
  titulo: string;
  frenteId?: string;
  prazo?: string;            // YYYY-MM-DD
  /** 4DX: `chave` é a que move o placar. Poucas por semana, ou não significa nada. */
  peso: 'normal' | 'chave';
  feita: boolean;
  feitaEm?: string;
  nota?: string;
  criadoEm: string;
}

/**
 * Uma fotografia do patrimônio num dia — dívida total e reserva.
 *
 * Existe por um motivo específico: `Divida.saldo` é um número que você
 * sobrescreve, então sem isto não há passado nenhum e você nunca veria a linha
 * dos R$ 13.000 descendo. Num alvo de um a dois anos, ver a curva cair é o que
 * sustenta o uso do sistema.
 *
 * id = AAAA-MM-DD, então dois registros no mesmo dia se corrigem em vez de
 * empilhar.
 */
export interface Marco {
  id: string;
  dividaTotal: number;
  reserva: number;
  /** O que mudou nesse ponto — de preferência o nome da ação estrutural. */
  nota?: string;
  criadoEm: string;
}
