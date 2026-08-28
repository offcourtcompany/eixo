/**
 * Testes da matemática que dá conselho.
 *
 * O `check-bundle` pega bundle quebrado; ele não pega conta errada. E as contas
 * aqui não são decorativas: o simulador decide se você ataca a dívida por bola
 * de neve ou por avalanche num saldo a 15% ao mês, e a geração dos fixos escreve
 * documento no banco. Errado e silencioso é o pior tipo de erro que um app
 * assim pode ter.
 *
 * Rodar: npm test
 */
import { describe, it, expect } from 'vitest';
import { simular, comparar, jurosMensaisDe, saldoTotal } from './dividas';
import { gerar, idGerado, dataNoMes, aConfirmarNoMes } from './recorrentes';
import { itensDoDia, separarAfazeres, gradeDoMes, diasDeAtraso, horasSemanaisPorFrente } from './agenda';
import { resultadoPorFrente, receitaPorModelo } from './frentes';
import { resumoDoMes } from './financas';
import type { Divida, Recorrente, Lancamento, Frente, Rotina, Tarefa, Evento } from '../tipos';

const agora = '2026-08-01T00:00:00.000Z';

const divida = (p: Partial<Divida>): Divida => ({
  id: 'd', nome: 'Dívida', saldo: 1000, taxaMensal: 0.02, parcelaMinima: 100,
  ativa: true, criadoEm: agora, ...p,
});

describe('dívidas', () => {
  it('soma saldo e juros do mês', () => {
    const ds = [divida({ id: 'a', saldo: 13000, taxaMensal: 0.15 }), divida({ id: 'b', saldo: 1800, taxaMensal: 0.035 })];
    expect(saldoTotal(ds)).toBe(14800);
    expect(jurosMensaisDe(ds)).toBeCloseTo(13000 * 0.15 + 1800 * 0.035, 6);
  });

  it('avisa que não há quitação quando o aporte não cobre nem o juro', () => {
    // 13k a 15% a.m. gera 1.950/mês de juro. Pagando 580 o saldo cresce.
    const s = simular([divida({ saldo: 13000, taxaMensal: 0.15, parcelaMinima: 580 })], 580, 'avalanche');
    expect(s.viavel).toBe(false);
    expect(s.faltaPorMes).toBeGreaterThan(0);
  });

  it('quita quando o aporte cobre o juro com folga', () => {
    const s = simular([divida({ saldo: 1000, taxaMensal: 0.02, parcelaMinima: 100 })], 300, 'avalanche');
    expect(s.viavel).toBe(true);
    expect(s.meses).toBeGreaterThan(0);
    expect(s.meses).toBeLessThan(6);
  });

  it('avalanche nunca paga mais juros que bola de neve', () => {
    const ds = [
      divida({ id: 'cara', saldo: 5000, taxaMensal: 0.15, parcelaMinima: 200 }),
      divida({ id: 'pequena', saldo: 800, taxaMensal: 0.02, parcelaMinima: 80 }),
    ];
    const { neve, aval } = comparar(ds, 1500);
    expect(aval.viavel && neve.viavel).toBe(true);
    expect(aval.jurosTotais).toBeLessThanOrEqual(neve.jurosTotais + 0.01);
  });
});

describe('fixos do mês', () => {
  const fixo = (p: Partial<Recorrente>): Recorrente => ({
    id: 'r1', nome: 'Seguro', tipo: 'saida', valor: 520, categoria: 'Seguro',
    diaDoMes: 3, fixo: true, ativo: true, criadoEm: '2026-01-10T00:00:00.000Z', ...p,
  });

  it('gera id determinístico, então rodar duas vezes não duplica', () => {
    const a = gerar([fixo({})], '2026-08');
    const b = gerar([fixo({})], '2026-08');
    expect(a.lancamentos.map((l) => l.id)).toEqual(b.lancamentos.map((l) => l.id));
    // Cadastrado em janeiro, mas a geração volta no máximo um mês: julho e agosto.
    expect(a.lancamentos.map((l) => l.id))
      .toEqual([idGerado('r1', '2026-07'), idGerado('r1', '2026-08')]);
  });

  it('não ressuscita mês já gerado', () => {
    const { lancamentos } = gerar([fixo({ geradoAte: '2026-08' })], '2026-08');
    expect(lancamentos).toHaveLength(0);
  });

  it('não inventa passado além de um mês', () => {
    const { lancamentos } = gerar([fixo({ criadoEm: '2020-01-01T00:00:00.000Z' })], '2026-08');
    expect(lancamentos).toHaveLength(2);            // julho e agosto, nada antes
    expect(lancamentos.map((l) => l.data)).toEqual(['2026-07-03', '2026-08-03']);
  });

  it('ignora fixo pausado', () => {
    expect(gerar([fixo({ ativo: false })], '2026-08').lancamentos).toHaveLength(0);
  });

  it('dia 31 cai no último dia real do mês curto', () => {
    expect(dataNoMes('2026-02', 31)).toBe('2026-02-28');
    expect(dataNoMes('2026-04', 31)).toBe('2026-04-30');
    expect(dataNoMes('2026-08', 5)).toBe('2026-08-05');
  });

  it('separa os que ainda esperam confirmação no mês', () => {
    const ls = [
      { id: 'a', data: '2026-08-03', tipo: 'saida', valor: 520, categoria: 'Seguro', criadoEm: agora, aConfirmar: true },
      { id: 'b', data: '2026-08-04', tipo: 'saida', valor: 10, categoria: 'Comida', criadoEm: agora },
      { id: 'c', data: '2026-07-03', tipo: 'saida', valor: 520, categoria: 'Seguro', criadoEm: agora, aConfirmar: true },
    ] as Lancamento[];
    expect(aConfirmarNoMes(ls, '2026-08').map((l) => l.id)).toEqual(['a']);
  });
});

describe('agenda', () => {
  const rotina: Rotina = {
    id: 'ro1', titulo: 'Expediente', dias: [1, 2, 3, 4, 5], hora: '18:00',
    duracaoMin: 240, frenteId: 'f1', ativo: true, criadoEm: agora,
  };
  const evento: Evento = {
    id: 'ev1', titulo: 'Reunião', data: '2026-08-31', hora: '10:00', frenteId: 'f1', criadoEm: agora,
  };
  const tarefa: Tarefa = {
    id: 'ta1', titulo: 'Mídia kit', prazo: '2026-08-31', peso: 'chave', feita: false,
    frenteId: 'f1', criadoEm: agora,
  };
  const fontes = { eventos: [evento], rotinas: [rotina], tarefas: [tarefa] };

  it('junta evento, rotina e tarefa do dia ordenados por hora', () => {
    const itens = itensDoDia('2026-08-31', fontes);      // segunda-feira
    expect(itens.map((i) => i.origem)).toEqual(['evento', 'rotina', 'tarefa']);
    expect(itens[0].hora).toBe('10:00');
  });

  it('rotina só aparece nos dias da regra', () => {
    const domingo = itensDoDia('2026-08-30', fontes);
    expect(domingo.some((i) => i.origem === 'rotina')).toBe(false);
  });

  it('filtra por frente sem perder o resto', () => {
    expect(itensDoDia('2026-08-31', fontes, 'f1')).toHaveLength(3);
    expect(itensDoDia('2026-08-31', fontes, 'outra')).toHaveLength(0);
  });

  it('a grade do mês começa no domingo e fecha a semana', () => {
    const semanas = gradeDoMes('2026-08');
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    expect(semanas[0]).toContain('2026-08-01');
    expect(semanas[semanas.length - 1]).toContain('2026-08-31');
  });

  it('separa atrasado, hoje e sem prazo', () => {
    const ts: Tarefa[] = [
      { ...tarefa, id: 'atrasada', prazo: '2026-08-20' },
      { ...tarefa, id: 'hoje', prazo: '2026-08-28' },
      { ...tarefa, id: 'futura', prazo: '2026-09-10' },
      { ...tarefa, id: 'solta', prazo: undefined },
      { ...tarefa, id: 'pronta', feita: true },
    ];
    const a = separarAfazeres(ts, undefined, '2026-08-28');
    expect(a.atrasadas.map((t) => t.id)).toEqual(['atrasada']);
    expect(a.hoje.map((t) => t.id)).toEqual(['hoje']);
    expect(a.proximas.map((t) => t.id)).toEqual(['futura']);
    expect(a.semPrazo.map((t) => t.id)).toEqual(['solta']);
    expect(a.feitas.map((t) => t.id)).toEqual(['pronta']);
  });

  it('conta os dias de atraso', () => {
    expect(diasDeAtraso('2026-08-24', '2026-08-28')).toBe(4);
    expect(diasDeAtraso('2026-08-27', '2026-08-28')).toBe(1);
  });

  it('soma minutos semanais por frente', () => {
    expect(horasSemanaisPorFrente([rotina]).get('f1')).toBe(240 * 5);
  });
});

describe('rentabilidade por frente', () => {
  const frentes: Frente[] = [
    { id: 'f1', nome: 'Epic', cor: '#EE6018', tipo: 'fixo', modelo: 'contratado', ativo: true, ordem: 1, criadoEm: agora },
    { id: 'f2', nome: 'Torneio', cor: '#A0CA92', tipo: 'projeto', modelo: 'proprio', ativo: true, ordem: 2, criadoEm: agora },
  ];
  const lancamentos = [
    { id: '1', data: '2026-08-05', tipo: 'entrada', valor: 1750, categoria: 'Gestão', frenteId: 'f1', criadoEm: agora },
    { id: '2', data: '2026-08-12', tipo: 'entrada', valor: 3000, categoria: 'Torneio', frenteId: 'f2', criadoEm: agora },
    { id: '3', data: '2026-08-13', tipo: 'saida', valor: 2600, categoria: 'Estrutura', frenteId: 'f2', criadoEm: agora },
    { id: '4', data: '2026-08-20', tipo: 'saida', valor: 300, categoria: 'Comida', criadoEm: agora },
    { id: '5', data: '2026-07-05', tipo: 'entrada', valor: 9999, categoria: 'Fora da janela', frenteId: 'f1', criadoEm: agora },
  ] as Lancamento[];
  const rotinas: Rotina[] = [{
    id: 'ro', titulo: 'Arena', dias: [1, 2, 3, 4, 5], duracaoMin: 240,
    frenteId: 'f1', ativo: true, criadoEm: agora,
  }];

  it('calcula margem por frente dentro da janela', () => {
    const r = resultadoPorFrente(lancamentos, frentes, rotinas, ['2026-08']);
    const epic = r.find((x) => x.frente?.id === 'f1')!;
    const torneio = r.find((x) => x.frente?.id === 'f2')!;
    const solto = r.find((x) => x.frente === null)!;
    expect(epic.margem).toBe(1750);            // o de julho ficou de fora
    expect(torneio.margem).toBe(400);
    expect(solto.saidas).toBe(300);
  });

  it('divide a margem pelas horas do período', () => {
    const r = resultadoPorFrente(lancamentos, frentes, rotinas, ['2026-08']);
    const epic = r.find((x) => x.frente?.id === 'f1')!;
    const horas = (240 * 5 / 60) * 4.345;
    expect(epic.porHora).toBeCloseTo(1750 / horas, 4);
  });

  it('frente sem rotina não inventa R$/h', () => {
    const r = resultadoPorFrente(lancamentos, frentes, rotinas, ['2026-08']);
    expect(r.find((x) => x.frente?.id === 'f2')!.porHora).toBeNull();
  });

  it('reparte a receita entre contratado e próprio', () => {
    const m = receitaPorModelo(lancamentos, frentes, '2026-08');
    expect(m.contratado).toBe(1750);
    expect(m.proprio).toBe(3000);
    expect(m.semEtiqueta).toBe(0);
    expect(m.total).toBe(4750);
  });
});

describe('fechamento do mês', () => {
  it('separa receita previsível de avulsa', () => {
    const ls = [
      { id: '1', data: '2026-08-05', tipo: 'entrada', valor: 1750, categoria: 'Gestão', origem: 'fixa', criadoEm: agora },
      { id: '2', data: '2026-08-12', tipo: 'entrada', valor: 600, categoria: 'Liga', origem: 'recorrente', criadoEm: agora },
      { id: '3', data: '2026-08-20', tipo: 'entrada', valor: 2400, categoria: 'Evento', origem: 'avulsa', criadoEm: agora },
      { id: '4', data: '2026-08-03', tipo: 'saida', valor: 520, categoria: 'Seguro', fixo: true, criadoEm: agora },
    ] as Lancamento[];
    const r = resumoDoMes(ls, '2026-08');
    expect(r.previsivel).toBe(2350);
    expect(r.porOrigem.avulsa).toBe(2400);
    expect(r.saidasFixas).toBe(520);
    expect(r.sobra).toBe(4750 - 520);
  });
});
