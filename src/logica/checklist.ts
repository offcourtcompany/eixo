/**
 * O checklist de um evento, com prazos calculados a partir da data dele.
 *
 * A ideia central: **a lista não é uma lista, é um calendário.** Item de
 * checklist sem prazo é lembrete, e lembrete se lê no dia em que já não
 * adianta. Com prazo, a mesma lista responde a pergunta útil — o que precisa
 * acontecer nesta semana para o evento não custar mais caro — e só isso
 * aparece na frente.
 *
 * Por isso a função principal daqui não devolve tudo: devolve o que está
 * atrasado, o que vence nos próximos dias, e o total. O resto fica guardado
 * até a hora dele.
 */
import type { PlanoEvento, ItemChecklist } from '../tipos';
import { hoje, somaDias } from '../formato';
import { MODELO_TORNEIO, FASES, type FaseChecklist } from '../dados/checklistTorneio';

/** Cria a lista de um evento a partir do modelo. */
export function gerarChecklist(): ItemChecklist[] {
  return MODELO_TORNEIO.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    fase: m.fase,
    diasAntes: m.diasAntes,
    detalhe: m.detalhe,
    feita: false,
  }));
}

/** O prazo de um item, em data, a partir da data do evento. */
export const prazoDoItem = (dataDoEvento: string, diasAntes: number) =>
  somaDias(dataDoEvento, -diasAntes);

export interface ItemComPrazo extends ItemChecklist {
  prazo: string;
  atrasado: boolean;
  diasParaOPrazo: number;
}

export interface EstadoDoChecklist {
  total: number;
  feitas: number;
  progresso: number;
  /** Vencidos e ainda abertos. Ordenados do mais antigo para o mais recente. */
  atrasados: ItemComPrazo[];
  /** Abertos com prazo dentro da janela — o que fazer agora. */
  agora: ItemComPrazo[];
  porFase: { fase: FaseChecklist; nome: string; itens: ItemComPrazo[]; feitas: number }[];
  /** Sem data no evento não há prazo nenhum, e a lista vira lembrete. */
  temData: boolean;
}

export function estadoDoChecklist(
  plano: PlanoEvento, data = hoje(), janelaDias = 10,
): EstadoDoChecklist {
  const itens = plano.checklist || [];
  const temData = Boolean(plano.data);
  const limite = somaDias(data, janelaDias);

  const comPrazo: ItemComPrazo[] = itens.map((i) => {
    const prazo = temData ? prazoDoItem(plano.data!, i.diasAntes) : '';
    return {
      ...i,
      prazo,
      atrasado: Boolean(temData && !i.feita && prazo < data),
      diasParaOPrazo: temData
        ? Math.round((new Date(prazo).getTime() - new Date(data).getTime()) / 86400000)
        : 0,
    };
  });

  const abertos = comPrazo.filter((i) => !i.feita);
  const ordemDoPrazo = (a: ItemComPrazo, b: ItemComPrazo) => a.prazo.localeCompare(b.prazo);

  const porFase = (Object.keys(FASES) as FaseChecklist[])
    .map((fase) => {
      const doGrupo = comPrazo.filter((i) => i.fase === fase);
      return {
        fase,
        nome: FASES[fase].nome,
        itens: doGrupo,
        feitas: doGrupo.filter((i) => i.feita).length,
      };
    })
    .filter((g) => g.itens.length > 0);

  const feitas = comPrazo.filter((i) => i.feita).length;

  return {
    total: comPrazo.length,
    feitas,
    progresso: comPrazo.length ? feitas / comPrazo.length : 0,
    atrasados: temData ? abertos.filter((i) => i.atrasado).sort(ordemDoPrazo) : [],
    agora: temData
      ? abertos.filter((i) => !i.atrasado && i.prazo <= limite).sort(ordemDoPrazo)
      : abertos,
    porFase,
    temData,
  };
}

/**
 * A leitura de risco do evento inteiro, em uma frase.
 *
 * Só o número de atrasados não diz nada: cinco itens vencidos a quarenta dias
 * do evento é normal, e um item vencido na véspera pode ser o que derruba o
 * dia. O que separa os dois casos é **quanto tempo ainda existe para
 * resolver** — por isso o alerta endurece à medida que a data se aproxima, e
 * não à medida que a lista cresce.
 */
export function riscoDoEvento(e: EstadoDoChecklist, plano: PlanoEvento, data = hoje()) {
  if (!e.total) return null;
  if (!e.temData) {
    return {
      tom: 'info' as const,
      texto: 'Sem data no evento, os itens não têm prazo — a lista funciona como lembrete, não '
        + 'como calendário. Preencha a data e cada item ganha o dia em que precisa estar pronto.',
    };
  }

  const diasAteOEvento = Math.round(
    (new Date(plano.data!).getTime() - new Date(data).getTime()) / 86400000,
  );

  if (diasAteOEvento < 0) {
    const depoisAbertos = e.atrasados.length;
    return depoisAbertos
      ? {
        tom: 'info' as const,
        texto: `O evento passou e ${depoisAbertos} ${depoisAbertos === 1 ? 'item continua' : 'itens continuam'} `
          + 'em aberto. É a parte que quase todo organizador pula, e é a que decide se o patrocinador '
          + 'renova e se a próxima edição começa com lista de inscritos.',
      }
      : { tom: 'bom' as const, texto: 'Evento encerrado com a lista fechada, pós-evento incluído.' };
  }

  if (!e.atrasados.length) {
    return {
      tom: 'bom' as const,
      texto: `Nada atrasado. Faltam ${diasAteOEvento} ${diasAteOEvento === 1 ? 'dia' : 'dias'} e `
        + `${e.agora.length} ${e.agora.length === 1 ? 'item vence' : 'itens vencem'} nos próximos dez.`,
    };
  }

  const grave = diasAteOEvento <= 14;
  return {
    tom: grave ? ('alerta' as const) : ('info' as const),
    texto: `${e.atrasados.length} ${e.atrasados.length === 1 ? 'item passou' : 'itens passaram'} do prazo `
      + `e faltam ${diasAteOEvento} ${diasAteOEvento === 1 ? 'dia' : 'dias'}. `
      + (grave
        ? 'Nesta altura, atraso deixa de custar dinheiro e passa a custar o dia: fornecedor sem '
          + 'antecedência cobra mais ou não entrega. Resolva estes antes de qualquer coisa nova.'
        : 'Ainda dá tempo, e é exatamente por isso que vale resolver agora — o mesmo item custa '
          + 'mais caro a cada semana que passa.'),
  };
}
