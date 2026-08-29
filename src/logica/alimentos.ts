/**
 * Busca de alimentos e conta de porção.
 *
 * O desenho aqui é de **consulta**, não de diário: a pergunta que isto responde
 * é "quanto tem nisso?", e somar ao dia é opcional. Diário completo de comida é
 * a causa número um de abandono de dieta — o módulo continua cobrando proteína
 * e adesão, e a caloria fica como conhecimento disponível na hora de decidir.
 */
import type { Alimento } from '../dados/alimentos';
import { ALIMENTOS } from '../dados/alimentos';
import type { AlimentoMeu } from '../tipos';

/** Sem acento e em minúscula: quem digita "acai" no celular quer achar açaí. */
export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export interface Achado extends Alimento {
  /** Cadastrado por você — aparece primeiro e pode ser editado. */
  meuId?: string;
}

/** Os seus alimentos vêm antes: quando você cadastra, é porque a tabela errou. */
export function catalogo(meus: AlimentoMeu[]): Achado[] {
  const convertidos: Achado[] = meus.map((m) => ({
    meuId: m.id,
    nome: m.nome,
    grupo: 'Meus alimentos',
    kcal: m.kcal,
    proteina: m.proteina,
    carbo: m.carbo,
    gordura: m.gordura,
    liquido: m.liquido,
    porcoes: m.porcaoNome && m.porcaoG
      ? [{ nome: m.porcaoNome, g: m.porcaoG }, { nome: '100 g', g: 100 }]
      : [{ nome: '100 g', g: 100 }],
  }));
  return [...convertidos, ...ALIMENTOS];
}

/**
 * Busca por trecho, com dois níveis de relevância: o que começa com o termo vem
 * antes do que apenas o contém. Digitar "arroz" tem que trazer arroz antes de
 * "salada de arroz".
 */
export function buscar(termo: string, lista: Achado[], limite = 30): Achado[] {
  const t = normalizar(termo);
  if (!t) return lista.slice(0, limite);

  const comeca: Achado[] = [];
  const contem: Achado[] = [];
  for (const a of lista) {
    const n = normalizar(a.nome);
    if (n.startsWith(t)) comeca.push(a);
    else if (n.includes(t) || normalizar(a.grupo).includes(t)) contem.push(a);
  }
  return [...comeca, ...contem].slice(0, limite);
}

export interface Porcao {
  gramas: number;
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/** Regra de três sobre a base de 100 g. Arredonda para o que é lido, não medido. */
export function calcular(a: Alimento, gramas: number): Porcao {
  const f = gramas / 100;
  const uma = (v: number) => Math.round(v * f * 10) / 10;
  return {
    gramas,
    kcal: Math.round(a.kcal * f),
    proteina: uma(a.proteina),
    carbo: uma(a.carbo),
    gordura: uma(a.gordura),
  };
}

/** Agrupa para a lista mostrar cabeçalho de grupo em vez de um muro de nomes. */
export function porGrupo(achados: Achado[]) {
  const mapa = new Map<string, Achado[]>();
  for (const a of achados) {
    const lista = mapa.get(a.grupo) || [];
    lista.push(a);
    mapa.set(a.grupo, lista);
  }
  return [...mapa.entries()];
}
