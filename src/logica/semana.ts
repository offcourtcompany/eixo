/**
 * A semana: o fechamento que costura os módulos.
 *
 * Cada tela do app responde bem à sua pergunta e nenhuma responde "como foi a
 * semana". Isto junta o que o app já sabe — dinheiro, hábitos, agenda, comida —
 * para o pensamento começar depois dos números, e não gastando meia hora
 * atrás deles.
 *
 * Duas regras de desenho:
 *
 * **Nada acontece sozinho.** A revisão semanal automática foi recusada de
 * propósito; aqui você abre, olha e fecha. A diferença entre isto e o que foi
 * recusado é quem começa.
 *
 * **O placar é das medidas de direção, não dos resultados.** É a ideia central
 * do 4DX: resultado (KR) você não controla no dia a dia — medida de direção
 * você controla, e é ela que move o resultado. Sem contagem semanal, medida de
 * direção é frase motivacional.
 */
import type { Dia, Habito, Lancamento, Meta, MedidaDirecao, Semana, Tarefa, Refeicao } from '../tipos';
import { ymd, deYmd, somaDias, mesDe } from '../formato';
import { adesaoDoDia } from './nutricao';

/** A segunda-feira da semana de uma data. É o id do fechamento. */
export function segundaDa(data: string) {
  const d = deYmd(data);
  const dow = d.getDay();                    // 0 = domingo
  const recuo = dow === 0 ? 6 : dow - 1;     // domingo pertence à semana que começou na segunda
  return somaDias(data, -recuo);
}

export const diasDaSemana = (segunda: string) =>
  Array.from({ length: 7 }, (_, i) => somaDias(segunda, i));

export const rotuloDaSemana = (segunda: string) => {
  const fim = somaDias(segunda, 6);
  const dia = (s: string) => s.slice(8) + '/' + s.slice(5, 7);
  return `${dia(segunda)} a ${dia(fim)}`;
};

/**
 * Aceita medida antiga (texto solto) e nova (objeto com alvo).
 *
 * O formato mudou quando o placar entrou. Como o app já estava no ar, ler os
 * dois evita que uma meta salva antes quebre a tela — e é barato.
 */
export function normalizarMedidas(bruto: unknown): MedidaDirecao[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.map((m, i) => (
    typeof m === 'string'
      ? { id: 'md' + (i + 1), texto: m, alvoSemanal: 1 }
      : {
          id: (m as MedidaDirecao).id || 'md' + (i + 1),
          texto: (m as MedidaDirecao).texto || '',
          alvoSemanal: (m as MedidaDirecao).alvoSemanal || 1,
        }
  )).filter((m) => m.texto.trim());
}

export interface LinhaDeMedida {
  meta: Meta;
  medida: MedidaDirecao;
  feito: number;
  bateu: boolean;
}

/** As medidas de todas as metas ativas do trimestre, com o que já foi contado. */
export function medidasDaSemana(metas: Meta[], trimestre: string, semana?: Semana): LinhaDeMedida[] {
  const saida: LinhaDeMedida[] = [];
  for (const meta of metas) {
    if (meta.status !== 'ativa' || meta.trimestre !== trimestre) continue;
    for (const medida of normalizarMedidas(meta.medidasDirecao)) {
      const feito = semana?.medidas?.[medida.id] ?? 0;
      saida.push({ meta, medida, feito, bateu: feito >= medida.alvoSemanal });
    }
  }
  return saida;
}

export interface ResumoDaSemana {
  segunda: string;
  dias: string[];
  entrou: number;
  saiu: number;
  sobra: number;
  habitos: { feitos: number; possiveis: number; taxa: number };
  treinos: number;
  atrasados: number;
  refeicoes: { feitas: number; possiveis: number; taxa: number };
  proteinaMedia: number;
  sonoMedia: number | null;
  diasRegistrados: number;
}

export interface FontesDaSemana {
  lancamentos: Lancamento[];
  habitos: Habito[];
  porData: Map<string, Dia>;
  treinos: { data: string }[];
  tarefas: Tarefa[];
  refeicoes: Refeicao[];
}

/**
 * O retrato da semana, montado só com o que já existe no app.
 *
 * Repare no que NÃO está aqui: nenhum julgamento. A tela mostra os números e
 * uma pergunta; a conclusão é sua. Um app que fecha a semana dizendo se ela foi
 * boa ou ruim tira de você exatamente a parte que faz a revisão valer.
 */
export function resumoDaSemana(segunda: string, f: FontesDaSemana): ResumoDaSemana {
  const dias = diasDaSemana(segunda);
  const dentro = new Set(dias);

  let entrou = 0;
  let saiu = 0;
  for (const l of f.lancamentos) {
    if (!dentro.has(l.data)) continue;
    if (l.tipo === 'entrada') entrou += l.valor;
    else saiu += l.valor;
  }

  let feitos = 0;
  let possiveis = 0;
  const ativos = f.habitos.filter((h) => h.ativo);
  for (const data of dias) {
    for (const h of ativos) {
      if (!h.dias.includes(deYmd(data).getDay())) continue;
      possiveis++;
      if (f.porData.get(data)?.habitos?.[h.id]) feitos++;
    }
  }

  let refFeitas = 0;
  let refPossiveis = 0;
  let proteina = 0;
  let diasComProteina = 0;
  let sono = 0;
  let noites = 0;
  let diasRegistrados = 0;

  for (const data of dias) {
    const dia = f.porData.get(data);
    if (!dia) continue;
    diasRegistrados++;
    if (dia.refeicoes) {
      const a = adesaoDoDia(f.refeicoes, dia);
      refFeitas += a.feitas;
      refPossiveis += a.total;
    }
    if (typeof dia.proteinaG === 'number') { proteina += dia.proteinaG; diasComProteina++; }
    if (typeof dia.sonoHoras === 'number' && dia.sonoHoras > 0) { sono += dia.sonoHoras; noites++; }
  }

  const fim = dias[6];
  const atrasados = f.tarefas.filter((t) => !t.feita && t.prazo && t.prazo <= fim).length;

  return {
    segunda,
    dias,
    entrou,
    saiu,
    sobra: entrou - saiu,
    habitos: { feitos, possiveis, taxa: possiveis ? feitos / possiveis : 0 },
    treinos: f.treinos.filter((t) => dentro.has(t.data)).length,
    atrasados,
    refeicoes: {
      feitas: refFeitas,
      possiveis: refPossiveis,
      taxa: refPossiveis ? refFeitas / refPossiveis : 0,
    },
    proteinaMedia: diasComProteina ? Math.round(proteina / diasComProteina) : 0,
    sonoMedia: noites ? Math.round((sono / noites) * 10) / 10 : null,
    diasRegistrados,
  };
}

/** Histórico de uma medida nas últimas N semanas — o placar que faltava. */
export function historicoDaMedida(
  medidaId: string,
  semanas: Semana[],
  segundaAtual: string,
  quantas = 8,
) {
  const saida: { segunda: string; feito: number }[] = [];
  for (let i = quantas - 1; i >= 0; i--) {
    const segunda = somaDias(segundaAtual, -7 * i);
    const s = semanas.find((x) => x.id === segunda);
    saida.push({ segunda, feito: s?.medidas?.[medidaId] ?? 0 });
  }
  return saida;
}

/** Semanas seguidas, contando de trás para frente, em que a medida bateu o alvo. */
export function sequenciaDaMedida(historico: { feito: number }[], alvo: number) {
  let n = 0;
  for (let i = historico.length - 1; i >= 0; i--) {
    if (historico[i].feito >= alvo) n++;
    else break;
  }
  return n;
}

/** O mês da semana, para o fechamento saber de qual mês falar. */
export const mesDaSemana = (segunda: string) => mesDe(segunda);

export const semanaAtual = (hojeYmd = ymd()) => segundaDa(hojeYmd);
