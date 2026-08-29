/**
 * Um único ponto de carga para todas as coleções do usuário.
 *
 * As telas recebem `dados` inteiro em vez de cada uma abrir sua própria
 * assinatura: assim o Firestore mantém um listener por coleção, e o painel de
 * Hoje — que precisa de dinheiro, hábito e treino ao mesmo tempo — não paga
 * nada a mais por isso.
 */
import { useColecao, useDias, usePerfil } from './store';
import type {
  Lancamento, Divida, AcaoEstrutural, Habito, Meta, Treino, Recorrente,
  Frente, Evento, Rotina, Tarefa, Marco, Refeicao, AlimentoMeu, Semana,
  Estudo, Pergunta, Conquista,
} from './tipos';

export function useDadosApp(uid: string) {
  const lancamentos = useColecao<Lancamento>(uid, 'lancamentos', 'data');
  const recorrentes = useColecao<Recorrente>(uid, 'recorrentes');
  const dividas = useColecao<Divida>(uid, 'dividas');
  const acoes = useColecao<AcaoEstrutural>(uid, 'acoes', 'ordem', 'asc');
  const habitos = useColecao<Habito>(uid, 'habitos', 'ordem', 'asc');
  const metas = useColecao<Meta>(uid, 'metas');
  const treinos = useColecao<Treino>(uid, 'treinos', 'data');
  const frentes = useColecao<Frente>(uid, 'frentes', 'ordem', 'asc');
  const eventos = useColecao<Evento>(uid, 'eventos', 'data');
  const rotinas = useColecao<Rotina>(uid, 'rotinas');
  const tarefas = useColecao<Tarefa>(uid, 'tarefas');
  const marcos = useColecao<Marco>(uid, 'marcos', 'id', 'asc');
  const refeicoes = useColecao<Refeicao>(uid, 'refeicoes', 'ordem', 'asc');
  const alimentos = useColecao<AlimentoMeu>(uid, 'alimentos', 'nome', 'asc');
  const semanas = useColecao<Semana>(uid, 'semanas', 'id', 'asc');
  const estudos = useColecao<Estudo>(uid, 'estudos', 'ordem', 'asc');
  const perguntas = useColecao<Pergunta>(uid, 'perguntas', 'proximaEm', 'asc');
  const conquistas = useColecao<Conquista>(uid, 'conquistas', 'ordem', 'asc');
  const { dias, porData, salvarDia } = useDias(uid);
  const { perfil, salvarPerfil } = usePerfil(uid);

  return {
    uid, lancamentos, recorrentes, dividas, acoes, habitos, metas, treinos,
    frentes, eventos, rotinas, tarefas, marcos, refeicoes, alimentos, semanas,
    estudos, perguntas, conquistas,
    dias, porData, salvarDia, perfil, salvarPerfil,
  };
}

export type DadosApp = ReturnType<typeof useDadosApp>;
