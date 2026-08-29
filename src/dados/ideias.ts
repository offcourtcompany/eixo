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

  // ─────────── 8. A Psicologia Financeira ───────────
  {
    ordemDoEstudo: 8,
    titulo: 'Ninguém é louco: cada um decide com a própria história',
    conteudo: 'Housel abre com a tese de que decisões financeiras que parecem insanas de fora quase sempre fazem sentido de dentro. Quem cresceu vendo o dinheiro faltar aprendeu uma coisa; quem cresceu vendo investimento render aprendeu outra. As duas pessoas leem a mesma planilha e agem de formas opostas, e nenhuma das duas está sendo burra — cada uma usa a amostra do mundo que a vida deu.',
    aplicacao: 'Serve para duas coisas suas. Primeira: parar de se julgar pela dívida no rotativo, porque autojulgamento não amortiza saldo e piora a decisão seguinte. Segunda: entender o dono da arena e o patrocinador que dizem não — eles não estão vendo o seu evento, estão vendo o patrocínio que deu errado para eles.',
  },
  {
    ordemDoEstudo: 8,
    titulo: 'Todo retorno tem preço, e ele se paga em desconforto',
    conteudo: 'O preço de um retorno alto não vem em boleto: vem em incerteza, oscilação e vontade de desistir na hora errada. Como o preço não está escrito em lugar nenhum, muita gente tenta levar o resultado sem pagá-lo — troca de estratégia toda vez que aperta, e acaba pagando uma multa maior do que se tivesse aguentado.',
    aplicacao: 'Receita de evento próprio tem retorno alto e volatilidade alta: o preço dela é o mês em que a inscrição não vende. Receita contratada rende menos e custa menos. Enquanto o rotativo existir, você não tem caixa para pagar volatilidade — não é falta de coragem, é que a passagem custa mais do que você tem.',
  },
  {
    ordemDoEstudo: 8,
    titulo: 'Riqueza é o que você não vê',
    conteudo: 'O carro na garagem é gasto, não patrimônio. Riqueza é a receita que não virou consumo, e por isso é invisível por definição — o que dá para ver é sempre o dinheiro que já saiu. Daí um problema de referência: as pessoas copiam sinais de riqueza que são, na verdade, sinais de despesa.',
    aplicacao: 'No meio esportivo isso é diário: carro, tênis, viagem de circuito. É o mesmo mecanismo do campo de custo mensal depois nas Conquistas do app — quase toda compra aparente sobe o seu piso mensal para sempre. Enquanto a receita previsível não cobrir o custo fixo, cada sinal desses compra mais um mês de dependência de evento.',
  },
  {
    ordemDoEstudo: 8,
    titulo: 'Margem de erro é o que mantém você no jogo',
    conteudo: 'A folga não existe para render, existe para você continuar jogando quando algo der errado — e algo sempre dá. Housel trata sobrevivência como a única vantagem que compõe juros: quem fica em pé tempo suficiente colhe os anos bons, e quem quebra uma vez perde todos eles.',
    aplicacao: 'É a reserva de três meses do app, e é por isso que ela vem antes de qualquer conquista da lista. Com colchão, uma etapa que vende pouco é um mês ruim. Sem colchão, a mesma etapa vira rotativo novo a 15% ao mês, e o rotativo devolve você para o começo da fila.',
  },

  // ─────────── 9. A Transformação Total do Seu Dinheiro ───────────
  {
    ordemDoEstudo: 9,
    titulo: 'A bola de neve escolhe o comportamento, não a matemática',
    conteudo: 'Ramsey manda quitar a menor dívida primeiro, mesmo quando outra cobra juros maiores. Ele sabe que isso custa mais em juros e defende assim mesmo: dívida não é problema de planilha, é problema de persistência, e a vitória rápida da primeira quitação é o que faz a pessoa continuar. Motivação vencendo otimização, de propósito.',
    aplicacao: 'O app mostra as duas estratégias lado a lado justamente para você ver o preço dessa escolha. Com 13 mil a 15% ao mês e 1.800 a 3,5%, a diferença entre bola de neve e avalanche costuma ser pequena em reais e grande em ânimo — quando for pequena, escolha a que você sustenta.',
  },
  {
    ordemDoEstudo: 9,
    titulo: 'O colchão pequeno vem antes de atacar a dívida',
    conteudo: 'Antes de acelerar a quitação, Ramsey manda juntar uma reserva pequena e rápida. A lógica é operacional, não financeira: sem reserva nenhuma, o primeiro imprevisto volta para o cartão e desfaz três meses de esforço. Esse colchão inicial não enriquece ninguém — ele impede a recaída.',
    aplicacao: 'No seu caso o imprevisto tem nome: viagem para ver a filha, freio do carro, fornecedor que furou na véspera do torneio. Juntar mil reais intocáveis antes de acelerar parece atraso e é o contrário — é o que faz a quitação não recomeçar do zero em novembro.',
  },
  {
    ordemDoEstudo: 9,
    titulo: 'Orçamento de base zero: todo real recebe um nome',
    conteudo: 'A regra é dar destino a cada real antes de o mês começar, até não sobrar nada sem destino. Não é apertar gasto, é decidir antes em vez de descobrir depois. O que sobra sem nome não sobra de verdade: some, e ninguém consegue dizer para onde foi.',
    aplicacao: 'É o que os fixos cadastrados já fazem no app: o piso do mês deixou de ser estimativa. Falta a outra metade, que é dar nome ao dinheiro de evento antes de ele entrar — quanto vai para dívida, quanto para reserva, quanto fica para a operação da etapa seguinte.',
  },
  {
    ordemDoEstudo: 9,
    titulo: 'Renda é a alavanca forte; cortar tem fundo',
    conteudo: 'A maior alavanca de quem está endividado é a renda, não a economia. Corte de gasto tem limite matemático — ninguém gasta menos que zero — enquanto renda não tem teto. Por isso a fase de quitação é fase de trabalhar mais e vender melhor, não de viver pior.',
    aplicacao: 'Só os juros do seu rotativo passam de mil e novecentos por mês. Nenhuma disciplina de gasto vence isso: ou troca de contrato, ou receita nova. É por isso que as Ações estruturais e o Funil pesam mais, no seu plano, que qualquer corte de despesa pequena.',
  },

  // ─────────── 10. Hábitos Atômicos ───────────
  {
    ordemDoEstudo: 10,
    titulo: 'Sistemas ganham de metas',
    conteudo: 'Clear separa a meta, que é o resultado desejado, do sistema, que é o processo que o produz. Vencedores e perdedores costumam ter as mesmas metas; o que difere é o sistema. E meta atingida traz um risco pouco discutido: ela termina, e com ela termina o comportamento que a sustentava.',
    aplicacao: 'É a diferença entre os resultados-chave e as medidas de direção nas Metas do app. Meta é sair de 96 quilos; sistema é treinar terça e quinta e ter proteína no almoço. Meta é vender três cotas; sistema é o bloco de prospecção de terça e quinta às nove.',
  },
  {
    ordemDoEstudo: 10,
    titulo: 'A regra dos dois minutos',
    conteudo: 'Todo hábito novo deve começar numa versão que leve menos de dois minutos, a ponto de parecer ridícula. O objetivo dos primeiros meses não é o resultado, é a frequência: primeiro se estabelece a identidade de quem faz aquilo, depois se aumenta a dose. Quem começa pela dose completa negocia consigo mesmo todo dia.',
    aplicacao: 'É o campo do piso em cada hábito do app. Em dia de operação de torneio, treinar é vestir a roupa e fazer uma série; estudar é abrir uma pergunta de revisão. Na sua rotina o piso não é preguiça — é o que impede a semana de evento de zerar a sequência.',
  },
  {
    ordemDoEstudo: 10,
    titulo: 'Nunca falhar duas vezes seguidas',
    conteudo: 'Um dia perdido é ruído. O que desmonta um hábito é a segunda falta, porque ela deixa de ser exceção e vira o novo padrão. A regra troca a busca por perfeição, que quebra na primeira falha, por uma regra de recuperação, que sobrevive a ela.',
    aplicacao: 'É a regra que a tela de Hábitos vigia com o aviso de duas faltas seguidas. Com madrugada produtiva e sábado de torneio, perfeição é impossível para você — e recuperação é inteiramente possível.',
  },
  {
    ordemDoEstudo: 10,
    titulo: 'Intenção de implementação e empilhamento',
    conteudo: 'Dizer que vai fazer não muda comportamento; dizer quando e onde muda. Melhor ainda é empilhar sobre um hábito que já existe: depois de fazer o café, eu faço isto. O gatilho deixa de depender de lembrar e passa a depender de algo que já acontece sozinho.',
    aplicacao: 'São os campos de quando, onde e depois de no cadastro de hábito. A sua âncora mais confiável não é o relógio, é o evento do dia: depois que eu chego na arena, depois que eu fecho o caixa, depois que eu volto da quadra.',
  },

  // ─────────── 11. As 4 Disciplinas da Execução ───────────
  {
    ordemDoEstudo: 11,
    titulo: 'O redemoinho: o urgente come o importante',
    conteudo: 'O trabalho do dia a dia — o redemoinho — não é inimigo, é o que mantém a operação viva. Só que ele consome toda a energia disponível e nunca acaba, então qualquer objetivo novo compete com ele em desvantagem. A execução falha menos por falta de estratégia e mais porque o redemoinho vence todo dia por pontos.',
    aplicacao: 'O seu redemoinho é a arena: grade, atleta, pagamento, quadra molhada. Ele é legítimo e paga suas contas. E é exatamente por isso que a meta de receita recorrente precisa de hora marcada na Agenda — sem isso ela nunca vai ser a coisa mais urgente de nenhum dia.',
  },
  {
    ordemDoEstudo: 11,
    titulo: 'Uma coisa extremamente importante, não cinco',
    conteudo: 'Quanto mais objetivos simultâneos, pior o resultado de todos. Duas ou três metas ainda saem; de cinco em diante, a taxa de conclusão desaba. A disciplina é escolher uma meta crucial e aceitar que as outras ficam em manutenção — não abandonadas, apenas sem prioridade de energia.',
    aplicacao: 'Você tem quatro frentes e todas parecem urgentes. A pergunta do método é qual delas, se avançar, deixa as outras mais fáceis. Quase sempre é receita previsível: com o piso coberto, torneio próprio vira escolha em vez de necessidade.',
  },
  {
    ordemDoEstudo: 11,
    titulo: 'Medidas de direção contra medidas de resultado',
    conteudo: 'Medida de resultado é o que você quer e não controla: faturamento, peso, cotas fechadas. Medida de direção é o que você controla e que prevê o resultado: propostas enviadas, treinos feitos, conversas iniciadas. Só a segunda dá para agir hoje, e é ela que move a primeira.',
    aplicacao: 'É o placar semanal do app. Cota fechada não se controla; três conversas novas por semana, sim. Peso não se controla no dia; dois treinos e a proteína do almoço, sim. Quando a semana fecha vermelha na medida de direção, o problema é anterior ao resultado.',
  },
  {
    ordemDoEstudo: 11,
    titulo: 'Placar visível e prestação de contas semanal',
    conteudo: 'Gente joga diferente quando o placar está à vista. Ele precisa ser simples e responder em cinco segundos se você está ganhando. Some a isso um encontro semanal curto em que cada um responde pelo que se comprometeu, e a execução deixa de depender de motivação.',
    aplicacao: 'É a tela de Fechar a semana, e é a razão de ela ser manual: prestação de contas automática não é prestação de contas. Sem sócio, a cobrança é sua com você mesmo — e o registro escrito é o que a torna real em vez de conversa interna que some.',
  },

  // ─────────── 12. Trabalho Focado ───────────
  {
    ordemDoEstudo: 12,
    titulo: 'Trabalho focado é raro, e por isso é caro',
    conteudo: 'Newport separa o trabalho profundo, que exige concentração sem interrupção e cria valor difícil de replicar, do trabalho raso, que é logístico e qualquer um faz. Como o dia despeja interrupção o tempo todo, a capacidade de focar ficou rara ao mesmo tempo em que ficou mais valiosa. Escassez com demanda alta é a definição de preço alto.',
    aplicacao: 'Montar uma proposta de cota que se justifica com números é trabalho profundo. Responder mensagem de atleta é raso — necessário, mas qualquer pessoa treinada faz. O que separa o gestor de arena do dono de circuito é quantas horas profundas por semana ele consegue proteger.',
  },
  {
    ordemDoEstudo: 12,
    titulo: 'A troca de contexto cobra um resíduo',
    conteudo: 'Ao pular de uma tarefa para outra, parte da atenção fica presa na anterior. Esse resíduo faz a segunda render menos, e quem alterna o tempo todo trabalha o dia inteiro numa fração da própria capacidade. A conta não é o minuto olhando o celular, é os quinze seguintes.',
    aplicacao: 'A sua madrugada rende porque ninguém interrompe. Isso não é preferência de horário, é a única janela sem resíduo que a sua rotina oferece — e merece ser tratada como recurso escasso, com o trabalho mais difícil da semana dentro dela.',
  },
  {
    ordemDoEstudo: 12,
    titulo: 'Ritual, não força de vontade',
    conteudo: 'Newport trata o foco como prática agendada, com lugar, duração e regras definidas, e não como estado de espírito. Força de vontade é recurso que acaba durante o dia; ritual não depende dela. Quem espera se sentir concentrado trabalha pouco e se culpa muito.',
    aplicacao: 'Vira bloco na Agenda com frente marcada, e aí a capacidade da semana passa a saber que ele existe. Duas horas de madrugada, duas vezes por semana, com o celular em outro cômodo, produzem mais avanço comercial que uma semana inteira de disponibilidade dispersa.',
  },
  {
    ordemDoEstudo: 12,
    titulo: 'O trabalho raso tem cota, e a cota se defende',
    conteudo: 'O trabalho raso não desaparece: ele precisa caber num teto. Newport sugere estimar quanto do dia é raso e negociar esse limite de forma explícita, inclusive avisando às pessoas quando você responde. Sem teto declarado, o raso ocupa todo o espaço disponível.',
    aplicacao: 'Duas janelas de mensagens por dia, anunciadas no grupo da arena, custam algum incômodo na primeira semana e devolvem a madrugada inteira. E o raso que sobrar é justamente o que dá para delegar primeiro, quando o caixa permitir.',
  },

  // ─────────── 13. Sports Marketing ───────────
  {
    ordemDoEstudo: 13,
    titulo: 'O produto esportivo é imprevisível, e é isso que se vende',
    conteudo: 'O esporte tem uma característica que quase nenhum outro produto tem: quem o produz não controla o resultado. O jogo pode ser ruim, pode chover, o favorito pode cair na primeira fase. Por isso o marketing esportivo não vende o jogo — vende a experiência ao redor dele, que é a parte que dá para garantir: organização, ambiente, pertencimento, ritual.',
    aplicacao: 'Você não controla se a final vai ser equilibrada. Controla grade cumprida, som, água gelada, foto entregue na segunda, arbitragem que não gera discussão. É por isso que a experiência é o seu produto vendável — e é o que faz o atleta voltar mesmo na edição em que ele perdeu cedo.',
  },
  {
    ordemDoEstudo: 13,
    titulo: 'O patrocinador compra público, não o seu evento',
    conteudo: 'Patrocínio é troca comercial, não apoio. A marca compra acesso qualificado a um público específico, associação de imagem e ativação — a chance de fazer alguma coisa com aquelas pessoas. Proposta que fala do evento perde para proposta que fala do público do evento e do que a marca consegue fazer com ele.',
    aplicacao: 'O seu mídia kit deveria abrir com quem joga: faixa etária, renda, bairro, quantos voltam, quantos levam acompanhante. Cota de trinta mil não se justifica pelo tamanho do torneio; se justifica pelo custo por contato qualificado comparado ao que a marca paga em mídia comum.',
  },
  {
    ordemDoEstudo: 13,
    titulo: 'Retenção vale mais que público de uma edição',
    conteudo: 'No esporte, a base recorrente vale muito mais que o público de um evento isolado — a mesma pessoa volta por temporadas e traz gente junto. Por isso a métrica que importa não é público por edição, é retenção: quantos dos que vieram voltam, e quantas edições cada um joga.',
    aplicacao: 'É a métrica que o seu circuito ainda não mede e deveria: quantas duplas da primeira edição voltaram para a segunda. Esse número é o argumento mais forte que existe numa negociação de cota de temporada — e a lista de inscritos guardada é o ativo que o produz.',
  },
  {
    ordemDoEstudo: 13,
    titulo: 'Segmentar em vez de falar com todo mundo',
    conteudo: 'Um evento esportivo atende públicos diferentes ao mesmo tempo: o competitivo que quer nível, o iniciante que quer pertencer, o acompanhante que quer conforto, a marca que quer visibilidade. Tratar todos com a mesma comunicação entrega uma mensagem morna que não convence nenhum deles.',
    aplicacao: 'Categoria iniciante e categoria aberta não se vendem com o mesmo post: uma vende acolhimento e primeira vez, a outra vende nível e disputa. Separar as duas comunicações costuma encher justamente a categoria que sempre falta, que é onde está o crescimento do circuito.',
  },
];
