const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const moeda = (n: number) => BRL.format(n || 0);
export const moedaCurta = (n: number) => BRL0.format(n || 0);
export const numero = (n: number, casas = 0) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(n || 0);
export const porcento = (n: number, casas = 0) => `${numero(n * 100, casas)}%`;

/** YYYY-MM-DD no fuso local — nunca use toISOString(), ele volta em UTC. */
export function ymd(d: Date = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const hoje = () => ymd();

export function deYmd(s: string) {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function somaDias(s: string, n: number) {
  const d = deYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const diaSemanaCurto = (s: string) => DIAS[deYmd(s).getDay()];
export const diaSemana = (s: string) => deYmd(s).getDay();

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function dataCurta(s: string) {
  const d = deYmd(s);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

export function dataPorExtenso(s: string) {
  const d = deYmd(s);
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES_LONGOS[d.getMonth()].toLowerCase()}`;
}

/** 2026-08 */
export const mesDe = (s: string) => s.slice(0, 7);
export const mesAtual = () => hoje().slice(0, 7);
export function rotuloMes(m: string) {
  const [a, mm] = m.split('-').map(Number);
  return `${MESES_LONGOS[mm - 1]} de ${a}`;
}
export function mesRelativo(m: string, delta: number) {
  const [a, mm] = m.split('-').map(Number);
  const d = new Date(a, mm - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 2026-T3 */
export function trimestreAtual(d = new Date()) {
  return `${d.getFullYear()}-T${Math.floor(d.getMonth() / 3) + 1}`;
}
export function diasRestantesDoTrimestre(d = new Date()) {
  const fimMes = Math.floor(d.getMonth() / 3) * 3 + 3;
  const fim = new Date(d.getFullYear(), fimMes, 0);
  return Math.max(0, Math.ceil((fim.getTime() - d.getTime()) / 86400000));
}

/** 436% ao ano a partir de 15% ao mês — o número que assusta na medida certa. */
export const anualizar = (taxaMensal: number) => Math.pow(1 + taxaMensal, 12) - 1;
