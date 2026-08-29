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
import {
  tmb, calcularAlvos, seriePeso, tendencia, vereditoSemanal, adesaoDoDia,
  tendenciaCintura, metaDeLiquido, sonoRecente, type Tendencia,
} from './nutricao';
import { normalizar, buscar, catalogo, calcular } from './alimentos';
import {
  segundaDa, normalizarMedidas, medidasDaSemana, resumoDaSemana,
  sequenciaDaMedida, historicoDaMedida,
} from './semana';
import { reagendar, paraRevisar, estadoDoEstudo, abertosDemais } from './estudo';
import { lerVida, aUnicaCoisa } from './consultor';
import { resumoDoFunil, taxaReal, pipelineNecessario, motivosDePerda } from './funil';
import { relatarFalha, falhaAtual, limparFalha, inscreverEmFalhas } from '../erros';
import { somaDias } from '../formato';
import type {
  Divida, Recorrente, Lancamento, Frente, Rotina, Tarefa, Evento, Dia, Refeicao, AlimentoMeu,
  Meta, Semana as SemanaDoc, Pergunta, Estudo, Oportunidade,
} from '../tipos';

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

describe('nutrição', () => {
  const perfil = {
    alturaCm: 178, idade: 30, sexo: 'm' as const, pesoAlvo: 88,
    nivelAtividade: 'alto' as const, ritmoSemanal: -0.6,
  };

  it('calcula o basal pela Mifflin-St Jeor', () => {
    // 10*96 + 6.25*178 - 5*30 + 5 = 1927.5
    expect(tmb(96, 178, 30, 'm')).toBeCloseTo(1927.5, 1);
    expect(tmb(96, 178, 30, 'f')).toBeCloseTo(1927.5 - 166, 1);
  });

  it('diz o que falta em vez de inventar número', () => {
    const a = calcularAlvos({ pesoAlvo: 88 }, 96);
    expect(a.faltando).toContain('altura');
    expect(a.calorias).toBe(0);
  });

  it('ancora a proteína no peso-alvo, não no atual', () => {
    const a = calcularAlvos(perfil, 96);
    expect(a.proteinaAlvo).toBe(160);          // 88 × 1,8 arredondado a 5
    expect(a.proteinaPiso).toBe(130);          // 88 × 1,5
  });

  it('aplica o déficit pedido sobre o gasto', () => {
    const a = calcularAlvos(perfil, 96);
    const esperado = a.gasto + (-0.6 * 7700) / 7;
    expect(a.calorias).toBeCloseTo(Math.round(esperado), 0);
    expect(a.freado).toBe(false);
  });

  it('freia o déficit que desceria abaixo do basal', () => {
    const a = calcularAlvos({ ...perfil, ritmoSemanal: -2, nivelAtividade: 'leve' }, 96);
    expect(a.freado).toBe(true);
    expect(a.calorias).toBeGreaterThanOrEqual(a.tmb);
  });

  it('estima as semanas até o alvo', () => {
    expect(calcularAlvos(perfil, 96).semanasAteAlvo).toBe(14);   // 8 kg a 0,6/semana
  });

  it('só calcula média móvel com três pesagens na janela', () => {
    const porData = new Map<string, Dia>([
      ['2026-08-28', { id: '2026-08-28', peso: 96 }],
      ['2026-08-27', { id: '2026-08-27', peso: 96.4 }],
    ]);
    const s = seriePeso(porData, 3, '2026-08-28');
    expect(s[s.length - 1].media).toBeUndefined();

    porData.set('2026-08-26', { id: '2026-08-26', peso: 95.6 });
    const s2 = seriePeso(porData, 3, '2026-08-28');
    expect(s2[s2.length - 1].media).toBeCloseTo(96, 2);
  });

  it('mede o ritmo comparando média com média', () => {
    const porData = new Map<string, Dia>();
    // 15 dias descendo 0,1 kg/dia = 0,7 kg por semana.
    for (let i = 0; i < 15; i++) {
      const data = somaDias('2026-08-28', -i);
      porData.set(data, { id: data, peso: 96 + i * 0.1 });
    }
    const t = tendencia(seriePeso(porData, 20, '2026-08-28'));
    expect(t.ritmo).toBeCloseTo(-0.7, 1);
    expect(t.pesagens).toBe(14);
  });

  it('pede mais pesagens antes de dar veredito', () => {
    const v = vereditoSemanal({ ritmo: -0.6, mediaAtual: 96, mediaAnterior: 96.6, pesagens: 2 }, -0.6);
    expect(v.tipo).toBe('sem-dado');
  });

  it('manda não mexer quando está no ritmo', () => {
    const v = vereditoSemanal({ ritmo: -0.55, mediaAtual: 96, mediaAnterior: 96.55, pesagens: 8 }, -0.6);
    expect(v.tipo).toBe('no-ritmo');
  });

  it('manda somar comida quando desce rápido demais', () => {
    const v = vereditoSemanal({ ritmo: -1.4, mediaAtual: 95, mediaAnterior: 96.4, pesagens: 8 }, -0.6);
    expect(v.tipo).toBe('rapido');
  });

  it('checa adesão antes de mandar cortar quando o peso sobe', () => {
    const v = vereditoSemanal({ ritmo: 0.3, mediaAtual: 96.3, mediaAnterior: 96, pesagens: 8 }, -0.6);
    expect(v.tipo).toBe('subindo');
    expect(v.tipo !== 'sem-dado' && v.sugestao).toContain('proteína');
  });

  it('conta adesão do dia sobre as refeições ativas', () => {
    const refeicao = (id: string, ativa = true): Refeicao => ({
      id, nome: id, ancora: '', proteinaG: 30, piso: '', opcoes: [],
      ordem: 1, ativa, criadoEm: agora,
    });
    const rs = [refeicao('a'), refeicao('b'), refeicao('c', false)];
    const dia: Dia = { id: '2026-08-28', refeicoes: { a: true, b: false } };
    const r = adesaoDoDia(rs, dia);
    expect(r.total).toBe(2);        // a pausada não conta
    expect(r.feitas).toBe(1);
    expect(r.taxa).toBe(0.5);
  });
});

describe('consulta de alimentos', () => {
  const meu: AlimentoMeu = {
    id: 'meu1', nome: 'Marmita do Zé', kcal: 150, proteina: 10, carbo: 16, gordura: 5,
    porcaoNome: '1 marmita', porcaoG: 450, criadoEm: agora,
  };

  it('ignora acento e caixa na busca', () => {
    expect(normalizar('Açaí Batido')).toBe('acai batido');
    const achados = buscar('acai', catalogo([]));
    expect(achados.some((a) => a.nome.includes('Açaí'))).toBe(true);
  });

  it('põe o que começa com o termo antes do que só contém', () => {
    const achados = buscar('arroz', catalogo([]));
    expect(achados[0].nome.toLowerCase().startsWith('arroz')).toBe(true);
  });

  it('os meus alimentos vêm antes dos da tabela', () => {
    const lista = catalogo([meu]);
    expect(lista[0].meuId).toBe('meu1');
    expect(lista[0].porcoes[0]).toEqual({ nome: '1 marmita', g: 450 });
  });

  it('faz a regra de três da porção', () => {
    const frango = catalogo([]).find((a) => a.nome === 'Peito de frango grelhado')!;
    const p = calcular(frango, 200);
    expect(p.kcal).toBe(330);
    expect(p.proteina).toBeCloseTo(62, 1);
  });

  it('porção fracionada arredonda sem estourar', () => {
    const ovo = catalogo([]).find((a) => a.nome === 'Ovo cozido')!;
    const p = calcular(ovo, 50);
    expect(p.kcal).toBe(73);
    expect(p.proteina).toBeCloseTo(6.7, 1);
  });

  it('a tabela não tem alimento sem porção nem com caloria negativa', () => {
    for (const a of catalogo([])) {
      expect(a.porcoes.length).toBeGreaterThan(0);
      expect(a.kcal).toBeGreaterThanOrEqual(0);
      expect(a.proteina).toBeGreaterThanOrEqual(0);
    }
  });

  it('os macros batem, grosso modo, com as calorias declaradas', () => {
    // 4 kcal/g de proteína e carbo, 9 de gordura. Tolerância larga: a tabela é
    // referência arredondada, e fibra e álcool não entram nessa conta.
    for (const a of catalogo([])) {
      if (a.grupo === 'Bebidas' || a.kcal < 30) continue;
      const estimado = a.proteina * 4 + a.carbo * 4 + a.gordura * 9;
      expect(Math.abs(estimado - a.kcal) / a.kcal).toBeLessThan(0.35);
    }
  });
});

describe('cintura, sono e líquido', () => {
  const comPeso = (t: Partial<Tendencia> = {}): Tendencia =>
    ({ ritmo: -0.2, mediaAtual: 96, mediaAnterior: 96.2, pesagens: 8, ...t });

  it('a cintura veta o corte quando a balança está lenta mas a fita desce', () => {
    const v = vereditoSemanal(comPeso(), -0.6, { ritmo: -0.3, medidas: 3 });
    expect(v.tipo).toBe('recomposicao');
    expect(v.tipo !== 'sem-dado' && v.sugestao).toContain('Não corte comida');
  });

  it('sem cintura medida, a mesma situação vira sugestão de cortar', () => {
    const v = vereditoSemanal(comPeso(), -0.6);
    expect(v.tipo).toBe('devagar');
  });

  it('uma medida só de cintura não basta para vetar', () => {
    const v = vereditoSemanal(comPeso(), -0.6, { ritmo: -0.3, medidas: 1 });
    expect(v.tipo).toBe('devagar');
  });

  it('queda de cintura pequena demais é erro de fita, não resultado', () => {
    const v = vereditoSemanal(comPeso(), -0.6, { ritmo: -0.05, medidas: 3 });
    expect(v.tipo).toBe('devagar');
  });

  it('peso subindo com cintura descendo também é recomposição', () => {
    const v = vereditoSemanal(comPeso({ ritmo: 0.15 }), -0.6, { ritmo: -0.25, medidas: 3 });
    expect(v.tipo).toBe('recomposicao');
  });

  it('descer rápido com cintura parada acende o alerta de massa magra', () => {
    const v = vereditoSemanal(comPeso({ ritmo: -1.4 }), -0.6, { ritmo: 0, medidas: 3 });
    expect(v.tipo).toBe('rapido');
    expect(v.tipo !== 'sem-dado' && v.sugestao).toContain('não era gordura');
  });

  it('mede o ritmo da cintura em cm por semana', () => {
    const serie = [
      { data: '2026-08-01', cintura: 100 },
      { data: '2026-08-29', cintura: 98 },
    ];
    const t = tendenciaCintura(serie);
    expect(t.ritmo).toBeCloseTo(-0.5, 2);   // 2 cm em 28 dias
    expect(t.atual).toBe(98);
  });

  it('meta de líquido cresce no dia de jogo', () => {
    expect(metaDeLiquido(96)).toBe(3400);            // 35 ml/kg arredondado
    expect(metaDeLiquido(96, 3)).toBe(3400 + 1800);
  });

  it('média de sono ignora noite sem registro', () => {
    const porData = new Map<string, Dia>([
      ['2026-08-28', { id: '2026-08-28', sonoHoras: 6 }],
      ['2026-08-27', { id: '2026-08-27' }],
      ['2026-08-26', { id: '2026-08-26', sonoHoras: 8 }],
    ]);
    const s = sonoRecente(porData, 5, '2026-08-28');
    expect(s.media).toBe(7);
    expect(s.noites).toBe(2);
  });
});

describe('fechar a semana', () => {
  it('a segunda-feira da semana é o id, e domingo pertence à semana que começou', () => {
    expect(segundaDa('2026-08-31')).toBe('2026-08-31');   // segunda
    expect(segundaDa('2026-09-02')).toBe('2026-08-31');   // quarta
    expect(segundaDa('2026-09-06')).toBe('2026-08-31');   // domingo
    expect(segundaDa('2026-09-07')).toBe('2026-09-07');   // segunda seguinte
  });

  it('lê medida antiga em texto e medida nova com alvo', () => {
    const m = normalizarMedidas(['Ligar para um patrocinador', { id: 'x', texto: 'Treinar', alvoSemanal: 3 }]);
    expect(m).toEqual([
      { id: 'md1', texto: 'Ligar para um patrocinador', alvoSemanal: 1 },
      { id: 'x', texto: 'Treinar', alvoSemanal: 3 },
    ]);
  });

  it('descarta medida sem texto', () => {
    expect(normalizarMedidas(['', '   '])).toHaveLength(0);
    expect(normalizarMedidas('não é lista')).toHaveLength(0);
  });

  it('marca quem bateu o alvo da semana', () => {
    const meta: Meta = {
      id: 'm1', objetivo: 'Sair do vermelho', porque: '', eixo: 'dinheiro',
      trimestre: '2026-T3', krs: [], status: 'ativa', criadoEm: agora,
      medidasDirecao: [
        { id: 'a', texto: 'Propostas', alvoSemanal: 5 },
        { id: 'b', texto: 'Lançar dinheiro', alvoSemanal: 7 },
      ],
    };
    const semana: SemanaDoc = {
      id: '2026-08-31', medidas: { a: 5, b: 3 }, fechadaEm: agora,
    };
    const linhas = medidasDaSemana([meta], '2026-T3', semana);
    expect(linhas.map((l) => l.bateu)).toEqual([true, false]);
    expect(linhas[1].feito).toBe(3);
  });

  it('ignora meta de outro trimestre ou arquivada', () => {
    const base: Meta = {
      id: 'm', objetivo: '', porque: '', eixo: 'dinheiro', trimestre: '2026-T2',
      krs: [], medidasDirecao: [{ id: 'a', texto: 'X', alvoSemanal: 1 }],
      status: 'ativa', criadoEm: agora,
    };
    expect(medidasDaSemana([base], '2026-T3')).toHaveLength(0);
    expect(medidasDaSemana([{ ...base, trimestre: '2026-T3', status: 'arquivada' }], '2026-T3')).toHaveLength(0);
  });

  it('o resumo só conta o que caiu dentro da semana', () => {
    const porData = new Map<string, Dia>([
      ['2026-08-31', { id: '2026-08-31', sonoHoras: 6, proteinaG: 150 }],
      ['2026-09-01', { id: '2026-09-01', sonoHoras: 8, proteinaG: 130 }],
    ]);
    const r = resumoDaSemana('2026-08-31', {
      lancamentos: [
        { id: '1', data: '2026-09-02', tipo: 'entrada', valor: 1000, categoria: 'x', criadoEm: agora },
        { id: '2', data: '2026-09-02', tipo: 'saida', valor: 400, categoria: 'y', criadoEm: agora },
        { id: '3', data: '2026-09-08', tipo: 'entrada', valor: 9999, categoria: 'fora', criadoEm: agora },
      ] as Lancamento[],
      habitos: [],
      porData,
      treinos: [{ data: '2026-09-01' }, { data: '2026-09-20' }],
      tarefas: [{ ...({} as Tarefa), id: 't', titulo: 'atrasada', prazo: '2026-09-03', feita: false, peso: 'normal', criadoEm: agora }],
      refeicoes: [],
    });
    expect(r.entrou).toBe(1000);
    expect(r.sobra).toBe(600);
    expect(r.treinos).toBe(1);
    expect(r.atrasados).toBe(1);
    expect(r.sonoMedia).toBe(7);
    expect(r.proteinaMedia).toBe(140);
    expect(r.diasRegistrados).toBe(2);
  });

  it('conta semanas seguidas em que a medida bateu', () => {
    const hist = [{ feito: 5 }, { feito: 2 }, { feito: 5 }, { feito: 6 }];
    expect(sequenciaDaMedida(hist, 5)).toBe(2);
    expect(sequenciaDaMedida([{ feito: 1 }], 5)).toBe(0);
  });

  it('o histórico devolve uma casa por semana, mesmo sem registro', () => {
    const h = historicoDaMedida('a', [{ id: '2026-08-31', medidas: { a: 4 }, fechadaEm: agora }], '2026-08-31', 3);
    expect(h).toHaveLength(3);
    expect(h[2]).toEqual({ segunda: '2026-08-31', feito: 4 });
    expect(h[0].feito).toBe(0);
  });
});

describe('estudo e revisão espaçada', () => {
  const p = (over: Partial<Pergunta> = {}): Pergunta => ({
    id: 'q', estudoId: 'e', pergunta: '?', resposta: '.', proximaEm: '2026-08-29',
    intervalo: 6, acertos: 2, erros: 0, criadoEm: agora, ...over,
  });

  it('errar joga a pergunta para amanhã', () => {
    const r = reagendar(p({ intervalo: 30 }), 'errei', '2026-08-29');
    expect(r.intervalo).toBe(1);
    expect(r.proximaEm).toBe('2026-08-30');
    expect(r.erros).toBe(1);
  });

  it('acertar estica o intervalo', () => {
    const r = reagendar(p({ intervalo: 6 }), 'acertei', '2026-08-29');
    expect(r.intervalo).toBe(14);
    expect(r.acertos).toBe(3);
  });

  it('quase encolhe sem zerar', () => {
    const r = reagendar(p({ intervalo: 10 }), 'quase', '2026-08-29');
    expect(r.intervalo).toBe(6);
    expect(r.acertos).toBe(2);
    expect(r.erros).toBe(0);
  });

  it('o intervalo tem teto, para nada sumir por um ano', () => {
    expect(reagendar(p({ intervalo: 200 }), 'acertei').intervalo).toBe(120);
  });

  it('só entram na fila as vencidas, mais antigas primeiro', () => {
    const fila = paraRevisar([
      p({ id: 'a', proximaEm: '2026-08-30' }),
      p({ id: 'b', proximaEm: '2026-08-20' }),
      p({ id: 'c', proximaEm: '2026-08-29' }),
    ], '2026-08-29');
    expect(fila.map((x) => x.id)).toEqual(['b', 'c']);
  });

  it('avisa quando há material aberto demais', () => {
    const e = (id: string, status: Estudo['status']): Estudo => ({
      id, titulo: id, tipo: 'livro', trilha: 't', porque: '', eixo: 'oficio',
      status, progresso: 0, ordem: 1, criadoEm: agora,
    });
    const tres = estadoDoEstudo([e('1', 'lendo'), e('2', 'lendo'), e('3', 'lendo')], []);
    expect(abertosDemais(tres)).toBe(true);
    expect(abertosDemais(estadoDoEstudo([e('1', 'lendo')], []))).toBe(false);
  });
});

describe('consultor', () => {
  const base = {
    sobraDoMes: 500, previsivel: 3200, pisoFixo: 3110, jurosMensais: 0,
    aporteDisponivel: 0, lancamentosNoMes: 12, acoesAbertas: 0,
    proteinaMedia: 160, proteinaPiso: 130, adesaoRefeicoes: 0.85, diasComRefeicao: 10,
    treinosNaSemana: 3, sonoMedia: 7.5, habitos30d: 0.8, habitosEmRisco: [],
    afazeresAtrasados: 0, medidasBatidas: 3, medidasTotal: 3,
    revisoesVencidas: 0, materiaisAbertos: 1, materiaisNaFila: 5,
  };

  it('com tudo em ordem, não sobra alerta', () => {
    const s = lerVida(base);
    expect(s.filter((x) => x.gravidade === 'alerta')).toHaveLength(0);
    expect(aUnicaCoisa(s)).toBeNull();
  });

  it('caixa no vermelho vira alerta e assume a prioridade', () => {
    const s = lerVida({ ...base, sobraDoMes: -1160 });
    expect(aUnicaCoisa(s)?.id).toBe('caixa-vermelho');
  });

  it('dívida que não cobre nem o juro ganha de sono curto', () => {
    const s = lerVida({ ...base, jurosMensais: 2013, aporteDisponivel: 580, sonoMedia: 5 });
    expect(aUnicaCoisa(s)?.id).toBe('divida');
    expect(s.find((x) => x.id === 'divida')?.acao).toContain('renegociar');
  });

  it('sono curto sozinho é o que sobe', () => {
    const s = lerVida({ ...base, sonoMedia: 5.5 });
    expect(aUnicaCoisa(s)?.id).toBe('sono');
    expect(s.find((x) => x.id === 'sono')?.gravidade).toBe('alerta');
  });

  it('os limiares são frouxos: 70% de adesão e dois treinos passam', () => {
    const s = lerVida({ ...base, adesaoRefeicoes: 0.72, treinosNaSemana: 2, habitos30d: 0.62 });
    expect(s.find((x) => x.id === 'comida')?.gravidade).toBe('ok');
    expect(s.find((x) => x.id === 'treino-ok')?.gravidade).toBe('ok');
    expect(s.find((x) => x.id === 'habitos')?.gravidade).toBe('ok');
  });

  it('sem lançamento no mês o consultor diz que está cego, não que está bom', () => {
    const s = lerVida({ ...base, lancamentosNoMes: 0 });
    expect(s.find((x) => x.id === 'caixa-sem-dado')?.gravidade).toBe('sem-dado');
  });

  it('hábito na segunda falta é alerta com ação de piso', () => {
    const s = lerVida({ ...base, habitosEmRisco: ['Treino de força'] });
    expect(s.find((x) => x.id === 'habitos-risco')?.gravidade).toBe('alerta');
    expect(s.find((x) => x.id === 'habitos-risco')?.acao).toContain('piso');
  });
});

describe('erros de gravação', () => {
  it('permissão negada aponta para as regras do Firestore', () => {
    relatarFalha({ code: 'permission-denied', message: 'x' }, 'salvar em lancamentos');
    const f = falhaAtual()!;
    expect(f.codigo).toBe('permission-denied');
    expect(f.saida).toContain('regras do Firestore');
    limparFalha();
    expect(falhaAtual()).toBeNull();
  });

  it('campo indefinido é assumido como defeito do app, não do usuário', () => {
    relatarFalha(
      { message: 'Function setDoc() called with invalid data. Unsupported field value: undefined' },
      'salvar em lancamentos',
    );
    expect(falhaAtual()!.saida).toContain('defeito do app');
    limparFalha();
  });

  it('offline manda não registrar de novo', () => {
    relatarFalha({ code: 'unavailable', message: 'client is offline' }, 'salvar');
    expect(falhaAtual()!.saida).toContain('Não registre de novo');
    limparFalha();
  });

  it('quem se inscreve recebe a falha atual na hora', () => {
    relatarFalha({ code: 'unauthenticated', message: '' }, 'salvar');
    let recebida: string | null = null;
    const parar = inscreverEmFalhas((f) => { recebida = f?.codigo ?? null; });
    expect(recebida).toBe('unauthenticated');
    parar();
    limparFalha();
  });
});

describe('funil de receita', () => {
  const o = (over: Partial<Oportunidade> = {}): Oportunidade => ({
    id: 'o', empresa: 'Marca', etapa: 'proposta', valor: 30000, recorrente: false,
    proximoPasso: 'Ligar', proximoEm: '2026-09-05',
    criadoEm: agora, atualizadoEm: agora, ...over,
  });

  it('pondera o funil pela chance de cada etapa', () => {
    const r = resumoDoFunil([
      o({ id: 'a', etapa: 'lista', valor: 10000 }),
      o({ id: 'b', etapa: 'proposta', valor: 30000 }),
      o({ id: 'c', etapa: 'negociacao', valor: 20000 }),
    ], '2026-08-29');
    expect(r.total).toBe(60000);
    expect(r.ponderado).toBeCloseTo(10000 * 0.05 + 30000 * 0.5 + 20000 * 0.75, 2);
  });

  it('parada é a sem próximo passo ou com data vencida', () => {
    const r = resumoDoFunil([
      o({ id: 'ok', proximoEm: '2026-09-10' }),
      o({ id: 'sem-passo', proximoPasso: undefined, proximoEm: undefined }),
      o({ id: 'vencida', proximoEm: '2026-08-20' }),
      o({ id: 'fechada', etapa: 'fechado', proximoPasso: undefined, proximoEm: undefined }),
    ], '2026-08-29');
    expect(r.paradas.map((x) => x.id).sort()).toEqual(['sem-passo', 'vencida']);
  });

  it('fechado e perdido saem do que está em andamento', () => {
    const r = resumoDoFunil([
      o({ id: 'a', etapa: 'fechado', valor: 12000, recorrente: true }),
      o({ id: 'b', etapa: 'perdido', valor: 9000 }),
      o({ id: 'c', etapa: 'contato', valor: 5000 }),
    ], '2026-08-29');
    expect(r.quantidade).toBe(1);
    expect(r.fechado).toBe(12000);
    expect(r.recorrenteFechado).toBe(12000);
  });

  it('a taxa real só é confiável depois de dez decididas', () => {
    const poucas = taxaReal([o({ etapa: 'fechado' }), o({ etapa: 'perdido' })]);
    expect(poucas.confiavel).toBe(false);
    expect(poucas.taxa).toBe(0.5);

    const muitas = Array.from({ length: 12 }, (_, i) =>
      o({ id: 'x' + i, etapa: i < 3 ? 'fechado' : 'perdido' }));
    const t = taxaReal(muitas);
    expect(t.confiavel).toBe(true);
    expect(t.taxa).toBeCloseTo(0.25, 2);
  });

  it('usa a referência de 20% enquanto a taxa real não é confiável', () => {
    const p = pipelineNecessario(60000, [o({ etapa: 'contato', valor: 10000 })]);
    expect(p.usandoReal).toBe(false);
    expect(p.taxa).toBe(0.2);
    expect(p.necessario).toBe(300000);
  });

  it('agrupa os motivos de perda, e conta o que não foi registrado', () => {
    const m = motivosDePerda([
      o({ id: '1', etapa: 'perdido', motivoPerda: 'Sem verba' }),
      o({ id: '2', etapa: 'perdido', motivoPerda: 'Sem verba' }),
      o({ id: '3', etapa: 'perdido' }),
      o({ id: '4', etapa: 'fechado' }),
    ]);
    expect(m[0]).toEqual(['Sem verba', 2]);
    expect(m.find(([k]) => k === 'sem motivo registrado')?.[1]).toBe(1);
  });
});
