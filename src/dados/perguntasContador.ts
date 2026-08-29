/**
 * As perguntas para levar ao contador.
 *
 * Existe porque a reunião com contador quase sempre acontece do jeito errado:
 * ele explica o que aconteceu no mês passado, você concorda, e sai sem nenhum
 * dos números que decidem o próximo. Não é falha dele — ele responde o que foi
 * perguntado, e quem organiza evento raramente sabe o que perguntar.
 *
 * Todas as perguntas aqui têm a mesma qualidade: **a resposta muda uma decisão
 * sua**, não o seu conhecimento geral. A alíquota muda o preço da inscrição. O
 * Fator R muda o custo de tudo. A retenção muda quanto entra na conta. Pergunta
 * cuja resposta não muda nada ficou de fora de propósito — lista longa é lista
 * que não se lê na hora.
 *
 * A ordem é a de impacto no seu caixa, não a de organização contábil.
 */

export interface PerguntaContador {
  id: string;
  bloco: string;
  pergunta: string;
  /** Por que esta pergunta importa para você especificamente. */
  porque: string;
}

export const BLOCOS = [
  'O número que o app usa',
  'O anexo e o Fator R',
  'Nota, retenção e cidade',
  'O que é da empresa e o que é meu',
  'Prazos e o que não dá para atrasar',
] as const;

export const PERGUNTAS_CONTADOR: PerguntaContador[] = [
  // ── O número que o app usa ───────────────────────────────────────────
  {
    id: 'q-aliquota',
    bloco: 'O número que o app usa',
    pergunta: 'Qual é a minha alíquota efetiva hoje, em porcentagem da receita bruta?',
    porque:
      'É o único número desta lista que entra direto no app. Enquanto ele não estiver em Ajustes, '
      + 'todo ponto de equilíbrio de evento aqui está saindo com 6% presumidos — e 6% é o piso, '
      + 'raramente a realidade de quem já faturou alguns meses.',
  },
  {
    id: 'q-rbt12',
    bloco: 'O número que o app usa',
    pergunta: 'Qual é o meu RBT12 hoje, e em que faturamento a alíquota sobe de faixa?',
    porque:
      'A alíquota do Simples sobe com o faturamento dos últimos doze meses. Saber onde fica a '
      + 'próxima faixa é o que permite decidir se vale puxar uma etapa para janeiro em vez de '
      + 'dezembro — decisão de calendário, não de contabilidade.',
  },
  {
    id: 'q-projecao',
    bloco: 'O número que o app usa',
    pergunta: 'Se eu faturar o dobro nesta temporada, qual passa a ser a alíquota?',
    porque:
      'Uma temporada boa pode levar a próxima para uma faixa mais cara. Precificar a temporada '
      + 'inteira com a alíquota de hoje é errar para menos justamente no ano em que der certo.',
  },

  // ── O anexo e o Fator R ──────────────────────────────────────────────
  {
    id: 'q-anexo',
    bloco: 'O anexo e o Fator R',
    pergunta: 'Estou no Anexo III ou no Anexo V? E qual é o meu Fator R hoje?',
    porque:
      'É a diferença mais cara que existe no Simples para serviço: com folha abaixo de 28% da '
      + 'receita, o que cairia no Anexo III vai para o V e a conta praticamente dobra. Quem tem '
      + 'pouca folha e muita receita — que é o caso de quem organiza evento — cai nessa sem perceber.',
  },
  {
    id: 'q-prolabore',
    bloco: 'O anexo e o Fator R',
    pergunta: 'Vale aumentar o pró-labore para manter o Fator R acima de 28%? A conta fecha?',
    porque:
      'Pró-labore maior custa INSS e IRRF, mas pode baratear todo o resto. É uma conta de ida e '
      + 'volta que só ele consegue fazer com os seus números — e que, quando fecha, é a maior '
      + 'economia disponível sem mudar nada no negócio.',
  },
  {
    id: 'q-atividades',
    bloco: 'O anexo e o Fator R',
    pergunta:
      'Inscrição de torneio, cota de patrocínio, locação de quadra e gestão de arena caem no mesmo '
      + 'anexo e no mesmo CNAE?',
    porque:
      'Se caem em anexos diferentes, o preço de cada uma tem que ser pensado separado. Hoje o app '
      + 'usa uma alíquota só para o evento inteiro; se a sua realidade for mista, dá para colocar '
      + 'uma alíquota específica em cada evento.',
  },

  // ── Nota, retenção e cidade ──────────────────────────────────────────
  {
    id: 'q-nfse-atleta',
    bloco: 'Nota, retenção e cidade',
    pergunta: 'Preciso emitir nota para cada atleta pessoa física, ou dá para emitir uma por evento?',
    porque:
      'Cem duplas inscritas podem virar cem notas ou uma. A resposta muda a sua semana de véspera '
      + 'de torneio, que já é a mais apertada do calendário.',
  },
  {
    id: 'q-retencao',
    bloco: 'Nota, retenção e cidade',
    pergunta: 'A empresa que paga a cota retém ISS ou IR na fonte? Quanto cai na conta de uma cota de R$ 30 mil?',
    porque:
      'É a diferença entre faturado e recebido, e é exatamente onde a projeção de caixa erra se '
      + 'ninguém avisar: você orçou trinta mil, entram vinte e oito, e o buraco aparece na semana '
      + 'do evento.',
  },
  {
    id: 'q-fora-da-cidade',
    bloco: 'Nota, retenção e cidade',
    pergunta: 'Quando o evento acontece em outra cidade, muda alguma coisa no imposto?',
    porque:
      'Circuito com etapas em arenas diferentes pode gerar obrigação no município do evento. Melhor '
      + 'descobrir antes de fechar o calendário da temporada do que depois da terceira etapa.',
  },
  {
    id: 'q-plataforma',
    bloco: 'Nota, retenção e cidade',
    pergunta:
      'Quando a inscrição é cobrada por uma plataforma e ela me repassa o líquido, o que eu declaro '
      + 'como receita: o bruto ou o repasse?',
    porque:
      'Se o imposto cai sobre o bruto e você só recebe o líquido, a taxa da plataforma sai duas '
      + 'vezes do seu bolso. Isso muda o preço da inscrição, não só a papelada.',
  },

  // ── O que é da empresa e o que é meu ─────────────────────────────────
  {
    id: 'q-distribuicao',
    bloco: 'O que é da empresa e o que é meu',
    pergunta: 'Quanto eu posso tirar como distribuição de lucro isenta? Preciso de contabilidade completa para isso?',
    porque:
      'É o caminho mais barato de tirar dinheiro da empresa, e tem limite. Sem saber o limite, ou '
      + 'você tira menos do que podia ou tira o que vai ser cobrado depois.',
  },
  {
    id: 'q-despesas',
    bloco: 'O que é da empresa e o que é meu',
    pergunta: 'Quais despesas do evento precisam de nota no CNPJ, e o que acontece com as que não têm?',
    porque:
      'Arbitragem, estrutura e prêmio muitas vezes são pagos sem nota. Saber o custo real disso — '
      + 'tributário e de risco — é o que permite decidir se vale pagar mais caro por um fornecedor '
      + 'que emite.',
  },
  {
    id: 'q-pf',
    bloco: 'O que é da empresa e o que é meu',
    pergunta: 'Tenho alguma obrigação como pessoa física por causa dos eventos?',
    porque:
      'Dinheiro que passa pela sua conta pessoal e não pelo CNPJ tem tratamento próprio. É a '
      + 'pergunta que ninguém faz e que aparece na malha fina dois anos depois.',
  },

  // ── Prazos e o que não dá para atrasar ───────────────────────────────
  {
    id: 'q-prazos',
    bloco: 'Prazos e o que não dá para atrasar',
    pergunta: 'Quais são as minhas obrigações do ano, com data, e quais delas eu preciso fazer alguma coisa?',
    porque:
      'DAS todo dia 20, declaração mensal, declaração anual. Saber quais dependem de você e quais '
      + 'ele resolve sozinho é o que evita a multa que chega por esquecimento, não por falta de dinheiro.',
  },
  {
    id: 'q-atraso',
    bloco: 'Prazos e o que não dá para atrasar',
    pergunta: 'Se eu atrasar uma guia, quanto custa? E se eu atrasar três meses?',
    porque:
      'Em mês apertado, atrasar a guia parece a saída mais barata. Saber o preço exato disso — e '
      + 'comparar com os 15% ao mês do rotativo — é o que transforma o desespero em decisão.',
  },
  {
    id: 'q-mes-vazio',
    bloco: 'Prazos e o que não dá para atrasar',
    pergunta: 'Se eu ficar dois meses sem faturar nada, pago alguma coisa mesmo assim?',
    porque:
      'Entre temporadas a receita para, e o custo fixo da empresa não. É um número que precisa '
      + 'estar nos seus fixos do app, e hoje provavelmente não está.',
  },
];
