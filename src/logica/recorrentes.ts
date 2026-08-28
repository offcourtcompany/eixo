/**
 * Geração dos lançamentos fixos.
 *
 * O que sai daqui é sempre a mesma coisa: você cadastrou o seguro uma vez, e
 * todo mês ele aparece já lançado, marcado como "a confirmar". Some oito
 * digitações por mês — e, mais importante, o custo fixo para de ficar
 * incompleto, que é o que fazia o piso do mês mentir.
 *
 * Três garantias no desenho:
 *
 * 1. **Idempotente.** O id do lançamento é derivado do fixo e do mês
 *    (`rec_<id>_<AAAA-MM>`), então rodar duas vezes escreve por cima do mesmo
 *    documento em vez de duplicar.
 * 2. **Não ressuscita o que você apagou.** Cada fixo guarda `geradoAte`; a
 *    geração só olha meses depois desse marcador. Apagou o lançamento de
 *    setembro, ele não volta no próximo carregamento.
 * 3. **Não inventa passado.** Volta no máximo um mês, para o caso de você abrir
 *    o app no dia 2 e o mês anterior ainda estar em aberto. Mês que você não
 *    acompanhou continua vazio — é a verdade.
 */
import type { Lancamento, Recorrente } from '../tipos';
import { mesAtual, mesDe, mesRelativo } from '../formato';

/** Meses curtos: dia 31 vira o último dia real do mês. */
export function dataNoMes(mes: string, diaDoMes: number) {
  const [ano, m] = mes.split('-').map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  const dia = Math.min(Math.max(1, diaDoMes || 1), ultimo);
  return `${mes}-${String(dia).padStart(2, '0')}`;
}

export const idGerado = (recorrenteId: string, mes: string) => `rec_${recorrenteId}_${mes}`;

export interface Geracao {
  lancamentos: (Partial<Lancamento> & { id: string })[];
  /** Marcador a gravar em cada fixo depois de gerar. */
  marcadores: { id: string; geradoAte: string }[];
}

export function gerar(recorrentes: Recorrente[], hojeMes = mesAtual()): Geracao {
  const lancamentos: Geracao['lancamentos'] = [];
  const marcadores: Geracao['marcadores'] = [];
  const limite = mesRelativo(hojeMes, -1);

  for (const r of recorrentes) {
    if (!r.ativo) continue;

    // De onde começar: nunca antes do cadastro, nunca antes do mês passado, e
    // sempre depois do que já foi gerado.
    const nascimento = mesDe(r.criadoEm.slice(0, 10));
    let inicio = [nascimento, limite].sort().pop()!;
    if (r.geradoAte && r.geradoAte >= inicio) inicio = mesRelativo(r.geradoAte, 1);
    if (inicio > hojeMes) continue;

    for (let mes = inicio; mes <= hojeMes; mes = mesRelativo(mes, 1)) {
      lancamentos.push({
        id: idGerado(r.id, mes),
        data: dataNoMes(mes, r.diaDoMes),
        tipo: r.tipo,
        valor: r.valor,
        categoria: r.categoria,
        descricao: r.nome,
        ...(r.tipo === 'entrada'
          ? { origem: r.origem || 'recorrente', fixo: false }
          : { fixo: r.fixo, origem: 'avulsa' as const }),
        deRecorrente: r.id,
        aConfirmar: true,
        criadoEm: new Date().toISOString(),
      });
    }
    marcadores.push({ id: r.id, geradoAte: hojeMes });
  }

  return { lancamentos, marcadores };
}

export const aConfirmarNoMes = (lancamentos: Lancamento[], mes: string) =>
  lancamentos.filter((l) => l.aConfirmar && mesDe(l.data) === mes);
