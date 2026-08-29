/**
 * Bancada de pré-visualização — SÓ desenvolvimento.
 *
 * Existe porque build verde não prova app no ar: em 08/08/2026 o app da Offcourt
 * compilou, passou nos testes e mesmo assim derrubou toda tela com gráfico no
 * navegador. Aqui as telas rodam com dados falsos e sem Firebase, então dá para
 * ver cada uma de verdade antes de existir projeto no console.
 *
 * Desde 28/08/2026 ela também é **pública**, em /preview.html, servindo de
 * demonstração navegável do sistema — por isso os dados de exemplo devem
 * continuar plausíveis e nunca conter nada real.
 *
 * Local: http://localhost:5173/preview.html
 */
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import type { DadosApp } from './dadosApp';
import type {
  Dia, Lancamento, Divida, AcaoEstrutural, Habito, Meta, Recorrente, Treino as TreinoDoc,
  Frente, Evento, Rotina, Tarefa, Marco, Refeicao, AlimentoMeu, Semana,
  Estudo as EstudoDoc, Pergunta, Conquista, Oportunidade, PlanoEvento, Ideia as IdeiaDoc,
} from './tipos';
import { hoje, somaDias, mesAtual, mesRelativo } from './formato';
import { MODELO_TORNEIO } from './dados/checklistTorneio';
import { segundaDa } from './logica/semana';
import {
  HABITOS_SUGERIDOS, ACOES_SUGERIDAS, metaModelo, FRENTES_SUGERIDAS, REFEICOES_SUGERIDAS,
} from './dados/sementes';
import { ESTUDOS_SUGERIDOS, PERGUNTAS_SUGERIDAS } from './dados/estudos';
import { IDEIAS_SUGERIDAS } from './dados/ideias';
import { trimestreAtual } from './formato';
import Hoje from './telas/Hoje';
import Agenda from './telas/Agenda';
import Nutricao from './telas/Nutricao';
import EstudoTela from './telas/Estudo';
import Consultor from './telas/Consultor';
import Funil from './telas/Funil';
import Financeiro from './telas/Financeiro';
import Habitos from './telas/Habitos';
import Treino from './telas/Treino';
import Metas from './telas/Metas';
import Briefing from './telas/Briefing';
import Ajustes from './telas/Ajustes';

const agora = new Date().toISOString();
const id = (n: string) => n;

function semear() {
  const habitos: Habito[] = HABITOS_SUGERIDOS.map((h, i) => ({
    ...h, id: 'h' + i, criadoEm: somaDias(hoje(), -45) + 'T00:00:00.000Z',
  }));

  const refeicoes: Refeicao[] = REFEICOES_SUGERIDAS.map((r, i) => ({
    ...r, id: 'ref' + i, criadoEm: somaDias(hoje(), -45) + 'T00:00:00.000Z',
  }));

  // 40 dias de marcações com um buraco duplo proposital, para a regra das duas
  // faltas seguidas aparecer na tela em vez de ficar só no código.
  const dias: Dia[] = [];
  for (let i = 0; i < 40; i++) {
    const data = somaDias(hoje(), -i);
    const marcados: Record<string, boolean> = {};
    for (const h of habitos) {
      const sorte = (i * 7 + Number(h.id.slice(1)) * 13) % 10;
      marcados[h.id] = i === 0 ? false : sorte > 2;
    }
    // Refeições do plano: adesão alta, com furos verossímeis.
    const refeitas: Record<string, boolean> = {};
    let proteina = 0;
    for (const r of refeicoes) {
      const aconteceu = (i * 3 + Number(r.id.slice(3)) * 5) % 10 > 2;
      refeitas[r.id] = aconteceu;
      if (aconteceu) proteina += r.proteinaG;
    }

    dias.push({
      id: data,
      habitos: marcados,
      humor: 2 + ((i * 3) % 4),
      energia: 2 + ((i * 5) % 4),
      // Pesagem quase todo dia, descendo devagar: i é "dias atrás", então
      // quanto mais antigo, mais pesado. O ruído diário é de propósito — é ele
      // que faz a média móvel valer a pena na tela.
      peso: i % 4 === 3 ? undefined
        : Math.round((95.6 + i * 0.055 + ((i * 7) % 5) * 0.18) * 10) / 10,
      // Cintura uma vez por semana, descendo mais rápido que o peso — é o
      // caso de recomposição que o veredito precisa saber ler.
      cinturaCm: i % 7 === 0 ? Math.round((97.5 + i * 0.09) * 10) / 10 : undefined,
      sonoHoras: 5 + ((i * 3) % 4),
      diaDeJogo: i % 4 === 1,
      refeicoes: refeitas,
      proteinaG: proteina,
      aguaMl: 500 * (2 + (i % 3)),
      alcoolDoses: i % 7 === 0 ? 2 : 0,
    });
  }

  const lancamentos: Lancamento[] = [];
  for (let m = 0; m < 6; m++) {
    const mes = mesRelativo(mesAtual(), -m);
    lancamentos.push(
      { id: 'e' + m + 'a', data: mes + '-05', tipo: 'entrada', valor: 1750, categoria: 'Gestão de arena', origem: 'fixa', frenteId: 'f0', criadoEm: agora },
      { id: 'e' + m + 'b', data: mes + '-12', tipo: 'entrada', valor: 600 + m * 90, categoria: 'Torneio próprio', origem: 'recorrente', frenteId: 'f1', criadoEm: agora },
      { id: 'e' + m + 'c', data: mes + '-20', tipo: 'entrada', valor: m % 2 ? 2400 : 700, categoria: 'Evento contratado', origem: 'avulsa', frenteId: 'f2', criadoEm: agora },
      { id: 's' + m + 'a', data: mes + '-03', tipo: 'saida', valor: 520, categoria: 'Seguro', fixo: true, criadoEm: agora, deRecorrente: 'r1', aConfirmar: m === 0 },
      { id: 's' + m + 'b', data: mes + '-08', tipo: 'saida', valor: 340, categoria: 'Consórcio', fixo: true, criadoEm: agora },
      { id: 's' + m + 'c', data: mes + '-10', tipo: 'saida', valor: 300, categoria: 'Filha', fixo: true, criadoEm: agora },
      { id: 's' + m + 'd', data: mes + '-15', tipo: 'saida', valor: 1950, categoria: 'Dívida / juros', fixo: true, criadoEm: agora },
      { id: 's' + m + 'e', data: mes + '-18', tipo: 'saida', valor: 480 + m * 20, categoria: 'Combustível', criadoEm: agora },
      { id: 's' + m + 'f', data: mes + '-22', tipo: 'saida', valor: 620, categoria: 'Comida', criadoEm: agora },
    );
  }

  // Dois fixos cadastrados, e o de agosto já entrou sozinho esperando confirmação.
  const recorrentes: Recorrente[] = [
    { id: 'r1', nome: 'Seguro de vida', tipo: 'saida', valor: 520, categoria: 'Seguro', diaDoMes: 3, fixo: true, ativo: true, geradoAte: mesAtual(), criadoEm: agora },
    { id: 'r2', nome: 'Gestão Epic Boulevard', tipo: 'entrada', valor: 1750, categoria: 'Gestão de arena', diaDoMes: 5, fixo: false, origem: 'fixa', ativo: true, geradoAte: mesAtual(), criadoEm: agora },
  ];

  const dividas: Divida[] = [
    { id: 'd1', nome: 'Rotativo do cartão', saldo: 13000, taxaMensal: 0.15, parcelaMinima: 400, descricao: 'Entrou na temporada passada para segurar a estrutura de duas etapas que venderam abaixo do esperado. O gerente ofereceu parcelar em 12x a 4,9% a.m.; não fechei na hora e a oferta segue de pé.', ativa: true, criadoEm: agora },
    { id: 'd2', nome: 'Parcelado da loja', saldo: 1800, taxaMensal: 0.035, parcelaMinima: 180, descricao: 'Compra do notebook, 10 parcelas restantes. Sem multa para antecipar.', ativa: true, criadoEm: agora },
  ];

  const acoes: AcaoEstrutural[] = ACOES_SUGERIDAS.map((a, i) => ({
    ...a, id: 'a' + i, status: i === 1 ? 'andamento' : i === 3 ? 'feita' : 'aberta',
  }));

  const metas: Meta[] = [{ ...metaModelo(trimestreAtual()), id: 'm1', criadoEm: agora }];

  // Oito semanas de placar, com buracos: é uma linha furada que explica um
  // trimestre, e a tela precisa saber desenhar isso.
  const estudos: EstudoDoc[] = ESTUDOS_SUGERIDOS.slice(0, 6).map((e, i) => ({
    ...e, id: 'est' + i, criadoEm: agora,
    status: i === 0 ? 'lendo' : i === 1 ? 'lido' : 'fila',
    progresso: i === 0 ? 38 : i === 1 ? 100 : 0,
  }));

  const perguntas: Pergunta[] = PERGUNTAS_SUGERIDAS.slice(0, 6).map((q, i) => ({
    id: 'q' + i,
    estudoId: 'est' + (q.ordemDoEstudo - 1),
    pergunta: q.pergunta,
    resposta: q.resposta,
    proximaEm: somaDias(hoje(), i < 3 ? -1 : 4),
    intervalo: i < 3 ? 2 : 6,
    acertos: i, erros: i % 2,
    criadoEm: agora,
  }));

  // As ideias embarcadas, com o começo da estante já estudado — é o estado
  // que faz o cartão da ideia do dia aparecer com progresso real.
  const ideias: IdeiaDoc[] = IDEIAS_SUGERIDAS.slice(0, 24).map((x, i) => ({
    id: "idea" + i,
    estudoId: "est" + (x.ordemDoEstudo - 1),
    titulo: x.titulo,
    conteudo: x.conteudo,
    aplicacao: x.aplicacao,
    ordem: i + 1,
    estudada: i < 7,
    criadoEm: agora,
  }));

  // Um funil com paradas, perdas com motivo e uma temporada fechada: é o
  // estado que a tela precisa saber ler, não o funil ideal.
  const oportunidades: Oportunidade[] = [
    { id: 'op1', empresa: 'Rede de academias', contato: 'Marina', etapa: 'proposta', valor: 30000, recorrente: true, frenteId: 'f1', proximoPasso: 'Levar na arena numa quinta', proximoEm: somaDias(hoje(), 3), previsaoEm: somaDias(hoje(), 45), dor: 'Não alcançam quem já pratica esporte', criadoEm: agora, atualizadoEm: agora },
    { id: 'op2', empresa: 'Distribuidora de bebidas', etapa: 'negociacao', valor: 15000, recorrente: false, frenteId: 'f2', proximoPasso: 'Retorno do jurídico', proximoEm: somaDias(hoje(), -2), previsaoEm: somaDias(hoje(), 20), criadoEm: agora, atualizadoEm: agora },
    { id: 'op3', empresa: 'Clínica de fisioterapia', etapa: 'contato', valor: 10000, recorrente: true, criadoEm: agora, atualizadoEm: agora },
    { id: 'op4', empresa: 'Loja de material esportivo', etapa: 'reuniao', valor: 8000, recorrente: false, proximoPasso: 'Enviar proposta', proximoEm: somaDias(hoje(), 5), criadoEm: agora, atualizadoEm: agora },
    { id: 'op5', empresa: 'Construtora', etapa: 'fechado', valor: 22000, recorrente: true, criadoEm: agora, atualizadoEm: agora },
    { id: 'op6', empresa: 'Concessionária', etapa: 'perdido', valor: 30000, recorrente: false, motivoPerda: 'Sem verba neste semestre', criadoEm: agora, atualizadoEm: agora },
    { id: 'op7', empresa: 'Supermercado', etapa: 'perdido', valor: 12000, recorrente: false, motivoPerda: 'Sem verba neste semestre', criadoEm: agora, atualizadoEm: agora },
  ];

  const conquistas: Conquista[] = [
    { id: 'c1', nome: 'Reserva de 3 meses', tipo: 'marco', custo: 9330, guardado: 720, porque: 'Sem colchão, todo evento vira aposta.', status: 'juntando', ordem: 1, criadoEm: agora },
    { id: 'c2', nome: 'Carro melhor', tipo: 'compra', custo: 45000, guardado: 0, custoMensalDepois: 480, porque: 'Ferramenta de trabalho — mas o piso mensal sobe junto.', status: 'sonhando', ordem: 2, criadoEm: agora },
  ];

  const semanas: Semana[] = [7, 6, 5, 4, 3, 2, 1, 0].map((atras) => {
    const segunda = segundaDa(somaDias(hoje(), -7 * atras));
    return {
      id: segunda,
      medidas: {
        md1: (atras * 3) % 7,
        md2: atras % 3 === 0 ? 7 : 5,
        md3: atras % 2,
      },
      nota: atras === 1 ? 'Semana comida pelo torneio. As propostas não saíram.' : undefined,
      fechadaEm: agora,
    };
  });

  const treinos: TreinoDoc[] = [0, 2, 4, 7, 9, 11, 14].map((d, i) => ({
    id: 't' + i,
    data: somaDias(hoje(), -d),
    programa: i % 2 ? 'A' : 'B',
    criadoEm: agora,
    exercicios: i % 2
      ? [
          { nome: 'Agachamento livre', grupo: 'pernas' as const, series: [{ carga: 60 + i * 2.5, reps: 5 }, { carga: 60 + i * 2.5, reps: 5 }, { carga: 60 + i * 2.5, reps: 4 }] },
          { nome: 'Supino reto', grupo: 'peito' as const, series: [{ carga: 45 + i, reps: 5 }, { carga: 45 + i, reps: 5 }] },
          { nome: 'Remada curvada', grupo: 'costas' as const, series: [{ carga: 40, reps: 8 }, { carga: 40, reps: 8 }] },
        ]
      : [
          { nome: 'Levantamento terra', grupo: 'pernas' as const, series: [{ carga: 80 + i * 2.5, reps: 5 }, { carga: 80 + i * 2.5, reps: 5 }] },
          { nome: 'Desenvolvimento militar', grupo: 'ombro' as const, series: [{ carga: 30 + i, reps: 5 }, { carga: 30 + i, reps: 4 }] },
          { nome: 'Face pull', grupo: 'ombro' as const, series: [{ carga: 15, reps: 15 }, { carga: 15, reps: 15 }] },
        ],
  }));

  const frentes: Frente[] = FRENTES_SUGERIDAS.map((f, i) => ({ ...f, id: 'f' + i, criadoEm: agora }));

  // Seis meses de dívida caindo devagar e reserva começando — o estado que a
  // curva precisa saber desenhar antes de existir registro real.
  const marcos: Marco[] = [0, 1, 2, 3, 4, 5].map((m) => {
    const mes = mesRelativo(mesAtual(), -(5 - m));
    return {
      id: mes + '-01',
      dividaTotal: 14800 - m * 620,
      reserva: m < 2 ? 0 : (m - 1) * 180,
      nota: m === 2 ? 'Seguro trocado por temporário' : m === 4 ? 'Cota do consórcio vendida' : undefined,
      criadoEm: agora,
    };
  });

  // Agenda com cara de temporada em andamento: etapa marcada, reunião de cota,
  // rotina de arena e um afazer vencido — o estado que a tela precisa saber
  // desenhar antes de existir dado real.
  const eventos: Evento[] = [
    { id: 'ev1', titulo: 'Reunião de cota — patrocinador', data: somaDias(hoje(), 1), hora: '10:00', duracaoMin: 60, local: 'Escritório', frenteId: 'f1', criadoEm: agora },
    { id: 'ev2', titulo: 'Kickoff Desafio das Arenas', data: somaDias(hoje(), 9), hora: '08:00', duracaoMin: 600, local: 'Arena Boulevard', frenteId: 'f1', criadoEm: agora },
    { id: 'ev3', titulo: 'Boulevard Open — dia 1', data: somaDias(hoje(), 29), hora: '08:00', duracaoMin: 660, local: 'Epic Arena Boulevard', frenteId: 'f2', criadoEm: agora },
    { id: 'ev4', titulo: 'Boulevard Open — dia 2', data: somaDias(hoje(), 30), hora: '08:00', duracaoMin: 660, local: 'Epic Arena Boulevard', frenteId: 'f2', criadoEm: agora },
    { id: 'ev5', titulo: 'Fechar grade de horários', data: hoje(), hora: '15:00', duracaoMin: 90, frenteId: 'f2', criadoEm: agora },
  ];

  const rotinas: Rotina[] = [
    { id: 'ro1', titulo: 'Expediente na arena', dias: [1, 2, 3, 4, 5], hora: '18:00', duracaoMin: 240, local: 'Epic Arena Boulevard', frenteId: 'f0', ativo: true, criadoEm: agora },
    { id: 'ro2', titulo: 'Rodada da liga', dias: [1], hora: '19:00', duracaoMin: 180, frenteId: 'f0', ativo: true, criadoEm: agora },
    { id: 'ro3', titulo: 'Bloco de prospecção', dias: [2, 4], hora: '09:00', duracaoMin: 90, frenteId: 'f3', ativo: true, criadoEm: agora },
  ];

  const tarefas: Tarefa[] = [
    { id: 'ta1', titulo: 'Enviar mídia kit para a cota master', prazo: somaDias(hoje(), -4), frenteId: 'f1', peso: 'chave', feita: false, criadoEm: agora },
    { id: 'ta2', titulo: 'Confirmar arbitragem da 2ª etapa', prazo: somaDias(hoje(), -1), frenteId: 'f1', peso: 'normal', feita: false, criadoEm: agora },
    { id: 'ta3', titulo: 'Publicar regulamento no site', prazo: hoje(), frenteId: 'f2', peso: 'chave', feita: false, criadoEm: agora },
    { id: 'ta4', titulo: 'Cotar troféus', prazo: somaDias(hoje(), 3), frenteId: 'f2', peso: 'normal', feita: false, criadoEm: agora },
    { id: 'ta5', titulo: 'Reescrever a página de preços', frenteId: 'f3', peso: 'normal', feita: false, criadoEm: agora },
    { id: 'ta6', titulo: 'Renegociar o rotativo', prazo: somaDias(hoje(), 6), frenteId: 'f4', peso: 'chave', feita: false, criadoEm: agora },
    { id: 'ta7', titulo: 'Fechar contrato da arena', prazo: somaDias(hoje(), -9), frenteId: 'f0', peso: 'normal', feita: true, feitaEm: agora, criadoEm: agora },
  ];


  // Dois eventos próprios: um que fecha com folga e um desenhado no vermelho —
  // porque o segundo é o caso que a tela existe para revelar.
  const planos: PlanoEvento[] = [
    {
      id: 'pe1', nome: 'Boulevard Open', data: somaDias(hoje(), 29), frenteId: 'f2',
      precoInscricao: 300, unidade: 'dupla', capacidade: 96, inscritos: 34,
      patrocinioContratado: 4000, patrocinioEmNegociacao: 15000, outrasReceitas: 2500,
      custos: [
        { id: 'x1', nome: 'Arbitragem', valor: 4200, tipo: 'fixo', comprometido: true },
        { id: 'x2', nome: 'Estrutura e som', valor: 3800, tipo: 'fixo' },
        { id: 'x3', nome: 'Troféus e premiação', valor: 5200, tipo: 'fixo' },
        { id: 'x4', nome: 'Mídia e tráfego', valor: 1800, tipo: 'fixo' },
        { id: 'x5', nome: 'Kit do atleta', valor: 45, tipo: 'porInscrito' },
      ],
      status: 'confirmado', ordem: 1, criadoEm: agora,
      checklist: MODELO_TORNEIO.map((m, i) => ({
        id: m.id, titulo: m.titulo, fase: m.fase, diasAntes: m.diasAntes,
        detalhe: m.detalhe, feita: i % 3 !== 2,
      })),
    },
    {
      id: 'pe2', nome: 'Desafio das Arenas — Final', data: somaDias(hoje(), 82), frenteId: 'f1',
      precoInscricao: 260, unidade: 'dupla', capacidade: 48, inscritos: 0,
      patrocinioContratado: 0, patrocinioEmNegociacao: 30000,
      custos: [
        { id: 'y1', nome: 'Estrutura da final', valor: 12000, tipo: 'fixo' },
        { id: 'y2', nome: 'Premiação em dinheiro', valor: 8000, tipo: 'fixo' },
        { id: 'y3', nome: 'Kit e medalha', valor: 60, tipo: 'porInscrito' },
      ],
      status: 'rascunho', ordem: 2, criadoEm: agora,
    },
  ];

  return { habitos, dias, lancamentos, recorrentes, dividas, acoes, metas, treinos, frentes, eventos, rotinas, tarefas, marcos, refeicoes, semanas, estudos, perguntas, conquistas, oportunidades, planos, ideias };
}

/** Coleção em memória com a mesma superfície de useColecao. */
function useColecaoFalsa<T extends { id: string }>(inicial: T[]) {
  const [itens, setItens] = useState<T[]>(inicial);
  return {
    itens,
    pronto: true,
    salvar: async (item: Partial<T> & { id?: string }) => {
      const chave = item.id || id('novo-' + Math.random().toString(36).slice(2));
      setItens((atual) => {
        const i = atual.findIndex((x) => x.id === chave);
        if (i >= 0) {
          const copia = [...atual];
          copia[i] = { ...copia[i], ...item, id: chave } as T;
          return copia;
        }
        return [{ ...(item as T), id: chave }, ...atual];
      });
      return chave;
    },
    remover: async (alvo: string) => setItens((atual) => atual.filter((x) => x.id !== alvo)),
  };
}

const TELAS = ['hoje', 'consultor', 'agenda', 'dinheiro', 'comida', 'habitos', 'treino', 'metas', 'funil', 'estudo', 'briefing', 'ajustes'] as const;
type Tela = typeof TELAS[number];

function Bancada() {
  const inicial = useMemo(() => semear(), []);
  const [tela, setTela] = useState<Tela>('hoje');

  const lancamentos = useColecaoFalsa<Lancamento>(inicial.lancamentos);
  const recorrentes = useColecaoFalsa<Recorrente>(inicial.recorrentes);
  const dividas = useColecaoFalsa<Divida>(inicial.dividas);
  const acoes = useColecaoFalsa<AcaoEstrutural>(inicial.acoes);
  const habitos = useColecaoFalsa<Habito>(inicial.habitos);
  const metas = useColecaoFalsa<Meta>(inicial.metas);
  const treinos = useColecaoFalsa<TreinoDoc>(inicial.treinos);
  const frentes = useColecaoFalsa<Frente>(inicial.frentes);
  const eventos = useColecaoFalsa<Evento>(inicial.eventos);
  const rotinas = useColecaoFalsa<Rotina>(inicial.rotinas);
  const tarefas = useColecaoFalsa<Tarefa>(inicial.tarefas);
  const marcos = useColecaoFalsa<Marco>(inicial.marcos);
  const refeicoes = useColecaoFalsa<Refeicao>(inicial.refeicoes);
  const alimentos = useColecaoFalsa<AlimentoMeu>([]);
  const semanas = useColecaoFalsa<Semana>(inicial.semanas);
  const estudos = useColecaoFalsa<EstudoDoc>(inicial.estudos);
  const perguntas = useColecaoFalsa<Pergunta>(inicial.perguntas);
  const conquistas = useColecaoFalsa<Conquista>(inicial.conquistas);
  const planos = useColecaoFalsa<PlanoEvento>(inicial.planos);
  const ideias = useColecaoFalsa<IdeiaDoc>(inicial.ideias);
  const oportunidades = useColecaoFalsa<Oportunidade>(inicial.oportunidades);
  const diasColecao = useColecaoFalsa<Dia>(inicial.dias);

  const porData = useMemo(() => {
    const m = new Map<string, Dia>();
    for (const d of diasColecao.itens) m.set(d.id, d);
    return m;
  }, [diasColecao.itens]);

  const dados = {
    uid: 'previa',
    lancamentos, recorrentes, dividas, acoes, habitos, metas, treinos,
    frentes, eventos, rotinas, tarefas, marcos, refeicoes, alimentos, semanas,
    estudos, perguntas, conquistas, oportunidades, planos, ideias,
    dias: diasColecao.itens,
    porData,
    salvarDia: diasColecao.salvar,
    perfil: {
      nome: 'Prévia', custoFixoMensal: 3110, rendaFixa: 1750, pesoAlvo: 88, reservaAlvoMeses: 3,
      aliquotaImposto: 0.06,
      alturaCm: 178, idade: 30, sexo: 'm', nivelAtividade: 'alto', ritmoSemanal: -0.6,
    },
    salvarPerfil: async () => {},
  } as unknown as DadosApp;

  const conteudo = {
    hoje: <Hoje dados={dados} irPara={(d) => setTela(d as Tela)} />,
    agenda: <Agenda dados={dados} />,
    comida: <Nutricao dados={dados} />,
    estudo: <EstudoTela dados={dados} />,
    funil: <Funil dados={dados} />,
    consultor: <Consultor dados={dados} irPara={() => setTela('briefing')} />,
    dinheiro: <Financeiro dados={dados} />,
    habitos: <Habitos dados={dados} />,
    treino: <Treino dados={dados} />,
    metas: <Metas dados={dados} />,
    briefing: <Briefing dados={dados} />,
    ajustes: <Ajustes dados={dados} email="previa@local" previa />,
  }[tela];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-borda2 bg-fundo px-4 py-2">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-1.5">
          {/* Agora que a página é pública, ela precisa se apresentar: quem cai
              aqui sem contexto tem que entender em uma linha que é demonstração
              e que nenhum número é de alguém de verdade. */}
          <span className="mr-2 font-mono text-[13px] uppercase tracking-[0.22em] text-creme">EIXO</span>
          <span className="rotulo mr-3 text-fraco">demonstração · dados fictícios</span>
          {TELAS.map((t) => (
            <button key={t} onClick={() => setTela(t)}
              className={'rounded-lg px-2.5 py-1 text-[12px] transition '
                + (tela === t ? 'bg-brasa text-fundo font-medium' : 'text-suave hover:bg-superficie2')}>
              {t}
            </button>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{conteudo}</main>
    </div>
  );
}

// O root é guardado entre recargas quentes: chamar createRoot de novo no mesmo
// container faz o React reclamar no console, e console sujo esconde erro de verdade.
const alvo = document.getElementById('root')! as HTMLElement & { _raiz?: ReturnType<typeof createRoot> };
(alvo._raiz ??= createRoot(alvo)).render(<Bancada />);
