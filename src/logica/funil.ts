/**
 * O funil de receita.
 *
 * A ideia central, e a única que faz um funil valer o trabalho de manter: **o
 * que importa não é quanto tem no funil, é o que está parado nele.** Pipeline
 * bonito com dez oportunidades sem próximo passo marcado não é pipeline — é
 * uma lista de gente com quem você conversou uma vez.
 *
 * A segunda ideia é a aritmética que quase ninguém faz: para fechar um valor,
 * é preciso ter várias vezes esse valor em conversa, porque a maioria não
 * fecha. Sem essa conta, prospecta-se pouco e culpa-se o mercado.
 */
import type { Oportunidade, EtapaFunil } from '../tipos';
import { hoje, somaDias } from '../formato';

/**
 * Probabilidade por etapa.
 *
 * São referências de venda consultiva de ticket alto, não medida do seu
 * histórico — depois de umas vinte oportunidades fechadas ou perdidas, a sua
 * taxa real vale mais que esta tabela, e a tela passa a mostrar as duas.
 */
export const ETAPAS: Record<EtapaFunil, { nome: string; prob: number; ordem: number }> = {
  lista: { nome: 'Na lista', prob: 0.05, ordem: 1 },
  contato: { nome: 'Contato feito', prob: 0.1, ordem: 2 },
  reuniao: { nome: 'Reunião', prob: 0.25, ordem: 3 },
  proposta: { nome: 'Proposta enviada', prob: 0.5, ordem: 4 },
  negociacao: { nome: 'Negociando', prob: 0.75, ordem: 5 },
  fechado: { nome: 'Fechado', prob: 1, ordem: 6 },
  perdido: { nome: 'Perdido', prob: 0, ordem: 7 },
};

export const EM_ANDAMENTO: EtapaFunil[] = ['lista', 'contato', 'reuniao', 'proposta', 'negociacao'];

export const emAndamento = (o: Oportunidade) => EM_ANDAMENTO.includes(o.etapa);

export interface ResumoFunil {
  total: number;
  /** Soma dos valores ponderada pela probabilidade da etapa. */
  ponderado: number;
  /** Quanto já foi fechado no período todo. */
  fechado: number;
  recorrenteFechado: number;
  quantidade: number;
  /** Sem próximo passo, ou com o passo vencido. */
  paradas: Oportunidade[];
  porEtapa: { etapa: EtapaFunil; itens: Oportunidade[]; soma: number }[];
}

export function resumoDoFunil(oportunidades: Oportunidade[], data = hoje()): ResumoFunil {
  const abertas = oportunidades.filter(emAndamento);
  const fechadas = oportunidades.filter((o) => o.etapa === 'fechado');

  // Parada é a que não tem próximo passo marcado, ou cuja data já passou.
  // É a única métrica do funil que cobra ação em vez de descrever estado.
  const paradas = abertas
    .filter((o) => !o.proximoPasso || !o.proximoEm || o.proximoEm < data)
    .sort((a, b) => (a.proximoEm || '').localeCompare(b.proximoEm || ''));

  const porEtapa = EM_ANDAMENTO.map((etapa) => {
    const itens = abertas
      .filter((o) => o.etapa === etapa)
      .sort((a, b) => (a.proximoEm || '9').localeCompare(b.proximoEm || '9'));
    return { etapa, itens, soma: itens.reduce((s, o) => s + o.valor, 0) };
  });

  return {
    total: abertas.reduce((s, o) => s + o.valor, 0),
    ponderado: abertas.reduce((s, o) => s + o.valor * ETAPAS[o.etapa].prob, 0),
    fechado: fechadas.reduce((s, o) => s + o.valor, 0),
    recorrenteFechado: fechadas.filter((o) => o.recorrente).reduce((s, o) => s + o.valor, 0),
    quantidade: abertas.length,
    paradas,
    porEtapa,
  };
}

/**
 * A taxa real: quantas das oportunidades que chegaram ao fim viraram contrato.
 *
 * Só é honesta depois de umas dez decididas. Antes disso o número oscila
 * demais e induz a conclusão errada — por isso vem com a contagem junto.
 */
export function taxaReal(oportunidades: Oportunidade[]) {
  const decididas = oportunidades.filter((o) => o.etapa === 'fechado' || o.etapa === 'perdido');
  const ganhas = decididas.filter((o) => o.etapa === 'fechado').length;
  return {
    decididas: decididas.length,
    ganhas,
    taxa: decididas.length ? ganhas / decididas.length : 0,
    confiavel: decididas.length >= 10,
  };
}

/**
 * Quanto precisa entrar em conversa para fechar um alvo.
 *
 * É a conta que transforma "preciso de mais patrocínio" em número de ligações.
 * Usa a taxa real quando ela já é confiável; senão, uma referência de 20%, que
 * é conservadora para venda de cota.
 */
export function pipelineNecessario(alvo: number, oportunidades: Oportunidade[]) {
  const t = taxaReal(oportunidades);
  const taxa = t.confiavel && t.taxa > 0 ? t.taxa : 0.2;
  const aberto = oportunidades.filter(emAndamento).reduce((s, o) => s + o.valor * ETAPAS[o.etapa].prob, 0);
  return {
    taxa,
    usandoReal: t.confiavel && t.taxa > 0,
    necessario: alvo / taxa,
    aberto,
    falta: Math.max(0, alvo / taxa - aberto / taxa),
  };
}

/** As que precisam de você hoje: passo vencido ou marcado para os próximos dias. */
export function paraEssaSemana(oportunidades: Oportunidade[], data = hoje()) {
  const limite = somaDias(data, 7);
  return oportunidades
    .filter(emAndamento)
    .filter((o) => o.proximoEm && o.proximoEm <= limite)
    .sort((a, b) => (a.proximoEm || '').localeCompare(b.proximoEm || ''));
}

/** Motivos de perda agrupados — a autópsia que evita repetir o mesmo erro. */
export function motivosDePerda(oportunidades: Oportunidade[]) {
  const mapa = new Map<string, number>();
  for (const o of oportunidades) {
    if (o.etapa !== 'perdido') continue;
    const chave = (o.motivoPerda || 'sem motivo registrado').trim();
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  }
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
}
