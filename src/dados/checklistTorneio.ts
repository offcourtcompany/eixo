/**
 * O checklist de torneio.
 *
 * Não é uma lista de boas intenções: é a memória operacional de uma edição,
 * escrita para a seguinte. O que quebra evento amador quase nunca é o que se
 * esqueceu de planejar — é o que se lembrou tarde demais para resolver barato.
 * Troféu encomendado na semana do evento chega no dobro do preço ou não chega;
 * arbitragem confirmada por telefone e não por escrito falta no sábado.
 *
 * Por isso cada item tem um **prazo em dias antes do evento**, e não uma
 * posição numa lista. O prazo é a informação: ele diz quando aquilo deixa de
 * ser barato e quando deixa de ser possível.
 *
 * A lista é ponto de partida, não gaiola — no app dá para apagar item, mudar
 * prazo e acrescentar o que só existe no seu circuito.
 */

export type FaseChecklist = 'desenho' | 'venda' | 'operacao' | 'semana' | 'vespera' | 'dia' | 'depois';

export const FASES: Record<FaseChecklist, { nome: string; ordem: number }> = {
  desenho:  { nome: 'Antes de abrir inscrição', ordem: 1 },
  venda:    { nome: 'Venda', ordem: 2 },
  operacao: { nome: 'Contratação', ordem: 3 },
  semana:   { nome: 'Semana do evento', ordem: 4 },
  vespera:  { nome: 'Véspera', ordem: 5 },
  dia:      { nome: 'No dia', ordem: 6 },
  depois:   { nome: 'Depois', ordem: 7 },
};

export interface ItemModelo {
  id: string;
  titulo: string;
  fase: FaseChecklist;
  /** Dias antes do evento. 0 = no dia. Negativo = depois dele. */
  diasAntes: number;
  detalhe?: string;
}

export const MODELO_TORNEIO: ItemModelo[] = [
  // ── Antes de abrir inscrição ────────────────────────────────────────────
  {
    id: 'data', titulo: 'Data e quadra confirmadas por escrito', fase: 'desenho', diasAntes: 45,
    detalhe: 'Reserva verbal não é reserva. Sem isso, tudo abaixo pode virar retrabalho.',
  },
  {
    id: 'formato', titulo: 'Formato e categorias definidos', fase: 'desenho', diasAntes: 45,
    detalhe: 'Quantas duplas por categoria, chave ou eliminatória, tempo por jogo.',
  },
  {
    id: 'grade-simulada', titulo: 'Grade simulada: cabe no dia?', fase: 'desenho', diasAntes: 45,
    detalhe: 'Jogos × duração ÷ quadras disponíveis. É a conta que evita a final às 23h — o erro '
      + 'que mais destrói reputação de organizador, porque atinge justamente os finalistas.',
  },
  {
    id: 'orcamento', titulo: 'Orçamento fechado e ponto de equilíbrio calculado', fase: 'desenho', diasAntes: 45,
    detalhe: 'Quantas inscrições pagam o evento. O app faz essa conta na aba de Finanças.',
  },
  {
    id: 'preco', titulo: 'Preço, lotes e política de reembolso escritos', fase: 'desenho', diasAntes: 40,
    detalhe: 'Reembolso indefinido vira discussão individual na véspera, sempre.',
  },
  {
    id: 'regulamento', titulo: 'Regulamento publicado', fase: 'desenho', diasAntes: 35,
    detalhe: 'Critério de desempate, WO, atraso, troca de atleta. Regra escrita antes é regra; '
      + 'regra escrita depois da polêmica é opinião.',
  },

  // ── Venda ───────────────────────────────────────────────────────────────
  {
    id: 'plataforma', titulo: 'Inscrição no ar e testada com pagamento real', fase: 'venda', diasAntes: 30,
    detalhe: 'Faça uma inscrição de verdade e estorne. Link quebrado no dia do anúncio custa o pico.',
  },
  {
    id: 'anuncio', titulo: 'Anúncio de abertura publicado', fase: 'venda', diasAntes: 30,
    detalhe: 'Post, story e o grupo de quem jogou a edição passada — nessa ordem de importância.',
  },
  {
    id: 'convites', titulo: 'Convite direto para quem jogou a última edição', fase: 'venda', diasAntes: 30,
    detalhe: 'Mensagem individual converte muito acima de post. É a lista mais valiosa que existe, '
      + 'e ela só existe se você tiver guardado.',
  },
  {
    id: 'cotas', titulo: 'Propostas de cota enviadas aos prioritários', fase: 'venda', diasAntes: 30,
    detalhe: 'Cota entra no funil, com valor e previsão de entrada — é o que faz a projeção de '
      + 'caixa saber que ela existe.',
  },
  {
    id: 'lote', titulo: 'Prazo do primeiro lote anunciado com data', fase: 'venda', diasAntes: 25,
    detalhe: 'Sem data, não há motivo para se inscrever hoje. Prazo é o que move inscrição.',
  },
  {
    id: 'meta-inscricao', titulo: 'Conferir inscrições contra o ponto de equilíbrio', fase: 'venda', diasAntes: 20,
    detalhe: 'É aqui que ainda dá para reagir: reduzir custo, ativar convite ou cancelar barato.',
  },

  // ── Contratação ─────────────────────────────────────────────────────────
  {
    id: 'arbitragem', titulo: 'Arbitragem contratada e confirmada por escrito', fase: 'operacao', diasAntes: 14,
    detalhe: 'Nome, horário de chegada e valor combinado, na mensagem. Falta de árbitro no sábado '
      + 'não tem plano B.',
  },
  {
    id: 'premiacao', titulo: 'Premiação encomendada', fase: 'operacao', diasAntes: 14,
    detalhe: 'Com prazo de entrega para três dias antes, não para a véspera. Troféu é o item que '
      + 'mais atrasa e o mais visível quando falta.',
  },
  {
    id: 'estrutura', titulo: 'Som, tenda, mesa, cadeiras e gelo contratados', fase: 'operacao', diasAntes: 14,
  },
  {
    id: 'saude', titulo: 'Primeiros socorros definidos', fase: 'operacao', diasAntes: 14,
    detalhe: 'Kit, responsável e o hospital mais próximo anotado. Confira se a arena ou o município '
      + 'exigem ambulância — descobrir isso na véspera é caro.',
  },
  {
    id: 'bolas', titulo: 'Bolas conferidas: quantidade e estado', fase: 'operacao', diasAntes: 14,
  },
  {
    id: 'midia', titulo: 'Fotógrafo e cobertura confirmados', fase: 'operacao', diasAntes: 14,
    detalhe: 'Sem foto não há prestação de contas de patrocínio nem material para a próxima edição. '
      + 'É investimento em venda, não em vaidade.',
  },
  {
    id: 'kit', titulo: 'Kit do atleta fechado com os tamanhos', fase: 'operacao', diasAntes: 12,
  },
  {
    id: 'mesa', titulo: 'Material de mesa separado', fase: 'operacao', diasAntes: 10,
    detalhe: 'Súmulas, canetas, placar, cronômetro, extensão, fita.',
  },

  // ── Semana do evento ────────────────────────────────────────────────────
  {
    id: 'chaveamento', titulo: 'Chaveamento gerado e conferido', fase: 'semana', diasAntes: 5,
    detalhe: 'Confira duplas repetidas, categoria errada e quem pagou. Erro de chave aparece na '
      + 'frente de todo mundo.',
  },
  {
    id: 'grade-publicada', titulo: 'Grade de horários publicada por categoria', fase: 'semana', diasAntes: 4,
    detalhe: 'Atleta que sabe a hora chega na hora, e a grade não atrasa.',
  },
  {
    id: 'briefing', titulo: 'Briefing enviado aos atletas', fase: 'semana', diasAntes: 3,
    detalhe: 'Local com link do mapa, estacionamento, horário de chegada, o que levar, regras que '
      + 'costumam gerar dúvida.',
  },
  {
    id: 'escala', titulo: 'Escala da equipe com horário de chegada', fase: 'semana', diasAntes: 3,
    detalhe: 'Nome ao lado da função. "A gente se vira" é como o organizador acaba fazendo tudo e '
      + 'não vê o próprio evento.',
  },
  {
    id: 'ativacao', titulo: 'Ativação dos patrocinadores combinada', fase: 'semana', diasAntes: 3,
    detalhe: 'Onde entra cada banner, quem traz, quem monta, e o que a marca quer que aconteça.',
  },
  {
    id: 'plano-chuva', titulo: 'Plano de chuva escrito', fase: 'semana', diasAntes: 3,
    detalhe: 'O que acontece com a grade, com o reembolso e com a comunicação. Decidir isso '
      + 'molhado, no sábado, é decidir mal.',
  },

  // ── Véspera ─────────────────────────────────────────────────────────────
  {
    id: 'quadra', titulo: 'Quadra preparada: areia, redes, marcação', fase: 'vespera', diasAntes: 1,
  },
  {
    id: 'carregar', titulo: 'Material separado e carregado', fase: 'vespera', diasAntes: 1,
  },
  {
    id: 'troco', titulo: 'Troco e maquininha testada', fase: 'vespera', diasAntes: 1,
    detalhe: 'Sempre aparece inscrição no dia, e sempre em dinheiro ou cartão.',
  },
  {
    id: 'bateria', titulo: 'Tudo carregado: som, câmera, celular, power bank', fase: 'vespera', diasAntes: 1,
  },
  {
    id: 'confirmacao', titulo: 'Confirmação final com arbitragem e fornecedores', fase: 'vespera', diasAntes: 1,
    detalhe: 'Uma mensagem de duas linhas na véspera evita a maioria dos sumiços.',
  },

  // ── No dia ──────────────────────────────────────────────────────────────
  {
    id: 'checagem', titulo: 'Checagem 90 minutos antes', fase: 'dia', diasAntes: 0,
    detalhe: 'Rede na altura, marcação, som, mesa montada, banners no lugar.',
  },
  {
    id: 'credenciamento', titulo: 'Credenciamento com conferência de pagamento', fase: 'dia', diasAntes: 0,
  },
  {
    id: 'foto-cotas', titulo: 'Foto de cada banner no lugar', fase: 'dia', diasAntes: 0,
    detalhe: 'É a prova de entrega da cota. Sem ela, a renovação vira conversa de confiança, e '
      + 'confiança não sobrevive à troca de gerente de marketing.',
  },
  {
    id: 'resultados', titulo: 'Resultados registrados durante o dia', fase: 'dia', diasAntes: 0,
    detalhe: 'Depois, ninguém lembra dos placares — e sem placar não há conteúdo na segunda-feira.',
  },
  {
    id: 'podio', titulo: 'Premiação com foto de todos os pódios', fase: 'dia', diasAntes: 0,
  },

  // ── Depois ──────────────────────────────────────────────────────────────
  {
    id: 'prestacao', titulo: 'Prestação de contas: real contra o orçado', fase: 'depois', diasAntes: -2,
    detalhe: 'Lance receita e custo do evento na frente certa, no app. É isso que faz a próxima '
      + 'edição ser orçada com número em vez de memória.',
  },
  {
    id: 'relatorio', titulo: 'Relatório entregue aos patrocinadores', fase: 'depois', diasAntes: -3,
    detalhe: 'Fotos, número de atletas, alcance, presença da marca. Entregue sem ser pedido, em até '
      + 'uma semana. É o que transforma cota de edição em cota de temporada.',
  },
  {
    id: 'album', titulo: 'Álbum e vídeo publicados', fase: 'depois', diasAntes: -5,
    detalhe: 'Enquanto o assunto ainda está quente. É também o material de venda da próxima edição.',
  },
  {
    id: 'pesquisa', titulo: 'Pesquisa curta com os atletas', fase: 'depois', diasAntes: -5,
    detalhe: 'Três perguntas, não dez. O que mais gostou, o que mudaria, voltaria.',
  },
  {
    id: 'lista', titulo: 'Lista de inscritos guardada para a próxima edição', fase: 'depois', diasAntes: -7,
    detalhe: 'É o ativo mais valioso que um torneio produz, e o mais fácil de perder.',
  },
];
