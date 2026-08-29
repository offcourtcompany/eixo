/**
 * A estante — escolhida para o que você está construindo, não para parecer uma
 * lista de best-sellers.
 *
 * O critério foi um só: cada item precisa responder a uma pergunta que você já
 * tem em aberto. Receita que depende de evento avulso, cota de patrocínio que
 * vira leilão de preço, arena que não vale nada sem você dentro, dívida a 15%
 * ao mês, e um sistema pessoal que precisa sobreviver ao seu perfeccionismo.
 *
 * A ordem é a recomendação de sequência: as trilhas de caixa, venda e sistemas
 * vêm primeiro porque é ali que está a restrição de hoje. Estudo de área entra
 * depois — e o motivo está escrito em cada `porque`.
 */
import type { Estudo } from '../tipos';

export const ESTUDOS_SUGERIDOS: Omit<Estudo, 'id' | 'criadoEm'>[] = [
  {
    titulo: 'O Mito do Empreendedor (The E-Myth Revisited)', autor: 'Michael Gerber',
    tipo: 'livro', trilha: 'Negócio e sistemas', eixo: 'oficio',
    porque: 'Você já começou. É o livro que separa trabalhar NO negócio de trabalhar PARA o negócio — e hoje a Epic e os torneios param quando você para. Leia perguntando qual parte da operação vira manual.',
    status: 'lendo', progresso: 0, ordem: 1,
  },
  {
    titulo: 'Built to Sell', autor: 'John Warrillow',
    tipo: 'livro', trilha: 'Negócio e sistemas', eixo: 'oficio',
    porque: 'A tese é que negócio dependente do dono não se vende. Você quer vender a gestão da arena por um valuation melhor: este diz o que precisa ser verdade antes da conversa de preço.',
    status: 'fila', progresso: 0, ordem: 2,
  },
  {
    titulo: 'A Meta', autor: 'Eliyahu Goldratt',
    tipo: 'livro', trilha: 'Negócio e sistemas', eixo: 'oficio',
    porque: 'Teoria das restrições em forma de romance. Você tem quatro frentes abertas e uma é o gargalo de todas — o livro ensina a achar qual, e por que otimizar as outras não muda o resultado.',
    status: 'fila', progresso: 0, ordem: 3,
  },
  {
    titulo: 'Profit First', autor: 'Mike Michalowicz',
    tipo: 'livro', trilha: 'Dinheiro', eixo: 'dinheiro',
    porque: 'Alocação de caixa para negócio de margem apertada e receita irregular — o formato exato de evento. Separar antes de gastar, em vez de esperar sobrar.',
    status: 'fila', progresso: 0, ordem: 4,
  },
  {
    titulo: 'SPIN Selling', autor: 'Neil Rackham',
    tipo: 'livro', trilha: 'Vendas e patrocínio', eixo: 'oficio',
    porque: 'Venda consultiva de ticket alto, que é o que cota de patrocínio é. Ensina a fazer as perguntas antes da proposta — o oposto de mandar mídia kit e esperar resposta.',
    status: 'fila', progresso: 0, ordem: 5,
  },
  {
    titulo: '$100M Offers', autor: 'Alex Hormozi',
    tipo: 'livro', trilha: 'Vendas e patrocínio', eixo: 'oficio',
    porque: 'Como montar oferta que não é comparada por preço. Enquanto a cota for "logo na arena", ela compete com outdoor; quando vira outra coisa, para de competir.',
    status: 'fila', progresso: 0, ordem: 6,
  },
  {
    titulo: 'Negocie Como Se Sua Vida Dependesse Disso', autor: 'Chris Voss',
    tipo: 'livro', trilha: 'Vendas e patrocínio', eixo: 'oficio',
    porque: 'Serve nas duas pontas: fechar contrato de gestão e renegociar o rotativo. A parte de ancoragem e de rótulos dá para aplicar na mesma semana em que você lê.',
    status: 'fila', progresso: 0, ordem: 7,
  },
  {
    titulo: 'A Psicologia Financeira', autor: 'Morgan Housel',
    tipo: 'livro', trilha: 'Dinheiro', eixo: 'dinheiro',
    porque: 'Trata dinheiro como comportamento, não como planilha. É a tese por trás de metade das decisões deste app — inclusive a de que organização não vence juro de dois dígitos.',
    status: 'fila', progresso: 0, ordem: 8,
  },
  {
    titulo: 'A Transformação Total do Seu Dinheiro', autor: 'Dave Ramsey',
    tipo: 'livro', trilha: 'Dinheiro', eixo: 'dinheiro',
    porque: 'De onde vem a bola de neve que o simulador de dívidas usa. Leia sabendo que a parte de investimento é americana e não se aplica aqui; a de sair da dívida, sim.',
    status: 'fila', progresso: 0, ordem: 9,
  },
  {
    titulo: 'Hábitos Atômicos', autor: 'James Clear',
    tipo: 'livro', trilha: 'Execução', eixo: 'mente',
    porque: 'A base do módulo de hábitos daqui: piso de dois minutos, empilhamento e nunca falhar duas vezes seguidas. Ler é entender por que o app te cobra na segunda falta e não na sequência longa.',
    status: 'fila', progresso: 0, ordem: 10,
  },
  {
    titulo: 'As 4 Disciplinas da Execução', autor: 'McChesney, Covey e Huling',
    tipo: 'livro', trilha: 'Execução', eixo: 'oficio',
    porque: 'De onde vêm as medidas de direção e o placar semanal. É o método que resolve o problema de ter meta boa e semana que não anda.',
    status: 'fila', progresso: 0, ordem: 11,
  },
  {
    titulo: 'Trabalho Focado (Deep Work)', autor: 'Cal Newport',
    tipo: 'livro', trilha: 'Execução', eixo: 'mente',
    porque: 'Você é produtivo de madrugada e a arena come o resto do dia. Este é o livro sobre proteger e usar bem esse bloco, em vez de deixá-lo virar rolagem de celular.',
    status: 'fila', progresso: 0, ordem: 12,
  },
  {
    titulo: 'Sports Marketing: A Strategic Perspective', autor: 'Matthew Shank',
    tipo: 'livro', trilha: 'Gestão esportiva', eixo: 'oficio',
    porque: 'Texto de referência da área que você quer cursar — patrocínio, público, produto esportivo. É acadêmico e em inglês; entra depois que o caixa estiver resolvido, como base da formação.',
    status: 'fila', progresso: 0, ordem: 13,
  },
];

/**
 * Perguntas de recuperação para os primeiros materiais.
 *
 * Não são de múltipla escolha, de propósito: reconhecer a alternativa certa
 * numa lista dá a sensação de saber sem o saber. Aqui você tenta lembrar e só
 * depois confere. A chave é a `ordem` do estudo correspondente.
 */
export const PERGUNTAS_SUGERIDAS: {
  ordemDoEstudo: number; pergunta: string; resposta: string;
}[] = [
  {
    ordemDoEstudo: 1,
    pergunta: 'Qual é a diferença entre trabalhar NO negócio e trabalhar PARA o negócio?',
    resposta: 'Trabalhar NO negócio é construir o sistema que faz o trabalho acontecer sem você — processo, manual, papéis definidos. Trabalhar PARA o negócio é executar a tarefa você mesmo. Quem só executa comprou um emprego, não construiu uma empresa.',
  },
  {
    ordemDoEstudo: 1,
    pergunta: 'Quais são os três papéis que Gerber diz que todo dono acumula, e qual costuma dominar?',
    resposta: 'Empreendedor (visão), Gerente (ordem e processo) e Técnico (execução). O Técnico domina quase sempre, porque é o papel de quem abriu o negócio sabendo fazer a coisa — e é por isso que a operação não se solta do dono.',
  },
  {
    ordemDoEstudo: 2,
    pergunta: 'Segundo Warrillow, o que torna um negócio realmente vendável?',
    resposta: 'Ele precisa ser escalável, lucrativo e — o ponto central — funcionar sem o dono. Receita recorrente, processo documentado, e nenhuma relação de cliente que dependa exclusivamente da pessoa que quer vender.',
  },
  {
    ordemDoEstudo: 3,
    pergunta: 'Na teoria das restrições, por que otimizar um recurso que não é o gargalo não aumenta o resultado?',
    resposta: 'Porque a capacidade do sistema inteiro é definida pelo gargalo. Melhorar o que vem antes só acumula fila na frente dele; melhorar o que vem depois deixa capacidade ociosa. Só elevar a restrição aumenta o ganho.',
  },
  {
    ordemDoEstudo: 5,
    pergunta: 'Quais são as quatro perguntas do SPIN, na ordem?',
    resposta: 'Situação (contexto), Problema (a dificuldade), Implicação (o que esse problema custa) e Necessidade de solução (o valor de resolver). A implicação é a que faz o cliente sentir o tamanho do problema antes de você falar em preço.',
  },
  {
    ordemDoEstudo: 5,
    pergunta: 'Em venda de ticket alto, por que perguntas de situação em excesso atrapalham?',
    resposta: 'Porque servem ao vendedor, não ao cliente — que já conhece a própria situação e se cansa de informá-la. O tempo rende mais em perguntas de problema e de implicação, que é onde o valor aparece.',
  },
  {
    ordemDoEstudo: 6,
    pergunta: 'Quais são os quatro componentes da equação de valor de Hormozi?',
    resposta: 'Resultado desejado e probabilidade percebida de alcançá-lo, que aumentam o valor; tempo até o resultado e esforço ou sacrifício exigidos, que reduzem. Melhorar a oferta é mexer nessas quatro alavancas — não no preço.',
  },
  {
    ordemDoEstudo: 10,
    pergunta: 'Quais são as quatro leis da mudança de comportamento em Hábitos Atômicos?',
    resposta: 'Torne o hábito óbvio, atraente, fácil e satisfatório. Para eliminar um hábito, inverta as quatro: invisível, desinteressante, difícil e insatisfatório.',
  },
  {
    ordemDoEstudo: 10,
    pergunta: 'O que é a regra dos dois minutos, e por que ela funciona?',
    resposta: 'Reduzir o hábito a uma versão de dois minutos — "vestir a roupa de treino" no lugar de "treinar uma hora". Funciona porque o difícil é iniciar e sustentar a identidade de quem faz aquilo; o volume vem depois, quando o comparecimento já é automático.',
  },
  {
    ordemDoEstudo: 11,
    pergunta: 'Qual a diferença entre medida de resultado e medida de direção?',
    resposta: 'A de resultado diz se você chegou, mas só depois — receita do mês, peso final. A de direção é o que você controla e faz agora, e que move o resultado: propostas enviadas, treinos feitos. Placar se faz com a de direção.',
  },
  {
    ordemDoEstudo: 12,
    pergunta: 'Por que Newport diz que trabalho superficial é perigoso mesmo quando é produtivo?',
    resposta: 'Porque preenche o dia com atividade que parece progresso, consome a capacidade de concentração e não produz nada difícil de replicar. O valor raro vem do trabalho que exige concentração longa e sem interrupção.',
  },
];
