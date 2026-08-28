/**
 * Contas do treino.
 *
 * A régua é **sobrecarga progressiva** (Rippetoe, *Starting Strength*): o
 * estímulo só existe se a carga ou as repetições subirem com o tempo. Por isso
 * o app não pergunta "como foi o treino" — ele mostra o que você levantou da
 * última vez e sugere o próximo passo. Bateu todas as repetições-alvo, sobe;
 * não bateu, repete a carga. Duas repetições seguidas sem bater, desce 10%.
 */
import type { Treino, GrupoMuscular } from '../tipos';

/** Epley — estimativa de 1RM. Serve para comparar séries de reps diferentes. */
export const e1rm = (carga: number, reps: number) => carga * (1 + reps / 30);

export function seriesDoExercicio(treinos: Treino[], nome: string) {
  return treinos
    .filter((t) => t.exercicios.some((e) => e.nome === nome))
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function ultimaSessao(treinos: Treino[], nome: string) {
  const t = seriesDoExercicio(treinos, nome)[0];
  if (!t) return null;
  const ex = t.exercicios.find((e) => e.nome === nome)!;
  return { data: t.data, series: ex.series };
}

export function recorde(treinos: Treino[], nome: string) {
  let melhor: { carga: number; reps: number; e1rm: number; data: string } | null = null;
  for (const t of treinos) {
    for (const e of t.exercicios) {
      if (e.nome !== nome) continue;
      for (const s of e.series) {
        const est = e1rm(s.carga, s.reps);
        if (!melhor || est > melhor.e1rm) melhor = { carga: s.carga, reps: s.reps, e1rm: est, data: t.data };
      }
    }
  }
  return melhor;
}

export interface Sugestao { carga: number; motivo: string }

export function sugerirCarga(
  treinos: Treino[], nome: string, repsAlvo: number, incremento: number,
): Sugestao | null {
  const sessoes = seriesDoExercicio(treinos, nome).slice(0, 2);
  if (!sessoes.length) return null;

  const seriesDe = (t: Treino) => t.exercicios.find((e) => e.nome === nome)!.series;
  const ultimas = seriesDe(sessoes[0]);
  if (!ultimas.length) return null;

  const carga = Math.max(...ultimas.map((s) => s.carga));
  const doPeso = ultimas.filter((s) => s.carga === carga);
  const bateu = doPeso.every((s) => s.reps >= repsAlvo);

  if (bateu) return { carga: carga + incremento, motivo: `bateu ${repsAlvo} reps em todas as séries` };

  if (sessoes[1]) {
    const antes = seriesDe(sessoes[1]);
    const cargaAntes = Math.max(...antes.map((s) => s.carga));
    const bateuAntes = antes.filter((s) => s.carga === cargaAntes).every((s) => s.reps >= repsAlvo);
    if (!bateuAntes && cargaAntes >= carga) {
      // Duas sessões travadas na mesma carga: recuar 10% e subir de novo é mais
      // rápido que insistir. Descarregar é parte do programa, não desistência.
      return { carga: Math.round(carga * 0.9 / incremento) * incremento, motivo: 'duas sessões travadas — descarregue 10% e suba de novo' };
    }
  }
  return { carga, motivo: 'repita a carga até fechar todas as séries' };
}

export function volumePorGrupo(treinos: Treino[], desde: string) {
  const mapa = new Map<GrupoMuscular, { series: number; tonelagem: number }>();
  for (const t of treinos) {
    if (t.data < desde) continue;
    for (const e of t.exercicios) {
      const atual = mapa.get(e.grupo) || { series: 0, tonelagem: 0 };
      atual.series += e.series.length;
      atual.tonelagem += e.series.reduce((s, x) => s + x.carga * x.reps, 0);
      mapa.set(e.grupo, atual);
    }
  }
  return mapa;
}

export const tonelagem = (t: Treino) =>
  t.exercicios.reduce((s, e) => s + e.series.reduce((a, x) => a + x.carga * x.reps, 0), 0);
