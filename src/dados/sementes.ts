/**
 * Ponto de partida opcional — nada disso entra sem você clicar.
 *
 * Não é conteúdo genérico de app de hábito: cada item aqui sai de um diagnóstico
 * específico (dívida em rotativo, ausência de treino de força, receita avulsa
 * contra custo fixo). Tudo é editável e apagável depois.
 */
import type { Habito, AcaoEstrutural, Meta, Recorrente, Frente } from '../tipos';
import { CORES_FRENTE } from '../tipos';

type HabitoSemente = Omit<Habito, 'id' | 'criadoEm'>;

const TODOS = [0, 1, 2, 3, 4, 5, 6];
const UTEIS = [1, 2, 3, 4, 5];

export const HABITOS_SUGERIDOS: HabitoSemente[] = [
  {
    nome: 'Treino de força',
    piso: 'Vestir a roupa e entrar na academia. Uma série já conta o dia.',
    quando: '17h, antes do expediente da arena',
    onde: 'Academia',
    dias: [1, 3, 5],
    eixo: 'corpo', ativo: true, ordem: 1,
  },
  {
    nome: 'Lançar o dinheiro do dia',
    piso: 'Abrir o app e lançar um gasto. Um só.',
    quando: 'Antes de deitar',
    onde: 'Celular, na cama',
    depoisDe: 'Colocar o celular pra carregar',
    dias: TODOS,
    eixo: 'dinheiro', ativo: true, ordem: 2,
  },
  {
    nome: 'Uma ação de receita recorrente',
    piso: 'Mandar uma mensagem. Uma proposta, um follow-up, uma cobrança.',
    quando: 'Primeira hora em que eu abrir o computador',
    onde: 'Mesa de trabalho',
    dias: UTEIS,
    eixo: 'dinheiro', ativo: true, ordem: 3,
  },
  {
    nome: 'Hora de corte da madrugada',
    piso: 'Fechar o notebook e sair da mesa.',
    quando: '03h',
    onde: 'Casa',
    dias: TODOS,
    eixo: 'corpo', ativo: true, ordem: 4,
  },
  {
    nome: 'Registro de três linhas',
    piso: 'Uma frase sobre o dia. Só uma.',
    quando: 'Depois de fechar o notebook',
    onde: 'Celular',
    depoisDe: 'Hora de corte da madrugada',
    dias: TODOS,
    eixo: 'mente', ativo: true, ordem: 5,
  },
  {
    nome: 'Dez páginas de livro',
    piso: 'Uma página.',
    quando: 'Café da manhã',
    onde: 'Cozinha',
    depoisDe: 'Tomar café',
    dias: TODOS,
    eixo: 'oficio', ativo: true, ordem: 6,
  },
  {
    nome: 'Falar com a minha filha',
    piso: 'Mandar um áudio.',
    quando: 'Fim da tarde',
    onde: 'Onde eu estiver',
    dias: TODOS,
    eixo: 'mente', ativo: true, ordem: 7,
  },
  {
    nome: 'Proteína no café da manhã',
    piso: 'Dois ovos.',
    quando: 'Primeira refeição',
    onde: 'Cozinha',
    dias: TODOS,
    eixo: 'corpo', ativo: true, ordem: 8,
  },
];

/**
 * As quatro alavancas que mudam o mês sem depender de receita nova.
 * Os valores são estimativas — confirme cada um com a operadora antes de contar.
 */
export const ACOES_SUGERIDAS: Omit<AcaoEstrutural, 'id'>[] = [
  {
    titulo: 'Trocar o seguro de vida vitalício por temporário',
    detalhe: 'NUNCA cancelar — tem filha menor, a cobertura precisa continuar de pé. '
      + 'O que muda é o produto: temporário (risco puro) custa uma fração do vitalício/resgatável '
      + 'para a mesma cobertura. Peça cotação de temporário 20 anos antes de cancelar o atual, '
      + 'e só cancele com a nova apólice já emitida.',
    impactoMensal: 440,
    status: 'aberta', ordem: 1,
  },
  {
    titulo: 'Vender a cota do consórcio (não cancelar)',
    detalhe: 'Cancelar só devolve o dinheiro na contemplação ou no encerramento do grupo, '
      + 'com multa de 10% a 13%. Venda da cota no mercado secundário devolve capital agora e '
      + 'corta a mensalidade. Peça à administradora o procedimento oficial de transferência.',
    impactoMensal: 340,
    status: 'aberta', ordem: 2,
  },
  {
    titulo: 'Renegociar o rotativo do cartão',
    detalhe: 'Rotativo a ~15% ao mês é ~436% ao ano — nenhuma organização de gastos vence isso. '
      + 'Caminhos: (1) parcelamento da fatura direto com o banco; (2) Procon / Lei 14.181 '
      + '(superendividamento), que permite plano com teto de 30% da renda; (3) empréstimo com '
      + 'garantia de veículo a ~1,5% a.m. como plano B — com risco real de perder o carro. '
      + 'Enquanto isso não muda, todo o resto é enxugar gelo.',
    impactoMensal: 1000,
    status: 'aberta', ordem: 3,
  },
  {
    titulo: 'Auditar os CNPJs abertos no meu CPF',
    detalhe: 'Empresas em nome próprio usadas por terceiros viram responsabilidade sua: dívida '
      + 'ativa, execução fiscal, trabalhista. Hipótese a testar: é isso que trava seu acesso a '
      + 'crédito barato e te mantém preso no rotativo. Verificação gratuita: situação cadastral '
      + 'de cada CNPJ na Receita, certidão de débitos, Dívida Ativa da União, CPF no Serasa/SPC.',
    impactoMensal: 0,
    status: 'aberta', ordem: 4,
  },
];

export function metaModelo(trimestre: string): Omit<Meta, 'id' | 'criadoEm'> {
  return {
    objetivo: 'Sair do vermelho estrutural e montar o primeiro colchão',
    porque: 'Enquanto a sobra é negativa, meu pai paga os juros do meu cartão. '
      + 'Nenhuma decisão de negócio é livre enquanto isso for verdade.',
    eixo: 'dinheiro',
    trimestre,
    krs: [
      { id: 'kr1', nome: 'Sobra mensal', unidade: 'R$', inicio: -110, alvo: 1200, atual: -110 },
      { id: 'kr2', nome: 'Saldo da dívida', unidade: 'R$', inicio: 13000, alvo: 8000, atual: 13000 },
      { id: 'kr3', nome: 'Receita recorrente', unidade: 'R$/mês', inicio: 1750, alvo: 3500, atual: 1750 },
    ],
    medidasDirecao: [
      'Uma ação de receita recorrente por dia útil',
      'Lançar todo dinheiro que entra e sai, todo dia',
      'Fechar as 4 ações estruturais até o fim do trimestre',
    ],
    status: 'ativa',
  };
}

/**
 * Os fixos que quase sempre existem, com os valores do retrato de agosto/2026.
 * São um ponto de partida editável — o app nunca inventa um valor sozinho, mas
 * também não te faz digitar do zero o que já foi conversado.
 */
export const FIXOS_SUGERIDOS: Omit<Recorrente, 'id' | 'criadoEm'>[] = [
  { nome: 'Gestão Epic Boulevard', tipo: 'entrada', valor: 1750, categoria: 'Gestão de arena', diaDoMes: 5, origem: 'fixa', fixo: false, ativo: true },
  { nome: 'Seguro de vida', tipo: 'saida', valor: 520, categoria: 'Seguro', diaDoMes: 3, fixo: true, ativo: true },
  { nome: 'Consórcio', tipo: 'saida', valor: 340, categoria: 'Consórcio', diaDoMes: 8, fixo: true, ativo: true },
  { nome: 'Filha', tipo: 'saida', valor: 300, categoria: 'Filha', diaDoMes: 10, fixo: true, ativo: true },
];

/**
 * As frentes que você já toca hoje. Vêm dos projetos reais em andamento — dá
 * para renomear, apagar e criar outras; isto é só o atalho de quem já sabe
 * quantas coisas estão abertas ao mesmo tempo.
 */
export const FRENTES_SUGERIDAS: Omit<Frente, 'id' | 'criadoEm'>[] = [
  { nome: 'Epic Boulevard', cor: CORES_FRENTE[0], tipo: 'fixo', modelo: 'contratado', ativo: true, ordem: 1 },
  { nome: 'Desafio das Arenas', cor: CORES_FRENTE[1], tipo: 'projeto', modelo: 'proprio', ativo: true, ordem: 2 },
  { nome: 'Boulevard Open', cor: CORES_FRENTE[2], tipo: 'projeto', modelo: 'proprio', ativo: true, ordem: 3 },
  { nome: 'Offcourt', cor: CORES_FRENTE[3], tipo: 'projeto', modelo: 'proprio', ativo: true, ordem: 4 },
  { nome: 'Pessoal', cor: CORES_FRENTE[7], tipo: 'pessoal', ativo: true, ordem: 5 },
];
