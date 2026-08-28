/**
 * Contas dos hábitos.
 *
 * A regra central aqui é **nunca duas faltas seguidas** (Clear, *Hábitos
 * Atômicos*). Perfeccionista não abandona no dia que falha — abandona no
 * segundo. Por isso o app não celebra streak de 100 dias: ele grita no dia
 * seguinte a uma falta, que é o único momento em que o alerta muda alguma coisa.
 */
import type { Dia, Habito } from '../tipos';
import { diaSemana, hoje, somaDias } from '../formato';

export const ehDiaDe = (h: Habito, data: string) => h.dias.includes(diaSemana(data));

export function feitoEm(porData: Map<string, Dia>, id: string, data: string) {
  return Boolean(porData.get(data)?.habitos?.[id]);
}

export interface EstadoHabito {
  habito: Habito;
  hoje: boolean;
  eraPraHoje: boolean;
  sequencia: number;         // dias-alvo seguidos cumpridos, contando pra trás
  ultimos30: { feitos: number; alvos: number; taxa: number };
  /** Faltou no último dia-alvo e hoje é dia-alvo: a falta de hoje é a segunda. */
  emRisco: boolean;
}

export function estadoDoHabito(
  h: Habito,
  porData: Map<string, Dia>,
  data = hoje(),
): EstadoHabito {
  const eraPraHoje = ehDiaDe(h, data);
  const feitoHoje = feitoEm(porData, h.id, data);

  // Sequência: anda pra trás pelos dias-alvo. O dia de hoje só interrompe se
  // já passou — enquanto é hoje e ainda não foi feito, a sequência anterior vale.
  let sequencia = 0;
  let cursor = feitoHoje ? data : somaDias(data, -1);
  for (let i = 0; i < 400; i++) {
    if (ehDiaDe(h, cursor)) {
      if (feitoEm(porData, h.id, cursor)) sequencia++;
      else break;
    }
    cursor = somaDias(cursor, -1);
  }

  let feitos = 0, alvos = 0;
  for (let i = 0; i < 30; i++) {
    const d = somaDias(data, -i);
    if (d < h.criadoEm.slice(0, 10)) break;
    if (!ehDiaDe(h, d)) continue;
    alvos++;
    if (feitoEm(porData, h.id, d)) feitos++;
  }

  // O dia-alvo anterior a hoje: se ele falhou, hoje é o dia que decide.
  let anterior = somaDias(data, -1);
  for (let i = 0; i < 14 && !ehDiaDe(h, anterior); i++) anterior = somaDias(anterior, -1);
  const falhouAnterior = ehDiaDe(h, anterior) && !feitoEm(porData, h.id, anterior)
    && anterior >= h.criadoEm.slice(0, 10);

  return {
    habito: h,
    hoje: feitoHoje,
    eraPraHoje,
    sequencia,
    ultimos30: { feitos, alvos, taxa: alvos ? feitos / alvos : 0 },
    emRisco: eraPraHoje && !feitoHoje && falhouAnterior,
  };
}

/** Percentual do dia concluído — só conta hábito que era pra hoje. */
export function placarDoDia(habitos: Habito[], dia: Dia | undefined, data = hoje()) {
  const alvos = habitos.filter((h) => h.ativo && ehDiaDe(h, data));
  const feitos = alvos.filter((h) => dia?.habitos?.[h.id]).length;
  return { feitos, total: alvos.length, taxa: alvos.length ? feitos / alvos.length : 0 };
}
