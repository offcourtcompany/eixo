/**
 * Canal de erro de gravação.
 *
 * Existe por causa de um incidente: o Firestore recusa campo com valor
 * `undefined` — ele lança em vez de ignorar — e o formulário de lançamento
 * sempre enviava `frenteId`, vazio quando nenhuma frente era escolhida. Nenhum
 * lançamento salvava, e **o app não dizia nada**: a folha fechava, a tela
 * voltava, e o dado simplesmente não estava lá.
 *
 * A causa foi corrigida na configuração do Firestore. Este módulo trata da
 * outra metade do problema, que é pior: app que escreve em banco remoto e falha
 * calado ensina o usuário a desconfiar de tudo que ele registrou. Toda falha de
 * escrita passa por aqui e vira faixa na tela, com o código do erro.
 */
export interface Falha {
  /** Código do Firebase quando existe: 'permission-denied', 'unavailable'... */
  codigo: string;
  mensagem: string;
  /** O que o usuário pode fazer, quando há algo a fazer. */
  saida?: string;
  quando: number;
}

type Ouvinte = (f: Falha | null) => void;
const ouvintes = new Set<Ouvinte>();
let atual: Falha | null = null;

export function inscreverEmFalhas(f: Ouvinte) {
  ouvintes.add(f);
  f(atual);
  return () => { ouvintes.delete(f); };
}

export const falhaAtual = () => atual;

export function limparFalha() {
  atual = null;
  ouvintes.forEach((f) => f(null));
}

/** Traduz o erro para linguagem que diz o que aconteceu e o que fazer. */
export function relatarFalha(e: unknown, operacao: string) {
  const codigo = (e as { code?: string })?.code || 'desconhecido';
  const cru = (e as { message?: string })?.message || String(e);

  const { mensagem, saida } = traduzir(codigo, cru, operacao);
  atual = { codigo, mensagem, saida, quando: Date.now() };
  ouvintes.forEach((f) => f(atual));

  // Some no console também: quem está depurando não deveria depender da faixa.
  console.error('EIXO — falha ao ' + operacao, e);
}

function traduzir(codigo: string, cru: string, operacao: string) {
  if (codigo === 'permission-denied') {
    return {
      mensagem: `Sem permissão para ${operacao}. O banco recusou a escrita.`,
      saida: 'As regras do Firestore provavelmente não foram publicadas. No console do Firebase: Firestore Database › Regras › colar o conteúdo de firestore.rules › Publicar.',
    };
  }
  if (codigo === 'unauthenticated') {
    return {
      mensagem: 'A sua sessão expirou.',
      saida: 'Saia e entre de novo.',
    };
  }
  if (codigo === 'unavailable' || cru.includes('offline')) {
    return {
      mensagem: 'Sem conexão com o banco agora.',
      saida: 'O que você registrou fica na fila do aparelho e sobe sozinho quando a conexão voltar. Não registre de novo.',
    };
  }
  if (cru.includes('Unsupported field value: undefined')) {
    return {
      mensagem: `Um campo vazio impediu ${operacao}.`,
      saida: 'Isto é defeito do app, não seu. Me mande um print desta mensagem.',
    };
  }
  return {
    mensagem: `Não consegui ${operacao}.`,
    saida: cru.slice(0, 160),
  };
}
