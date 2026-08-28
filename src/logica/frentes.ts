/**
 * A conta que faltava: quanto cada frente dá, e quanto ela custa em tempo.
 *
 * O app já sabia duas metades separadas — quanto entrou e saiu (Finanças) e
 * quantas horas por semana cada frente ocupa (Agenda). Juntar as duas responde
 * a pergunta que decide a agenda do mês seguinte: **qual frente devolve
 * dinheiro pelo tempo que come**.
 *
 * E separa os dois modelos de receita, que se comportam de formas opostas:
 * evento contratado tem receita garantida e risco do contratante; evento
 * próprio tem upside alto com o capital e a ocupação por sua conta. Enquanto
 * houver dívida e nenhum colchão, o primeiro ganha do segundo — mas isso só
 * vira decisão quando dá para ver a proporção.
 */
import type { Lancamento, Frente, Rotina } from '../tipos';
import { mesDe } from '../formato';
import { horasSemanaisPorFrente } from './agenda';

export interface ResultadoDaFrente {
  frente: Frente | null;      // null = lançamentos sem frente
  entradas: number;
  saidas: number;
  margem: number;
  /** Minutos por semana vindos das rotinas cadastradas. */
  minutosSemana: number;
  /** Margem do período dividida pelas horas gastas no mesmo período. */
  porHora: number | null;
  lancamentos: number;
}

/**
 * `meses` é a janela em AAAA-MM (ex.: ['2026-06','2026-07','2026-08']). A conta
 * de R$/hora usa as horas de rotina projetadas para essa mesma janela — é
 * estimativa, não cronômetro, e a tela diz isso.
 */
export function resultadoPorFrente(
  lancamentos: Lancamento[],
  frentes: Frente[],
  rotinas: Rotina[],
  meses: string[],
): ResultadoDaFrente[] {
  const janela = new Set(meses);
  const semanas = meses.length * 4.345;          // semanas médias no período
  const horas = horasSemanaisPorFrente(rotinas);

  const porChave = new Map<string, ResultadoDaFrente>();
  const chaveDe = (id?: string) => id || 'sem-frente';

  const garantir = (id?: string): ResultadoDaFrente => {
    const chave = chaveDe(id);
    let r = porChave.get(chave);
    if (!r) {
      const minutosSemana = horas.get(chave) || 0;
      r = {
        frente: frentes.find((f) => f.id === id) || null,
        entradas: 0, saidas: 0, margem: 0, minutosSemana, porHora: null, lancamentos: 0,
      };
      porChave.set(chave, r);
    }
    return r;
  };

  // Toda frente cadastrada aparece, mesmo sem lançamento: frente que só consome
  // hora e nunca devolve dinheiro é justamente o achado que interessa.
  for (const f of frentes) if (f.ativo) garantir(f.id);

  for (const l of lancamentos) {
    if (!janela.has(mesDe(l.data))) continue;
    const r = garantir(l.frenteId);
    if (l.tipo === 'entrada') r.entradas += l.valor;
    else r.saidas += l.valor;
    r.lancamentos++;
  }

  const saida = [...porChave.values()];
  for (const r of saida) {
    r.margem = r.entradas - r.saidas;
    const horasNoPeriodo = (r.minutosSemana / 60) * semanas;
    r.porHora = horasNoPeriodo > 0 ? r.margem / horasNoPeriodo : null;
  }

  // Maior margem primeiro; quem não tem frente vai para o fim.
  return saida.sort((a, b) => {
    if (!a.frente) return 1;
    if (!b.frente) return -1;
    return b.margem - a.margem;
  });
}

export interface PorModelo {
  contratado: number;
  proprio: number;
  semEtiqueta: number;
  total: number;
}

/** Receita do mês repartida entre os dois modelos, via etiqueta da frente. */
export function receitaPorModelo(
  lancamentos: Lancamento[],
  frentes: Frente[],
  mes: string,
): PorModelo {
  const modeloDe = new Map(frentes.map((f) => [f.id, f.modelo]));
  const fora: PorModelo = { contratado: 0, proprio: 0, semEtiqueta: 0, total: 0 };

  for (const l of lancamentos) {
    if (l.tipo !== 'entrada' || mesDe(l.data) !== mes) continue;
    const modelo = l.frenteId ? modeloDe.get(l.frenteId) : undefined;
    if (modelo === 'contratado') fora.contratado += l.valor;
    else if (modelo === 'proprio') fora.proprio += l.valor;
    else fora.semEtiqueta += l.valor;
    fora.total += l.valor;
  }
  return fora;
}

/** A mesma repartição ao longo de vários meses, para o gráfico de tendência. */
export const seriePorModelo = (lancamentos: Lancamento[], frentes: Frente[], meses: string[]) =>
  meses.map((mes) => ({ mes, ...receitaPorModelo(lancamentos, frentes, mes) }));
