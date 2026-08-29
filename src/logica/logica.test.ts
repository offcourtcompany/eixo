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
import {
  projetarCaixa, movimentosPrevistos, gastoVariavel, dividaDiluida, porSemana, ritmoMensal,
} from './caixa';
import { analisar, seguirOuCancelar, precoDeEquilibrio, resumoDaTemporada } from './evento';
import {
  ALIQUOTA_PADRAO, aliquotaDe, bruto, liquido, vencimentoDoDas, reservaDeImposto,
} from './imposto';
import {
  cargaDoTreino, cargaDaQuadra, quadraEstimada, serieDeCarga, zonaDe, lerCarga, recadoDaCarga,
} from './carga';
import {
  calcularCapacidade, zonaDaSemana, diaMaisCheio, horasDeCorpo,
} from './capacidade';
import { gerarChecklist, prazoDoItem, estadoDoChecklist, riscoDoEvento } from './checklist';
import { MODELO_TORNEIO } from '../dados/checklistTorneio';
import { ordenarIdeias, estadoDasIdeias, ideiasDoEstudo, recadoDasIdeias } from './ideias';
import { IDEIAS_SUGERIDAS } from '../dados/ideias';
import { BLOCOS, PERGUNTAS_CONTADOR } from '../dados/perguntasContador';
import { relatarFalha, falhaAtual, limparFalha, inscreverEmFalhas } from '../erros';
import { somaDias } from '../formato';
import type {
  Divida, Recorrente, Lancamento, Frente, Rotina, Tarefa, Evento, Dia, Refeicao, AlimentoMeu,
  Meta, Semana as SemanaDoc, Pergunta, Estudo, Oportunidade, PlanoEvento, Perfil,
  Treino as TreinoDoc2, Estudo as EstudoDoc2, Ideia as IdeiaDoc2,
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

describe('projeção de caixa', () => {
  const D = '2026-08-01';

  const rec = (p: Partial<Recorrente>): Recorrente => ({
    id: 'r', nome: 'Seguro', tipo: 'saida', valor: 500, categoria: 'Seguro',
    diaDoMes: 10, fixo: true, ativo: true, criadoEm: '2026-01-01T00:00:00.000Z', ...p,
  });
  const lanc = (p: Partial<Lancamento>): Lancamento => ({
    id: 'l', data: '2026-07-05', tipo: 'saida', valor: 100, categoria: 'Comida',
    criadoEm: agora, ...p,
  });
  const opo = (p: Partial<Oportunidade>): Oportunidade => ({
    id: 'o', empresa: 'Marca', etapa: 'proposta', valor: 10000, recorrente: false,
    criadoEm: agora, atualizadoEm: agora, ...p,
  });
  // Sem imposto por padrão, pelo mesmo motivo do bloco de eventos: aqui se
  // testa a mecânica da projeção. A guia tem bloco próprio.
  const base = {
    lancamentos: [] as Lancamento[], recorrentes: [] as Recorrente[],
    dividas: [] as Divida[], oportunidades: [] as Oportunidade[], data: D,
    perfil: { aliquotaImposto: 0 } as Perfil,
  };

  it('a média do variável ignora o que já é fixo ou nasceu de um fixo', () => {
    const g = gastoVariavel([
      lanc({ id: 'a', data: '2026-07-05', valor: 900 }),
      lanc({ id: 'b', data: '2026-07-10', valor: 600, fixo: true }),
      lanc({ id: 'c', data: '2026-07-12', valor: 500, deRecorrente: 'r' }),
      lanc({ id: 'd', data: '2026-07-20', tipo: 'entrada', valor: 5000 }),
    ], D);
    expect(g.mesesDeHistorico).toBe(1);
    expect(g.mensal).toBe(900);
    expect(g.confiavel).toBe(false);
  });

  it('não conta duas vezes o fixo que já virou lançamento no mês', () => {
    const r = rec({ id: 'seg', valor: 520, diaDoMes: 20 });
    const so = movimentosPrevistos({ ...base, recorrentes: [r] })
      .filter((m) => m.data === '2026-08-20');
    expect(so).toHaveLength(1);

    const com = movimentosPrevistos({
      ...base,
      recorrentes: [r],
      lancamentos: [lanc({ id: 'g', data: '2026-08-20', valor: 520, deRecorrente: 'seg' })],
    }).filter((m) => m.data === '2026-08-20');
    expect(com).toHaveLength(1);
    expect(com[0].fonte).toBe('lancado');
  });

  it('encontra a data em que o caixa cruza o zero', () => {
    // 2.500 de partida, 1.000/mês de fixo saindo no dia 10, nada entrando.
    // Três saídas na janela: ago, set e out.
    const p = projetarCaixa({
      ...base, saldoInicial: 2500,
      recorrentes: [rec({ valor: 1000, diaDoMes: 10 })],
    });
    expect(p.aperto).toBe('2026-10-10');
    expect(p.saldoFinal).toBe(-500);
    expect(p.faltaParaNaoFurar).toBe(500);
  });

  it('zero não é furo: a data do aperto exige cruzar o zero, não encostar', () => {
    const p = projetarCaixa({
      ...base, saldoInicial: 3000,
      recorrentes: [rec({ valor: 1000, diaDoMes: 10 })],
    });
    expect(p.aperto).toBeUndefined();
    expect(p.saldoFinal).toBe(0);
  });

  it('sem reserva informada, a linha vira variação e não existe data de aperto', () => {
    const p = projetarCaixa({ ...base, recorrentes: [rec({ valor: 1000, diaDoMes: 10 })] });
    expect(p.temSaldo).toBe(false);
    expect(p.saldoInicial).toBe(0);
    // Cruza o zero no primeiro fixo, mas isso é variação — a tela não chama de aperto.
    expect(p.saldoFinal).toBe(-3000);
  });

  it('o funil só entra na segunda linha, e só com previsão escrita', () => {
    const p = projetarCaixa({
      ...base, saldoInicial: 1000,
      oportunidades: [
        opo({ id: 'a', etapa: 'proposta', valor: 10000, previsaoEm: '2026-09-01' }),
        opo({ id: 'b', etapa: 'negociacao', valor: 20000 }),
      ],
    });
    expect(p.entradasDoFunil).toBe(5000);       // 10.000 × 0,5
    expect(p.saldoFinal).toBe(1000);            // a linha base não vê o funil
    expect(p.semPrevisao).toBe(1);
    const dia = p.dias.find((d) => d.data === '2026-09-01');
    expect(dia?.comFunil).toBe(6000);
    expect(dia?.saldo).toBe(1000);
  });

  it('oportunidade fechada ou perdida não entra na projeção', () => {
    const p = projetarCaixa({
      ...base, saldoInicial: 0,
      oportunidades: [
        opo({ id: 'a', etapa: 'fechado', valor: 10000, previsaoEm: '2026-09-01' }),
        opo({ id: 'b', etapa: 'perdido', valor: 10000, previsaoEm: '2026-09-01' }),
      ],
    });
    expect(p.entradasDoFunil).toBe(0);
    expect(p.semPrevisao).toBe(0);
  });

  it('a mínima da dívida some quando ela já está cadastrada nos fixos', () => {
    const ds = [divida({ saldo: 13000, taxaMensal: 0.15, parcelaMinima: 600 })];
    const semFixo = dividaDiluida(ds, []);
    expect(semFixo.incluir).toBe(true);
    expect(semFixo.mensal).toBe(600);

    const comFixo = dividaDiluida(ds, [rec({ categoria: 'Dívida / juros', valor: 600 })]);
    expect(comFixo.incluir).toBe(false);
    expect(comFixo.diaria).toBe(0);
  });

  it('o ritmo mensal fecha a conta de entrada, saída e sobra', () => {
    const r = ritmoMensal({
      ...base,
      recorrentes: [
        rec({ id: 'e', nome: 'Arena', tipo: 'entrada', valor: 4000, categoria: 'Gestão de arena', fixo: false }),
        rec({ id: 's', valor: 1500 }),
      ],
      lancamentos: [lanc({ id: 'v', data: '2026-07-05', valor: 900 })],
      dividas: [divida({ parcelaMinima: 600 })],
    });
    expect(r.entradaFixa).toBe(4000);
    expect(r.saidaFixa).toBe(1500);
    expect(r.variavel).toBe(900);
    expect(r.divida).toBe(600);
    expect(r.sobra).toBe(1000);
  });

  it('a linha semanal tem treze pontos e termina no último dia', () => {
    const p = projetarCaixa({ ...base, saldoInicial: 5000 });
    const s = porSemana(p);
    expect(s).toHaveLength(13);
    expect(s[s.length - 1].data).toBe(p.dias[p.dias.length - 1].data);
  });
});

describe('ponto de equilíbrio de evento', () => {
  // Alíquota zero por padrão: os testes deste bloco são sobre a mecânica do
  // ponto de equilíbrio, e misturar tributo em todos eles só tornaria cada
  // número ilegível. O efeito do imposto tem bloco próprio, mais abaixo.
  const plano = (p: Partial<PlanoEvento> = {}): PlanoEvento => ({
    id: 'e1', nome: 'Etapa', precoInscricao: 300, unidade: 'dupla', aliquotaImposto: 0,
    capacidade: 64, inscritos: 0, patrocinioContratado: 0,
    custos: [
      { id: 'c1', nome: 'Arbitragem', valor: 3000, tipo: 'fixo' },
      { id: 'c2', nome: 'Estrutura', valor: 2000, tipo: 'fixo' },
      { id: 'c3', nome: 'Kit do atleta', valor: 40, tipo: 'porInscrito' },
    ],
    status: 'confirmado', ordem: 1, criadoEm: agora, ...p,
  });

  it('divide o custo fixo pela margem de cada inscrição', () => {
    const a = analisar(plano());
    expect(a.custoFixo).toBe(5000);
    expect(a.custoPorInscrito).toBe(40);
    expect(a.margemContribuicao).toBe(260);
    expect(a.pontoDeEquilibrio).toBe(20);   // ceil(5000 / 260)
    expect(a.ocupacaoNecessaria).toBeCloseTo(20 / 64, 4);
  });

  it('a cota assinada derruba o ponto de equilíbrio; a em negociação não', () => {
    const com = analisar(plano({ patrocinioContratado: 3000, patrocinioEmNegociacao: 10000 }));
    expect(com.pontoDeEquilibrio).toBe(8);  // ceil(2000 / 260)
    expect(com.receitaGarantida).toBe(3000);
  });

  it('cota maior que o custo fixo zera o ponto de equilíbrio', () => {
    const a = analisar(plano({ patrocinioContratado: 6000 }));
    expect(a.pontoDeEquilibrio).toBe(0);
    expect(a.faltamInscritos).toBe(0);
  });

  it('acusa o evento que não fecha nem lotado, e diz de quanto é a cota que falta', () => {
    // 64 duplas × 260 de margem = 16.640 contra 20.000 de custo fixo.
    const a = analisar(plano({ custos: [
      { id: 'c1', nome: 'Estrutura', valor: 20000, tipo: 'fixo' },
      { id: 'c2', nome: 'Kit', valor: 40, tipo: 'porInscrito' },
    ] }));
    expect(a.impossivel).toBe(true);
    expect(a.patrocinioFaltante).toBeCloseTo(20000 - 64 * 260, 6);
    expect(a.ocupacaoNecessaria).toBeGreaterThan(1);
  });

  it('preço abaixo do custo por inscrito: vender mais piora', () => {
    const a = analisar(plano({ precoInscricao: 30 }));
    expect(a.margemNegativa).toBe(true);
    expect(a.pontoDeEquilibrio).toBe(Infinity);
    expect(a.lotado.lucro).toBeLessThan(a.agora.lucro);
  });

  it('o capital exposto é o custo fixo que a cota não cobre', () => {
    expect(analisar(plano()).capitalEmRisco).toBe(5000);
    expect(analisar(plano({ patrocinioContratado: 4000 })).capitalEmRisco).toBe(1000);
    expect(analisar(plano({ patrocinioContratado: 9000 })).capitalEmRisco).toBe(0);
  });

  it('na decisão de seguir ou cancelar, o que já foi pago sai da conta', () => {
    // 4.000 dos 5.000 de fixo já contratados. Restam 1.000 evitáveis.
    const p = plano({
      inscritos: 10,
      custos: [
        { id: 'c1', nome: 'Arbitragem', valor: 4000, tipo: 'fixo', comprometido: true },
        { id: 'c2', nome: 'Mídia', valor: 1000, tipo: 'fixo' },
        { id: 'c3', nome: 'Kit', valor: 40, tipo: 'porInscrito' },
      ],
    });
    const d = seguirOuCancelar(p);
    expect(d.custoAfundado).toBe(4000);
    expect(d.receitaAindaAEntrar).toBe(3000);         // 10 × 300
    expect(d.custoAindaEvitavel).toBe(1400);          // 1.000 + 10 × 40
    expect(d.valeRealizar).toBe(true);
    // Realizar ainda dá prejuízo no papel — e mesmo assim é melhor que cancelar.
    expect(d.resultadoSeRealizar).toBeLessThan(0);
    expect(d.diferenca).toBe(1600);
  });

  it('o preço de equilíbrio mira a ocupação que você espera de verdade', () => {
    const e = precoDeEquilibrio(plano(), 0.5);        // 32 duplas
    expect(e.inscritos).toBe(32);
    expect(e.preco).toBeCloseTo(5000 / 32 + 40, 6);
    expect(e.diferenca).toBeCloseTo(5000 / 32 + 40 - 300, 6);
  });

  it('a temporada soma o exposto e separa os que não fecham', () => {
    const r = resumoDaTemporada([
      plano({ id: 'a', inscritos: 30 }),
      plano({ id: 'b', nome: 'Final', custos: [{ id: 'x', nome: 'Estrutura', valor: 30000, tipo: 'fixo' }] }),
      plano({ id: 'c', status: 'cancelado' }),
    ]);
    expect(r.quantidade).toBe(2);
    expect(r.capitalEmRisco).toBe(5000 + 30000);
    expect(r.impossiveis.map((p) => p.nome)).toEqual(['Final']);
  });
});

describe('carga total', () => {
  const HOJE = '2026-08-28';
  const treino = (data: string, p: Partial<TreinoDoc2> = {}): TreinoDoc2 => ({
    id: 't' + data, data, programa: 'A', criadoEm: agora,
    exercicios: [{
      nome: 'Agachamento', grupo: 'pernas',
      series: [{ carga: 60, reps: 5 }, { carga: 60, reps: 5 }, { carga: 60, reps: 5 }],
    }],
    ...p,
  });

  it('a academia vira minutos vezes esforço, com o RIR virando RPE', () => {
    // Sem RIR e sem duração: 3 séries × 3,5 min × RPE 7 = 73,5 → 74.
    expect(cargaDoTreino(treino(HOJE))).toBe(74);
    // Com duração e RIR 2 em todas: 60 min × RPE 8.
    expect(cargaDoTreino(treino(HOJE, {
      duracaoMin: 60,
      exercicios: [{ nome: 'Supino', grupo: 'peito', series: [{ carga: 50, reps: 5, rir: 2 }] }],
    }))).toBe(480);
  });

  it('a quadra medida ganha da estimada, e o dia de jogo sozinho ainda conta', () => {
    expect(cargaDaQuadra({ id: HOJE, quadraMin: 120, quadraEsforco: 7 })).toBe(840);
    expect(cargaDaQuadra({ id: HOJE, diaDeJogo: true })).toBe(540);
    expect(cargaDaQuadra({ id: HOJE })).toBe(0);
    expect(quadraEstimada({ id: HOJE, diaDeJogo: true })).toBe(true);
    expect(quadraEstimada({ id: HOJE, diaDeJogo: true, quadraMin: 60 })).toBe(false);
  });

  it('a série soma academia e quadra no mesmo dia', () => {
    const s = serieDeCarga(
      [treino(HOJE, { duracaoMin: 60, exercicios: [{ nome: 'X', grupo: 'core', series: [{ carga: 1, reps: 1, rir: 3 }] }] })],
      [{ id: HOJE, quadraMin: 60, quadraEsforco: 5 }],
      HOJE, 7,
    );
    const dia = s[s.length - 1];
    expect(dia.academia).toBe(420);   // 60 × 7
    expect(dia.quadra).toBe(300);
    expect(dia.total).toBe(720);
    expect(s).toHaveLength(7);
  });

  it('as faixas são largas de propósito', () => {
    expect(zonaDe(0.4, 100)).toBe('parado');
    expect(zonaDe(0.7, 100)).toBe('leve');
    expect(zonaDe(1.0, 100)).toBe('ok');
    expect(zonaDe(1.35, 100)).toBe('ok');
    expect(zonaDe(1.5, 100)).toBe('alta');
    expect(zonaDe(1.8, 100)).toBe('pico');
    expect(zonaDe(2, 0)).toBe('parado');   // sem crônica não há razão
  });

  it('a razão só é confiável com três semanas de registro', () => {
    const poucos = lerCarga([], [{ id: HOJE, quadraMin: 60, quadraEsforco: 5 }], HOJE);
    expect(poucos.confiavel).toBe(false);

    const muitos = Array.from({ length: 22 }, (_, i) => ({
      id: somaDias(HOJE, -i), quadraMin: 60, quadraEsforco: 5,
    }));
    const l = lerCarga([], muitos, HOJE);
    expect(l.confiavel).toBe(true);
    expect(l.razao).toBeCloseTo(1, 1);
    expect(l.zona).toBe('ok');
  });

  it('semana muito acima do mês acende o alerta, e o sono curto endurece o recado', () => {
    // Três semanas leves e uma semana pesada.
    const dias = Array.from({ length: 28 }, (_, i) => ({
      id: somaDias(HOJE, -i),
      quadraMin: i < 7 ? 150 : 20,
      quadraEsforco: 8,
    }));
    const l = lerCarga([], dias, HOJE);
    expect(l.zona).toBe('pico');

    expect(recadoDaCarga(l, 7.5).tom).toBe('alerta');
    expect(recadoDaCarga(l, 5).texto).toContain('lesão');
  });

  it('sem histórico o recado é de medição, não de conselho', () => {
    const r = recadoDaCarga(lerCarga([], [], HOJE));
    expect(r.titulo).toBe('Ainda medindo');
    expect(r.tom).toBe('info');
  });
});

describe('capacidade da semana', () => {
  // 2026-08-26 é uma quarta; a semana começa em 2026-08-24 (segunda).
  const QUA = '2026-08-26';
  const rot = (p: Partial<Rotina>): Rotina => ({
    id: 'r', titulo: 'Expediente', dias: [1, 2, 3, 4, 5], duracaoMin: 240,
    ativo: true, criadoEm: agora, ...p,
  });
  const tar = (p: Partial<Tarefa>): Tarefa => ({
    id: 't', titulo: 'Afazer', peso: 'normal', feita: false, criadoEm: agora, ...p,
  });
  const base = {
    rotinas: [] as Rotina[], eventos: [] as Evento[], tarefas: [] as Tarefa[],
    frentes: [] as Frente[], treinos: [] as TreinoDoc2[], dias: [] as Dia[], data: QUA,
  };

  it('desconta sono e manutenção antes de qualquer decisão', () => {
    const c = calcularCapacidade(base);
    expect(c.sono).toBe(52.5);
    expect(c.manutencao).toBe(21);
    expect(c.disponivel).toBe(168 - 52.5 - 21);
    expect(c.segunda).toBe('2026-08-24');
  });

  it('soma rotina, evento e afazer, e separa por frente', () => {
    const c = calcularCapacidade({
      ...base,
      frentes: [
        { id: 'f1', nome: 'Arena', cor: '#EE6018', tipo: 'fixo', ativo: true, ordem: 1, criadoEm: agora },
      ],
      rotinas: [rot({ frenteId: 'f1' })],                      // 5 × 240 = 20 h
      eventos: [{ id: 'e', titulo: 'Reunião', data: QUA, duracaoMin: 120, frenteId: 'f1', criadoEm: agora }],
      tarefas: [tar({ id: 'a', prazo: QUA, peso: 'chave' })],  // 120 min padrão
    });
    expect(c.rotinas).toBe(20);
    expect(c.eventos).toBe(2);
    expect(c.tarefas).toBe(2);
    // A tarefa não tem frente: 20 h de rotina + 2 h de evento ficam com a Arena.
    expect(c.porFrente[0]).toMatchObject({ nome: 'Arena', horas: 22 });
    expect(c.porFrente[1]).toMatchObject({ nome: 'sem frente', horas: 2 });
  });

  it('afazer atrasado continua pesando na semana', () => {
    const c = calcularCapacidade({
      ...base,
      tarefas: [
        tar({ id: 'velha', prazo: '2026-07-01' }),
        tar({ id: 'futura', prazo: '2026-12-01' }),
        tar({ id: 'pronta', prazo: '2026-07-01', feita: true }),
      ],
    });
    expect(c.tarefas).toBe(0.75);          // só a atrasada, 45 min
    expect(c.semEstimativa).toBe(1);
  });

  it('a estimativa declarada substitui o padrão', () => {
    const c = calcularCapacidade({ ...base, tarefas: [tar({ prazo: QUA, estimativaMin: 300 })] });
    expect(c.tarefas).toBe(5);
    expect(c.semEstimativa).toBe(0);
  });

  it('treino e quadra entram pela média das últimas quatro semanas', () => {
    const dias = Array.from({ length: 28 }, (_, i) => ({
      id: somaDias(QUA, -i), quadraMin: 60,
    })) as Dia[];
    expect(horasDeCorpo([], dias, QUA)).toBeCloseTo(28 * 60 / 60 / 4, 4);
  });

  it('acusa a semana que não cabe', () => {
    const c = calcularCapacidade({
      ...base,
      rotinas: [rot({ id: 'a', dias: [0, 1, 2, 3, 4, 5, 6], duracaoMin: 600 })],   // 70 h
      tarefas: Array.from({ length: 20 }, (_, i) => tar({ id: 'x' + i, prazo: QUA, peso: 'chave' })),
    });
    expect(c.zona).toBe('estourada');
    expect(c.livre).toBeLessThan(0);
    expect(c.ocupacao).toBeGreaterThan(1);
  });

  it('o teto de conforto é 85%, não 100%', () => {
    expect(zonaDaSemana(0.4)).toBe('folga');
    expect(zonaDaSemana(0.7)).toBe('ok');
    expect(zonaDaSemana(0.9)).toBe('cheia');
    expect(zonaDaSemana(1.2)).toBe('estourada');
  });

  it('encontra o dia mais cheio da semana', () => {
    const d = diaMaisCheio({
      ...base,
      rotinas: [rot({ dias: [1], duracaoMin: 120 })],
      eventos: [
        { id: 'e1', titulo: 'Torneio', data: '2026-08-29', duracaoMin: 600, criadoEm: agora },
      ],
    });
    expect(d.data).toBe('2026-08-29');
    expect(d.horas).toBe(10);
  });
});

describe('checklist de torneio', () => {
  const HOJE = '2026-08-28';
  const plano = (p: Partial<PlanoEvento> = {}): PlanoEvento => ({
    id: 'e', nome: 'Etapa', data: '2026-09-15', precoInscricao: 300, unidade: 'dupla',
    capacidade: 64, inscritos: 0, patrocinioContratado: 0, custos: [],
    status: 'confirmado', ordem: 1, criadoEm: agora,
    checklist: gerarChecklist(), ...p,
  });

  it('o modelo nasce inteiro e nenhum item vem marcado', () => {
    const c = gerarChecklist();
    expect(c.length).toBe(MODELO_TORNEIO.length);
    expect(c.every((i) => !i.feita)).toBe(true);
    expect(new Set(c.map((i) => i.id)).size).toBe(c.length);
  });

  it('o prazo de cada item sai da data do evento', () => {
    // 18 dias antes de 15/09.
    expect(prazoDoItem('2026-09-15', 18)).toBe('2026-08-28');
    expect(prazoDoItem('2026-09-15', 0)).toBe('2026-09-15');
    expect(prazoDoItem('2026-09-15', -3)).toBe('2026-09-18');
  });

  it('separa o vencido do que vence nos próximos dez dias', () => {
    const e = estadoDoChecklist(plano(), HOJE, 10);
    expect(e.temData).toBe(true);
    // A 18 dias do evento, tudo com prazo maior que 18 dias antes já venceu.
    expect(e.atrasados.every((i) => i.prazo < HOJE)).toBe(true);
    expect(e.agora.every((i) => i.prazo >= HOJE && i.prazo <= somaDias(HOJE, 10))).toBe(true);
    // Nada da fase do dia ou do pós aparece ainda.
    expect(e.agora.some((i) => i.fase === 'depois')).toBe(false);
  });

  it('marcar um item tira ele dos atrasados e move o progresso', () => {
    const p = plano();
    const antes = estadoDoChecklist(p, HOJE);
    const alvo = antes.atrasados[0];
    const depois = estadoDoChecklist({
      ...p,
      checklist: p.checklist!.map((i) => (i.id === alvo.id ? { ...i, feita: true } : i)),
    }, HOJE);
    expect(depois.feitas).toBe(antes.feitas + 1);
    expect(depois.atrasados.find((i) => i.id === alvo.id)).toBeUndefined();
    expect(depois.progresso).toBeGreaterThan(antes.progresso);
  });

  it('sem data no evento não há prazo, e a lista inteira vira o que fazer', () => {
    const e = estadoDoChecklist(plano({ data: undefined }), HOJE);
    expect(e.temData).toBe(false);
    expect(e.atrasados).toHaveLength(0);
    expect(e.agora).toHaveLength(e.total);
    expect(riscoDoEvento(e, plano({ data: undefined }), HOJE)?.tom).toBe('info');
  });

  it('o alerta endurece perto da data, não com o tamanho da lista', () => {
    const longe = plano({ data: '2026-12-01' });
    const perto = plano({ data: '2026-09-05' });

    const rLonge = riscoDoEvento(estadoDoChecklist(longe, HOJE), longe, HOJE);
    const rPerto = riscoDoEvento(estadoDoChecklist(perto, HOJE), perto, HOJE);

    expect(rLonge?.tom).not.toBe('alerta');
    expect(rPerto?.tom).toBe('alerta');
  });

  it('depois do evento, o que sobra é a cobrança do pós', () => {
    const passado = plano({ data: '2026-08-01' });
    const r = riscoDoEvento(estadoDoChecklist(passado, HOJE), passado, HOJE);
    expect(r?.texto).toContain('renova');

    const fechado = plano({
      data: '2026-08-01',
      checklist: gerarChecklist().map((i) => ({ ...i, feita: true })),
    });
    expect(riscoDoEvento(estadoDoChecklist(fechado, HOJE), fechado, HOJE)?.tom).toBe('bom');
  });
});

describe('ideias embarcadas', () => {
  const est = (ordem: number): EstudoDoc2 => ({
    id: 'e' + ordem, titulo: 'Livro ' + ordem, tipo: 'livro', trilha: 'x',
    porque: 'y', eixo: 'oficio', status: 'fila', progresso: 0, ordem, criadoEm: agora,
  });
  const ide = (estudoId: string, ordem: number, estudada = false): IdeiaDoc2 => ({
    id: estudoId + '-' + ordem, estudoId, titulo: 't', conteudo: 'c', aplicacao: 'a',
    ordem, estudada, criadoEm: agora,
  });

  const estudos = [est(2), est(1)];
  const ideias = [ide('e2', 1), ide('e1', 2), ide('e1', 1)];

  it('a ordem é a da estante: material primeiro, sequência depois', () => {
    expect(ordenarIdeias(ideias, estudos).map((i) => i.id))
      .toEqual(['e1-1', 'e1-2', 'e2-1']);
  });

  it('a próxima é a primeira não estudada nessa ordem', () => {
    const e = estadoDasIdeias([ide('e1', 1, true), ide('e1', 2), ide('e2', 1)], estudos);
    expect(e.proxima?.id).toBe('e1-2');
    expect(e.estudadas).toBe(1);
    expect(e.diasRestantes).toBe(2);
    expect(e.progresso).toBeCloseTo(1 / 3, 4);
  });

  it('com tudo estudado não há próxima, e o recado muda', () => {
    const e = estadoDasIdeias(ideias.map((i) => ({ ...i, estudada: true })), estudos);
    expect(e.proxima).toBeNull();
    expect(e.progresso).toBe(1);
    expect(recadoDasIdeias(e)).toContain('revisões');
  });

  it('o progresso por material conta só as dele', () => {
    const r = ideiasDoEstudo([ide('e1', 1, true), ide('e1', 2), ide('e2', 1)], 'e1');
    expect(r.total).toBe(2);
    expect(r.estudadas).toBe(1);
    expect(r.itens.map((i) => i.ordem)).toEqual([1, 2]);
  });

  it('o modelo cobre os treze materiais, com quatro ideias cada', () => {
    const porLivro = new Map<number, number>();
    for (const i of IDEIAS_SUGERIDAS) {
      porLivro.set(i.ordemDoEstudo, (porLivro.get(i.ordemDoEstudo) || 0) + 1);
    }
    expect(porLivro.size).toBe(13);
    expect([...porLivro.values()].every((n) => n === 4)).toBe(true);
    expect(IDEIAS_SUGERIDAS).toHaveLength(52);
    // Toda ideia diz onde encosta: aplicação vazia tornaria o módulo inútil.
    expect(IDEIAS_SUGERIDAS.every((i) => i.aplicacao.trim().length > 40)).toBe(true);
  });
});

// ─────────────────────────────── imposto ───────────────────────────────

describe('imposto', () => {
  const D = '2026-08-15';
  const lanc = (p: Partial<Lancamento>): Lancamento => ({
    id: 'l', data: D, tipo: 'entrada', valor: 1000, categoria: 'Evento',
    criadoEm: agora, ...p,
  });

  it('sem alíquota informada, presume a faixa inicial e diz que está presumindo', () => {
    const r = reservaDeImposto([lanc({ valor: 20000 })], undefined, D);
    expect(r.aliquota).toBe(ALIQUOTA_PADRAO);
    expect(r.presumida).toBe(true);
    expect(r.aGuardar).toBeCloseTo(1200, 6);
  });

  it('a alíquota do perfil manda, e a do evento manda na do perfil', () => {
    expect(aliquotaDe({ aliquotaImposto: 0.155 })).toBe(0.155);
    expect(aliquotaDe({ aliquotaImposto: 0.155 }, 0.06)).toBe(0.06);
    expect(aliquotaDe(undefined)).toBe(ALIQUOTA_PADRAO);
  });

  it('embutir imposto no preço é dividir, não somar — e a diferença é o furo', () => {
    expect(bruto(100, 0.06)).toBeCloseTo(106.3829787, 5);
    expect(bruto(100, 0.06)).toBeGreaterThan(106);
    // O caminho errado deixa a receita líquida abaixo do alvo.
    expect(liquido(106, 0.06)).toBeLessThan(100);
  });

  it('entrada que não passou pelo CNPJ fica fora da base', () => {
    const r = reservaDeImposto([
      lanc({ id: 'a', valor: 20000 }),
      lanc({ id: 'b', valor: 5000, foraDoCnpj: true }),
      lanc({ id: 'c', valor: 900, tipo: 'saida' }),
    ], { aliquotaImposto: 0.06 }, D);
    expect(r.receitaDoMes).toBe(20000);
    expect(r.foraDaBase).toBe(5000);
    expect(r.aGuardar).toBeCloseTo(1200, 6);
  });

  it('a guia do mês vence no dia 20 do mês seguinte', () => {
    expect(vencimentoDoDas('2026-08')).toBe('2026-09-20');
    expect(vencimentoDoDas('2026-12')).toBe('2027-01-20');
    const r = reservaDeImposto([lanc({ data: '2026-07-10', valor: 10000 })], { aliquotaImposto: 0.06 }, D);
    expect(r.receitaAnterior).toBe(10000);
    expect(r.aPagar).toBeCloseTo(600, 6);
    expect(r.venceEm).toBe('2026-08-20');
  });
});

describe('o imposto no ponto de equilíbrio', () => {
  const plano = (p: Partial<PlanoEvento> = {}): PlanoEvento => ({
    id: 'e1', nome: 'Etapa', precoInscricao: 300, unidade: 'dupla',
    capacidade: 64, inscritos: 0, patrocinioContratado: 0,
    custos: [
      { id: 'c1', nome: 'Arbitragem', valor: 3000, tipo: 'fixo' },
      { id: 'c2', nome: 'Estrutura', valor: 2000, tipo: 'fixo' },
      { id: 'c3', nome: 'Kit do atleta', valor: 40, tipo: 'porInscrito' },
    ],
    status: 'confirmado', ordem: 1, criadoEm: agora, ...p,
  });

  it('o tributo cai sobre a receita e sobe o ponto de equilíbrio', () => {
    const a = analisar(plano({ aliquotaImposto: 0.06 }));
    expect(a.pontoSemImposto).toBe(20);           // ceil(5000 / 260)
    expect(a.margemContribuicao).toBeCloseTo(242, 6);  // 300 × 0,94 − 40
    expect(a.pontoDeEquilibrio).toBe(21);         // ceil(5000 / 242)
    expect(a.pontoDeEquilibrio).toBeGreaterThan(a.pontoSemImposto);
  });

  it('o evento desenhado para empatar termina devendo o valor da guia', () => {
    // 20 inscrições era o equilíbrio sem imposto. Com imposto, dá prejuízo.
    const p = plano({ inscritos: 20 });
    expect(analisar(p, { aliquotaImposto: 0 }).agora.lucro).toBeCloseTo(200, 6);
    const com = analisar(p, { aliquotaImposto: 0.06 });
    expect(com.agora.imposto).toBeCloseTo(360, 6);  // 6% de 6.000
    expect(com.agora.lucro).toBeLessThan(0);
  });

  it('a cota assinada entra líquida — o patrocínio também é tributado', () => {
    const a = analisar(plano({ patrocinioContratado: 10000, aliquotaImposto: 0.06 }));
    expect(a.receitaGarantidaBruta).toBe(10000);
    expect(a.receitaGarantida).toBeCloseTo(9400, 6);
    expect(a.capitalEmRisco).toBe(0);   // 5.000 de fixo contra 9.400 líquidos
  });

  it('o preço de equilíbrio embute o imposto por dentro', () => {
    const e = precoDeEquilibrio(plano({ aliquotaImposto: 0.06 }), 0.5);  // 32 duplas
    const semImposto = 5000 / 32 + 40;
    expect(e.preco).toBeCloseTo(semImposto / 0.94, 5);
    // Somar 6% ao preço sem imposto não chegaria lá: é sempre menos.
    expect(e.preco).toBeGreaterThan(semImposto * 1.06);
  });

  it('a temporada mostra o imposto que ninguém reserva', () => {
    const r = resumoDaTemporada([plano({ aliquotaImposto: 0.06 })]);
    expect(r.impostoLotado).toBeCloseTo(64 * 300 * 0.06, 6);
  });
});

describe('o imposto na projeção de caixa', () => {
  const D = '2026-08-01';
  const lanc = (p: Partial<Lancamento>): Lancamento => ({
    id: 'l', data: '2026-07-05', tipo: 'entrada', valor: 10000, categoria: 'Evento',
    criadoEm: agora, ...p,
  });
  const base = {
    lancamentos: [] as Lancamento[], recorrentes: [] as Recorrente[],
    dividas: [] as Divida[], oportunidades: [] as Oportunidade[], data: D,
    perfil: { aliquotaImposto: 0.06 } as Perfil,
    saldoInicial: 20000,
  };

  it('a receita do mês passado vira guia no dia 20 deste mês', () => {
    const p = projetarCaixa({ ...base, lancamentos: [lanc({ valor: 10000 })] });
    const dia = p.dias.find((d) => d.data === '2026-08-20');
    const guia = dia?.movimentos.find((m) => m.fonte === 'imposto');
    expect(guia?.valor).toBeCloseTo(-600, 6);
    expect(p.impostoPrevisto).toBeCloseTo(600, 6);
  });

  it('entrada fora do CNPJ não gera guia nenhuma', () => {
    const p = projetarCaixa({
      ...base,
      lancamentos: [lanc({ valor: 10000, foraDoCnpj: true })],
    });
    expect(p.impostoPrevisto).toBe(0);
  });

  it('o imposto do funil vive só na linha pontilhada', () => {
    const p = projetarCaixa({
      ...base,
      oportunidades: [{
        id: 'o', empresa: 'Marca', etapa: 'proposta', valor: 20000, recorrente: false,
        previsaoEm: '2026-08-10', criadoEm: agora, atualizadoEm: agora,
      }],
    });
    const fim = p.dias[p.dias.length - 1];
    // A linha base não conta nem a entrada do funil nem o imposto dela.
    expect(p.impostoPrevisto).toBe(0);
    expect(fim.saldo).toBeCloseTo(base.saldoInicial, 6);
    // A pontilhada conta as duas coisas: entrada ponderada menos a guia.
    const guia = p.dias.find((d) => d.data === '2026-09-20')
      ?.movimentos.find((m) => m.fonte === 'impostoFunil');
    expect(guia).toBeTruthy();
    expect(fim.comFunil).toBeCloseTo(base.saldoInicial + p.entradasDoFunil * 0.94, 6);
  });

  it('alíquota zero não inventa movimento', () => {
    const p = projetarCaixa({
      ...base, perfil: { aliquotaImposto: 0 },
      lancamentos: [lanc({ valor: 10000 })],
    });
    expect(p.impostoPrevisto).toBe(0);
    expect(p.dias.every((d) => d.movimentos.every((m) => m.fonte !== 'imposto'))).toBe(true);
  });

  it('a sobra mensal já vem depois do imposto', () => {
    const r = ritmoMensal({
      ...base,
      recorrentes: [
        { id: 'a', nome: 'Arena', tipo: 'entrada', valor: 5000, categoria: 'Gestão',
          diaDoMes: 5, fixo: false, ativo: true, criadoEm: agora },
        { id: 'b', nome: 'Aluguel', tipo: 'saida', valor: 2000, categoria: 'Moradia',
          diaDoMes: 10, fixo: true, ativo: true, criadoEm: agora },
      ],
    });
    expect(r.imposto).toBeCloseTo(300, 6);
    expect(r.sobra).toBeCloseTo(5000 - 300 - 2000, 6);
  });
});

describe('perguntas para o contador', () => {
  it('cada pergunta tem id único, bloco conhecido e um porquê que explica', () => {
    const ids = new Set<string>();
    for (const q of PERGUNTAS_CONTADOR) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(BLOCOS).toContain(q.bloco);
      expect(q.pergunta.trim().endsWith('?')).toBe(true);
      // O porquê é o que permite insistir quando a resposta vier vaga; frase
      // curta ali seria enfeite.
      expect(q.porque.trim().length).toBeGreaterThan(80);
    }
  });

  it('todo bloco declarado tem pelo menos uma pergunta', () => {
    for (const b of BLOCOS) {
      expect(PERGUNTAS_CONTADOR.some((q) => q.bloco === b)).toBe(true);
    }
  });

  it('a primeira pergunta é a alíquota — é a única que entra no app', () => {
    expect(PERGUNTAS_CONTADOR[0].id).toBe('q-aliquota');
  });
});
