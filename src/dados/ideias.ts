/**
 * O conteúdo dos materiais, embarcado.
 *
 * Isto existe porque o objetivo não é ler treze livros: é entender as ideias e
 * saber onde cada uma encosta no que você faz. Por isso todo item tem duas
 * partes — o mecanismo (`conteudo`) e o que fazer com ele aqui (`aplicacao`),
 * escrita para arena, torneio, cota e dívida, não para "empresas" em geral.
 *
 * **É resumo autoral, não o texto dos autores.** São as ideias reescritas com
 * as minhas palavras e o seu contexto; não há citação nem reprodução. Resumo
 * também não substitui o livro: quem lê ganha os exemplos, as nuances e os
 * contra-argumentos que não cabem aqui. O que isto resolve é o problema real de
 * quem não vai ler treze livros e mesmo assim precisa das ideias funcionando.
 *
 * A chave é a `ordem` do estudo em `dados/estudos.ts`.
 */
export interface IdeiaSemente {
  ordemDoEstudo: number;
  titulo: string;
  conteudo: string;
  aplicacao: string;
}

export const IDEIAS_SUGERIDAS: IdeiaSemente[] = [
  // ─────────── 1. O Mito do Empreendedor ───────────
  {
    ordemDoEstudo: 1,
    titulo: 'Os três papéis, e por que o Técnico vence',
    conteudo: 'Todo dono acumula três papéis: o Empreendedor, que enxerga o futuro; o Gerente, que cria ordem e processo; e o Técnico, que executa a tarefa. Quem abre um negócio porque sabe fazer a coisa entra pelo papel do Técnico — e o Técnico é o único dos três que produz resultado visível hoje. Por isso ele domina o dia e sufoca os outros dois.',
    aplicacao: 'Você virou gestor de arena porque sabe operar torneio. O Técnico em você monta chave, resolve arbitragem e apaga incêndio na quadra — e cada hora disso é uma hora que o Empreendedor não usou para desenhar a próxima fonte de receita. Olhe a sua semana na Agenda: quantas horas são de Técnico?',
  },
  {
    ordemDoEstudo: 1,
    titulo: 'Trabalhar NO negócio, não PARA ele',
    conteudo: 'Trabalhar PARA o negócio é executar. Trabalhar NO negócio é construir o sistema que faz a execução acontecer sem você: processo escrito, papéis definidos, padrão que outra pessoa consegue repetir. Quem só executa não construiu uma empresa — comprou um emprego, geralmente com salário pior e sem férias.',
    aplicacao: 'Teste concreto: se você sumisse por duas semanas, a Epic continuaria rodando? Se a resposta for não, o valor que você criou está preso na sua cabeça e não entra em nenhuma negociação de venda. Comece escrevendo o passo a passo de uma coisa só — a abertura da arena, ou o fechamento de uma etapa de torneio.',
  },
  {
    ordemDoEstudo: 1,
    titulo: 'O protótipo de franquia',
    conteudo: 'Gerber propõe pensar como se você fosse abrir mais cinco mil unidades do seu negócio. Não porque você vá franquear, mas porque a pergunta força uma disciplina: nada pode depender de talento individual. Tudo precisa ser documentado, previsível e replicável por alguém comum, bem treinado.',
    aplicacao: 'Seus torneios já são quase isso — o Desafio das Arenas roda em oito arenas. A pergunta que resolve o seu ano é: o manual dessa operação existe fora de você? Se existir, você para de ser o gargalo e passa a poder vender o formato para outras cidades em vez de executar todas.',
  },
  {
    ordemDoEstudo: 1,
    titulo: 'Organograma antes das pessoas',
    conteudo: 'A recomendação é desenhar o organograma da empresa que você quer ter, com os cargos e a descrição de cada um, e só então colocar o seu nome em todos eles. À medida que o negócio cresce, você sai de um cargo por vez, contratando ou automatizando — em vez de contratar por desespero e improvisar a função depois.',
    aplicacao: 'Desenhe os cargos das suas frentes: operação de quadra, comercial de cota, financeiro, marketing. Hoje é o seu nome nos quatro. O primeiro a sair deveria ser o que consome mais hora e paga menos por hora — e essa conta a tela de Finanças já faz por frente.',
  },

  // ─────────── 2. Built to Sell ───────────
  {
    ordemDoEstudo: 2,
    titulo: 'O teste do dono ausente',
    conteudo: 'Um negócio só tem valor de mercado se funciona sem quem o criou. Comprador nenhum paga múltiplo por uma operação em que as relações, o conhecimento e as decisões moram numa pessoa que vai embora depois da venda — porque o que ele compraria já saiu pela porta.',
    aplicacao: 'Antes de qualquer conversa de valuation da Epic, faça o inventário do que só existe em você: o contato dos atletas, o critério de precificação, a relação com os donos. Cada item que virar documento ou contrato aumenta o preço mais do que qualquer argumento de negociação.',
  },
  {
    ordemDoEstudo: 2,
    titulo: 'Especializar em um serviço repetível',
    conteudo: 'A tese é abandonar o "faço de tudo" e escolher um serviço que se repete, se ensina e se vende sozinho. Negócio que atende demanda variada precisa do dono para cotar, decidir e adaptar cada caso; negócio de um produto só vira processo, e processo vira preço padrão e equipe treinada.',
    aplicacao: 'Você faz gestão de arena, torneio próprio, evento contratado e produto digital. Qual desses você conseguiria vender dez vezes no ano exatamente igual? Provavelmente o torneio como formato empacotado. Os outros podem continuar existindo, mas só um deles vira ativo vendável.',
  },
  {
    ordemDoEstudo: 2,
    titulo: 'Receita recorrente vale múltiplo maior',
    conteudo: 'Duas empresas com o mesmo lucro valem preços muito diferentes se uma tem receita contratada e a outra depende de vender de novo todo mês. Recorrência reduz o risco do comprador, e risco menor é o que ele paga a mais. É a diferença entre comprar um faturamento e comprar uma esperança.',
    aplicacao: 'É exatamente o placar do app: receita previsível contra piso fixo. Cada contrato de gestão anual e cada patrocínio de temporada, em vez de por edição, aumentam duas coisas ao mesmo tempo — a sua tranquilidade mensal e o preço da arena no dia da venda.',
  },
  {
    ordemDoEstudo: 2,
    titulo: 'Nenhum cliente pesando demais',
    conteudo: 'Warrillow usa a régua de que nenhum cliente deveria representar mais de 15% da receita. Acima disso, o comprador enxerga risco de concentração: se aquele cliente sai, o negócio inteiro cambaleia — e ele desconta o preço por isso, ou desiste.',
    aplicacao: 'Hoje a gestão da Epic é a sua única renda fixa. Isso é concentração de 100% na parte previsível, e é por isso que você não pode largá-la mesmo quando ela paga pouco por hora. A saída não é brigar com esse número: é criar a segunda e a terceira fonte recorrente.',
  },

  // ─────────── 3. A Meta ───────────
  {
    ordemDoEstudo: 3,
    titulo: 'Ganho, inventário e despesa operacional',
    conteudo: 'Goldratt reduz a saúde de um sistema a três medidas: ganho (dinheiro que entra pelas vendas), inventário (dinheiro parado dentro do sistema) e despesa operacional (o que se gasta para transformar um no outro). Toda decisão boa aumenta o primeiro sem inchar os outros dois — e a maioria das decisões "de eficiência" faz o contrário.',
    aplicacao: 'Comprar mais estrutura de torneio parece eficiência e vira inventário parado. Contratar mais um evento sem resolver o gargalo aumenta despesa operacional sem aumentar ganho. A pergunta antes de cada sim: isto aumenta o que entra, ou só aumenta movimento?',
  },
  {
    ordemDoEstudo: 3,
    titulo: 'A restrição manda no sistema inteiro',
    conteudo: 'Todo sistema tem um gargalo, e a capacidade dele é a capacidade do sistema. Melhorar qualquer etapa que não seja o gargalo não aumenta o resultado: só acumula fila antes dele ou ociosidade depois. Isso contraria a intuição, porque cada etapa parece que merece ser melhorada.',
    aplicacao: 'Nas suas quatro frentes, o gargalo tem nome: são as suas horas. Toda melhoria que não devolve hora sua — mais um evento, mais uma arena, mais um projeto — não aumenta o resultado, redistribui o cansaço. Por isso a conta de R$/hora por frente é a mais importante do app.',
  },
  {
    ordemDoEstudo: 3,
    titulo: 'Os cinco passos: identificar, explorar, subordinar, elevar, repetir',
    conteudo: 'Identifique a restrição; explore ao máximo o que ela já dá; subordine todo o resto ao ritmo dela; só então invista para elevá-la; e quando ela deixar de ser a restrição, recomece — porque o gargalo se move. O erro comum é pular direto para "elevar", comprando capacidade antes de usar bem a que existe.',
    aplicacao: 'Antes de contratar alguém para ganhar tempo — que é elevar —, explore: quantas das suas horas hoje são de tarefa que ninguém precisaria fazer? Subordinar seria dizer não a todo evento que não caiba na semana, mesmo lucrativo, porque ele rouba a hora que a restrição não tem.',
  },
  {
    ordemDoEstudo: 3,
    titulo: 'Otimização local não soma',
    conteudo: 'Setores que otimizam o próprio desempenho isoladamente costumam piorar o todo: cada um produz mais do que o seguinte consegue absorver, e o excesso vira estoque, retrabalho e custo. Eficiência local medida por indicador próprio é uma das formas mais caras de destruir resultado.',
    aplicacao: 'Fazer marketing perfeito de um torneio cuja operação já está no limite não vende mais inscrição: enche a fila do gargalo. Se a sua semana já está cheia, investir em atrair mais demanda antes de resolver a capacidade só transforma oportunidade em atraso e desgaste.',
  },

  // ─────────── 4. Profit First ───────────
  {
    ordemDoEstudo: 4,
    titulo: 'Inverter a fórmula',
    conteudo: 'A contabilidade tradicional diz que lucro é o que sobra depois das despesas. Michalowicz inverte: separe o lucro assim que o dinheiro entra e opere com o que restou. A mudança não é contábil, é comportamental — porque despesa se expande até ocupar todo o dinheiro disponível.',
    aplicacao: 'Quando entram R$ 3.000 de um evento, separe antes de qualquer conta. Mesmo 5%. No seu caso, com o rotativo aberto, essa fatia vai para a dívida e não para uma reserva — mas o gesto é o mesmo: tirar da frente antes de o mês comer.',
  },
  {
    ordemDoEstudo: 4,
    titulo: 'Contas separadas, não planilha',
    conteudo: 'O método usa várias contas bancárias — operação, lucro, imposto, retirada do dono — e distribui cada entrada entre elas em percentuais fixos. A separação física funciona porque não depende de disciplina no momento do gasto: o dinheiro simplesmente não está lá.',
    aplicacao: 'Você opera com receita irregular de evento e conta única, o que faz o dinheiro do próximo torneio parecer sobra do mês. Separar a operação do evento da sua vida pessoal resolve metade da confusão — e faz o app parar de mostrar uma sobra que na verdade é caixa de terceiro.',
  },
  {
    ordemDoEstudo: 4,
    titulo: 'A lei de Parkinson aplicada ao caixa',
    conteudo: 'O consumo se ajusta ao recurso disponível: com mais dinheiro na conta, gasta-se mais, quase sem perceber. Reduzir deliberadamente o que está visível força criatividade e corte, do mesmo jeito que um prazo curto força foco.',
    aplicacao: 'É por isso que meses bons de evento não deixam rastro. O dinheiro do torneio entra, fica visível na conta e é absorvido por decisões que pareciam pequenas. Tirar da vista no dia em que entra é mais eficaz do que qualquer promessa de economizar depois.',
  },
  {
    ordemDoEstudo: 4,
    titulo: 'Ritmo quinzenal em vez de diário',
    conteudo: 'A recomendação é pagar contas em dois dias fixos do mês, e não conforme chegam. O ritmo cria previsibilidade, revela com antecedência quando o dinheiro não vai dar, e tira a decisão financeira do improviso emocional do dia.',
    aplicacao: 'Com madrugada produtiva e dia tomado pela arena, decisão de dinheiro no meio do corre é decisão ruim. Dois blocos fixos por mês — que cabem como rotina na Agenda — valem mais do que abrir o app do banco quinze vezes por semana.',
  },

  // ─────────── 5. SPIN Selling ───────────
  {
    ordemDoEstudo: 5,
    titulo: 'As quatro perguntas, na ordem',
    conteudo: 'Situação levanta o contexto; Problema traz a dificuldade à tona; Implicação explora o que essa dificuldade custa; e Necessidade de solução faz o cliente dizer, com as palavras dele, o valor de resolver. A pesquisa de Rackham mostrou que vendedores de sucesso em vendas grandes gastam a maior parte do tempo nas duas do meio.',
    aplicacao: 'A conversa de cota costuma pular direto para a apresentação do mídia kit — que é resposta antes de pergunta. Comece perguntando como a marca capta cliente hoje, o que não está funcionando, e quanto custa esse buraco. A proposta entra depois, encaixada no que ele já disse.',
  },
  {
    ordemDoEstudo: 5,
    titulo: 'A implicação é onde o valor aparece',
    conteudo: 'Perguntas de implicação transformam um problema pequeno num problema caro: quanto isso custa por mês, o que acontece se continuar assim, o que já se tentou. Sem elas, o cliente compara o preço da sua solução com um incômodo — e incômodo barato não move orçamento.',
    aplicacao: 'Se o patrocinador diz que a marca não é conhecida pelo público de beach tennis, a implicação é: quantos clientes desse perfil ele perde por ano para o concorrente que está lá? Feita essa conta por ele, uma cota de trinta mil deixa de ser cara e passa a ser barata.',
  },
  {
    ordemDoEstudo: 5,
    titulo: 'Venda grande não tem fechamento agressivo',
    conteudo: 'Técnicas de fechamento por pressão funcionam em venda pequena e atrapalham em venda grande: quanto maior a decisão, mais a pressão gera resistência e mais gente participa da escolha. O que funciona é avançar — combinar o próximo passo concreto ao fim de cada conversa.',
    aplicacao: 'Não force o sim na primeira reunião de patrocínio. Saia com um avanço marcado: uma visita à arena num dia de movimento, uma proposta customizada com data de retorno. Reunião que termina em "vou pensar" sem data é reunião perdida, mesmo quando parece boa.',
  },
  {
    ordemDoEstudo: 5,
    titulo: 'Necessidade implícita e necessidade explícita',
    conteudo: 'Implícita é a reclamação solta — "está caro", "dá trabalho". Explícita é o desejo declarado de resolver, com o cliente pedindo a solução. Em vendas grandes, apenas a explícita prevê fechamento; apresentar solução em cima de necessidade implícita é o erro mais comum e mais caro.',
    aplicacao: 'Quando o dono da marca diz "a gente já patrocinou uma vez e não deu retorno", isso é implícita. Só vire para a proposta quando ele disser algo como "eu precisaria de uma forma de medir o retorno" — aí você está respondendo ao pedido dele, não empurrando o seu.',
  },

  // ─────────── 6. $100M Offers ───────────
  {
    ordemDoEstudo: 6,
    titulo: 'A equação de valor',
    conteudo: 'O valor percebido sobe com o resultado desejado e com a probabilidade percebida de alcançá-lo, e desce com o tempo até o resultado e com o esforço exigido. São quatro alavancas — e nenhuma delas é preço. Ofertas fracas tentam competir mexendo só no que está fora da equação.',
    aplicacao: 'Cota de patrocínio costuma ser vendida como exposição, que é resultado vago e probabilidade duvidosa. Reescreva as suas cotas atacando as quatro: qual resultado exato, com que prova de que funciona, em quanto tempo, e com quanto trabalho da parte do patrocinador — de preferência nenhum.',
  },
  {
    ordemDoEstudo: 6,
    titulo: 'Oferta que não dá para comparar',
    conteudo: 'Enquanto o cliente conseguir comparar a sua oferta com a do lado, a decisão vira preço, e preço é a única disputa que ninguém ganha por muito tempo. A saída é montar um conjunto tão específico — entregas, garantias, bônus, formato — que não exista item equivalente no mercado para colocar ao lado.',
    aplicacao: 'Enquanto a sua cota for "logo na arena e post no Instagram", ela compete com outdoor e com o rival do lado. Se virar "presença no circuito das oito arenas, com ativação em quadra, base de atletas e relatório de contatos gerados", não há com o que comparar — e o preço volta a ser seu.',
  },
  {
    ordemDoEstudo: 6,
    titulo: 'Escassez e urgência precisam ser verdadeiras',
    conteudo: 'Escassez limita quantidade; urgência limita tempo. As duas funcionam porque tornam a decisão de adiar custosa. Mas funcionam uma única vez se forem inventadas: o cliente que descobre a mentira não volta, e a reputação paga a conta.',
    aplicacao: 'No seu caso as duas são reais e você não usa: existe uma cota master por edição, e a etapa tem data marcada. Dizer "há uma cota master e a arte fecha no dia 10" é fato, não pressão — e é justamente por ser fato que funciona sem queimar a relação.',
  },
  {
    ordemDoEstudo: 6,
    titulo: 'Garantia como remoção de risco',
    conteudo: 'A garantia existe para transferir o risco de quem compra para quem vende. Quanto mais específica e mais incômoda ela for para você, mais ela vale — porque comunica confiança de um jeito que adjetivo nenhum comunica.',
    aplicacao: 'Uma garantia possível numa cota: se o público da etapa ficar abaixo de um número combinado, a marca entra na etapa seguinte sem custo. Você conhece o seu público melhor que o patrocinador, então o risco real é baixo — e a percepção de risco que você tira dele é enorme.',
  },

  // ─────────── 7. Negocie Como Se Sua Vida Dependesse Disso ───────────
  {
    ordemDoEstudo: 7,
    titulo: 'Rotular e espelhar',
    conteudo: 'Rotular é nomear em voz alta a emoção do outro — "parece que isso já deu problema antes" — e esperar. Espelhar é repetir as últimas palavras dele como pergunta. As duas técnicas fazem a pessoa se explicar mais, e é na explicação que aparece o que ela realmente quer.',
    aplicacao: 'Na renegociação do rotativo, o rótulo funciona: "parece que vocês ouvem isso o dia inteiro". O atendente relaxa e passa a informar em vez de recitar. O mesmo vale com patrocinador cético: nomear a desconfiança dele desarma mais do que argumentar contra ela.',
  },
  {
    ordemDoEstudo: 7,
    titulo: '"Não" é começo, não fim',
    conteudo: 'Voss argumenta que buscar o "sim" cedo deixa o outro na defensiva, porque sim compromete. O "não" devolve a sensação de controle e abre a conversa. Perguntas desenhadas para receber não — "seria um absurdo se...?" — costumam avançar mais do que as desenhadas para receber sim.',
    aplicacao: 'Em vez de "podemos fechar essa cota?", tente "seria um absurdo demais rever esse valor antes da etapa?". O não que você recebe é um "não, não seria" — e a conversa continua com o outro se sentindo no comando.',
  },
  {
    ordemDoEstudo: 7,
    titulo: 'A pergunta calibrada: "como eu faço isso?"',
    conteudo: 'Perguntas abertas começadas por "como" transferem o problema para o outro lado sem confronto. Diante de uma exigência inviável, perguntar como você deveria cumpri-la obriga a outra parte a olhar a própria proposta pelos seus olhos — e frequentemente a flexibilizá-la sozinha.',
    aplicacao: 'Quando o banco disser que o mínimo é X e você não tem X: "como eu faço isso com uma renda que varia por evento?". Quando um contratante quiser prazo impossível: "como eu entrego isso em duas semanas com a estrutura que a gente combinou?".',
  },
  {
    ordemDoEstudo: 7,
    titulo: 'Âncora e o número ímpar',
    conteudo: 'O primeiro número dito molda toda a faixa da negociação. Voss recomenda ancorar alto quando você abre, sustentar com uma justificativa concreta, e usar números não redondos — 37.500 parece calculado, 40.000 parece chute e convida a contraproposta.',
    aplicacao: 'Se hoje você manda a tabela de cotas em 30, 15 e 10 mil, está ancorando em números redondos que pedem desconto. Uma cota master em 32.400 com a conta que justifica — custo por contato, alcance, ativação — muda a conversa de "quanto você faz?" para "de onde vem esse número?".',
  },
];
