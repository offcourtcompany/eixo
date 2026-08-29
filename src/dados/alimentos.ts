/**
 * Tabela de alimentos — a comida do seu dia, não um banco de dados universal.
 *
 * São cerca de 140 itens escolhidos por frequência real: o que se come em
 * Salvador, na arena, na marmita e na madrugada. Uma tabela de 600 entradas
 * pareceria mais completa e seria pior — mais busca para achar o que você quer,
 * e mais chance de valor errado em item que ninguém confere.
 *
 * **Os números são referência, não medida.** Todos por 100 g (ou 100 ml nos
 * líquidos), e o preparo muda tudo: o mesmo peito de frango vai de 165 a 240
 * kcal dependendo do óleo da frigideira, e a marmita do restaurante nunca é
 * igual à de casa. Erro de 10% a 20% é normal e não atrapalha a decisão —
 * atrapalharia se você tratasse isso como balança de precisão.
 *
 * Quando o rótulo do produto disser outra coisa, o rótulo ganha: cadastre o seu
 * próprio alimento com o valor de lá.
 */
export interface Alimento {
  nome: string;
  grupo: string;
  /** Por 100 g, ou 100 ml quando `liquido`. */
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
  /** Medidas práticas. A primeira é a que a tela sugere primeiro. */
  porcoes: { nome: string; g: number }[];
  liquido?: boolean;
}

// Medidas caseiras que se repetem, para a tabela não virar um muro de texto.
const CONCHA = { nome: '1 concha', g: 120 };
const COLHER = { nome: '1 colher de sopa', g: 20 };
const ESCUMADEIRA = { nome: '1 escumadeira', g: 90 };
const FILE = { nome: '1 filé médio', g: 120 };
const PALMA = { nome: '1 palma', g: 100 };
const COPO = { nome: '1 copo (200 ml)', g: 200 };
const COPO_AMERICANO = { nome: '1 copo americano (150 ml)', g: 150 };
const UNIDADE = (g: number, nome = '1 unidade') => ({ nome, g });
const CEM = { nome: '100 g', g: 100 };

export const ALIMENTOS: Alimento[] = [
  // ─────────────── Arroz, massa, pão e raízes ───────────────
  { nome: 'Arroz branco cozido', grupo: 'Cereais', kcal: 128, proteina: 2.5, carbo: 28.1, gordura: 0.2, porcoes: [ESCUMADEIRA, CONCHA, CEM] },
  { nome: 'Arroz integral cozido', grupo: 'Cereais', kcal: 124, proteina: 2.6, carbo: 25.8, gordura: 1.0, porcoes: [ESCUMADEIRA, CONCHA, CEM] },
  { nome: 'Macarrão cozido', grupo: 'Cereais', kcal: 140, proteina: 5.0, carbo: 28.0, gordura: 0.8, porcoes: [{ nome: '1 pegador', g: 130 }, CEM] },
  { nome: 'Macarrão instantâneo preparado', grupo: 'Cereais', kcal: 190, proteina: 4.3, carbo: 25.0, gordura: 8.0, porcoes: [UNIDADE(85, '1 pacote')] },
  { nome: 'Pão francês', grupo: 'Pães', kcal: 300, proteina: 8.0, carbo: 58.6, gordura: 3.1, porcoes: [UNIDADE(50, '1 pão'), UNIDADE(25, '1/2 pão')] },
  { nome: 'Pão de forma branco', grupo: 'Pães', kcal: 270, proteina: 8.0, carbo: 49.0, gordura: 3.5, porcoes: [UNIDADE(25, '1 fatia'), UNIDADE(50, '2 fatias')] },
  { nome: 'Pão de forma integral', grupo: 'Pães', kcal: 253, proteina: 9.4, carbo: 43.0, gordura: 3.7, porcoes: [UNIDADE(25, '1 fatia'), UNIDADE(50, '2 fatias')] },
  { nome: 'Pão de queijo', grupo: 'Pães', kcal: 330, proteina: 5.0, carbo: 38.0, gordura: 17.0, porcoes: [UNIDADE(30, '1 unidade pequena'), UNIDADE(60, '1 unidade grande')] },
  { nome: 'Tapioca (goma hidratada)', grupo: 'Cereais', kcal: 240, proteina: 0.3, carbo: 59.0, gordura: 0.1, porcoes: [UNIDADE(60, '1 tapioca fina'), UNIDADE(100, '1 tapioca grande')] },
  { nome: 'Cuscuz de milho cozido', grupo: 'Cereais', kcal: 113, proteina: 2.2, carbo: 25.3, gordura: 0.5, porcoes: [{ nome: '1 fatia', g: 120 }, CEM] },
  { nome: 'Aveia em flocos', grupo: 'Cereais', kcal: 394, proteina: 13.9, carbo: 66.6, gordura: 8.5, porcoes: [COLHER, { nome: '3 colheres', g: 60 }] },
  { nome: 'Granola', grupo: 'Cereais', kcal: 440, proteina: 9.0, carbo: 65.0, gordura: 15.0, porcoes: [COLHER, { nome: '3 colheres', g: 60 }] },
  { nome: 'Farofa pronta', grupo: 'Cereais', kcal: 400, proteina: 3.0, carbo: 65.0, gordura: 14.0, porcoes: [COLHER] },
  { nome: 'Batata inglesa cozida', grupo: 'Raízes', kcal: 52, proteina: 1.2, carbo: 11.9, gordura: 0.1, porcoes: [UNIDADE(150, '1 batata média'), CEM] },
  { nome: 'Batata frita', grupo: 'Raízes', kcal: 312, proteina: 4.0, carbo: 39.0, gordura: 15.0, porcoes: [{ nome: 'porção pequena', g: 100 }, { nome: 'porção de bar', g: 250 }] },
  { nome: 'Purê de batata', grupo: 'Raízes', kcal: 110, proteina: 2.0, carbo: 16.0, gordura: 4.0, porcoes: [ESCUMADEIRA, CEM] },
  { nome: 'Batata doce cozida', grupo: 'Raízes', kcal: 77, proteina: 0.6, carbo: 18.4, gordura: 0.1, porcoes: [UNIDADE(150, '1 batata média'), CEM] },
  { nome: 'Mandioca cozida', grupo: 'Raízes', kcal: 125, proteina: 0.6, carbo: 30.1, gordura: 0.3, porcoes: [{ nome: '1 pedaço', g: 100 }] },
  { nome: 'Inhame cozido', grupo: 'Raízes', kcal: 97, proteina: 1.5, carbo: 23.2, gordura: 0.1, porcoes: [CEM] },
  { nome: 'Milho verde cozido', grupo: 'Cereais', kcal: 98, proteina: 3.2, carbo: 17.1, gordura: 1.0, porcoes: [UNIDADE(90, '1 espiga'), COLHER] },

  // ─────────────── Feijões e leguminosas ───────────────
  { nome: 'Feijão carioca cozido', grupo: 'Leguminosas', kcal: 76, proteina: 4.8, carbo: 13.6, gordura: 0.5, porcoes: [CONCHA, { nome: '1/2 concha', g: 60 }] },
  { nome: 'Feijão preto cozido', grupo: 'Leguminosas', kcal: 77, proteina: 4.5, carbo: 14.0, gordura: 0.5, porcoes: [CONCHA, { nome: '1/2 concha', g: 60 }] },
  { nome: 'Feijoada', grupo: 'Leguminosas', kcal: 118, proteina: 8.0, carbo: 7.0, gordura: 6.0, porcoes: [CONCHA] },
  { nome: 'Lentilha cozida', grupo: 'Leguminosas', kcal: 93, proteina: 6.3, carbo: 16.3, gordura: 0.5, porcoes: [CONCHA] },
  { nome: 'Grão-de-bico cozido', grupo: 'Leguminosas', kcal: 121, proteina: 8.4, carbo: 18.0, gordura: 2.1, porcoes: [CONCHA] },
  { nome: 'Ervilha cozida', grupo: 'Leguminosas', kcal: 81, proteina: 5.4, carbo: 14.5, gordura: 0.4, porcoes: [COLHER, CEM] },
  { nome: 'Soja texturizada hidratada', grupo: 'Leguminosas', kcal: 90, proteina: 13.0, carbo: 7.0, gordura: 0.5, porcoes: [CEM] },

  // ─────────────── Carnes ───────────────
  { nome: 'Peito de frango grelhado', grupo: 'Carnes', kcal: 165, proteina: 31.0, carbo: 0, gordura: 3.6, porcoes: [FILE, PALMA, { nome: '2 palmas', g: 200 }] },
  { nome: 'Frango assado com pele', grupo: 'Carnes', kcal: 215, proteina: 27.0, carbo: 0, gordura: 11.0, porcoes: [{ nome: '1 sobrecoxa', g: 110 }, PALMA] },
  { nome: 'Coxa de frango cozida sem pele', grupo: 'Carnes', kcal: 175, proteina: 26.0, carbo: 0, gordura: 7.5, porcoes: [UNIDADE(80, '1 coxa'), PALMA] },
  { nome: 'Frango desfiado', grupo: 'Carnes', kcal: 165, proteina: 30.0, carbo: 0, gordura: 4.0, porcoes: [COLHER, PALMA] },
  { nome: 'Carne moída (patinho) refogada', grupo: 'Carnes', kcal: 212, proteina: 26.0, carbo: 0, gordura: 12.0, porcoes: [ESCUMADEIRA, PALMA] },
  { nome: 'Bife de alcatra grelhado', grupo: 'Carnes', kcal: 220, proteina: 32.0, carbo: 0, gordura: 10.0, porcoes: [{ nome: '1 bife', g: 130 }, PALMA] },
  { nome: 'Contrafilé grelhado', grupo: 'Carnes', kcal: 250, proteina: 29.0, carbo: 0, gordura: 15.0, porcoes: [{ nome: '1 bife', g: 130 }, PALMA] },
  { nome: 'Picanha assada', grupo: 'Carnes', kcal: 290, proteina: 26.0, carbo: 0, gordura: 21.0, porcoes: [{ nome: '2 fatias', g: 150 }, PALMA] },
  { nome: 'Costela bovina assada', grupo: 'Carnes', kcal: 330, proteina: 24.0, carbo: 0, gordura: 26.0, porcoes: [PALMA] },
  { nome: 'Carne de panela / cozida', grupo: 'Carnes', kcal: 220, proteina: 28.0, carbo: 0, gordura: 12.0, porcoes: [{ nome: '1 pedaço', g: 100 }, ESCUMADEIRA] },
  { nome: 'Lombo suíno assado', grupo: 'Carnes', kcal: 210, proteina: 29.0, carbo: 0, gordura: 10.0, porcoes: [PALMA] },
  { nome: 'Linguiça calabresa', grupo: 'Carnes', kcal: 300, proteina: 16.0, carbo: 2.0, gordura: 25.0, porcoes: [UNIDADE(60, '1 gomo'), CEM] },
  { nome: 'Bacon frito', grupo: 'Carnes', kcal: 540, proteina: 30.0, carbo: 0, gordura: 46.0, porcoes: [UNIDADE(15, '1 fatia'), { nome: '3 fatias', g: 45 }] },
  { nome: 'Presunto', grupo: 'Carnes', kcal: 140, proteina: 17.0, carbo: 2.0, gordura: 7.0, porcoes: [UNIDADE(15, '1 fatia'), { nome: '3 fatias', g: 45 }] },
  { nome: 'Peito de peru defumado', grupo: 'Carnes', kcal: 105, proteina: 18.0, carbo: 2.0, gordura: 2.5, porcoes: [UNIDADE(15, '1 fatia'), { nome: '3 fatias', g: 45 }] },
  { nome: 'Hambúrguer bovino grelhado', grupo: 'Carnes', kcal: 240, proteina: 20.0, carbo: 2.0, gordura: 17.0, porcoes: [UNIDADE(90, '1 hambúrguer')] },

  // ─────────────── Peixes e frutos do mar ───────────────
  { nome: 'Tilápia grelhada', grupo: 'Peixes', kcal: 128, proteina: 26.0, carbo: 0, gordura: 2.7, porcoes: [FILE, PALMA] },
  { nome: 'Salmão grelhado', grupo: 'Peixes', kcal: 208, proteina: 22.0, carbo: 0, gordura: 13.0, porcoes: [FILE, PALMA] },
  { nome: 'Sardinha em lata (óleo, escorrida)', grupo: 'Peixes', kcal: 208, proteina: 25.0, carbo: 0, gordura: 11.5, porcoes: [UNIDADE(85, '1 lata')] },
  { nome: 'Atum em lata (água, escorrido)', grupo: 'Peixes', kcal: 116, proteina: 26.0, carbo: 0, gordura: 1.0, porcoes: [UNIDADE(120, '1 lata'), UNIDADE(60, '1/2 lata')] },
  { nome: 'Atum em lata (óleo, escorrido)', grupo: 'Peixes', kcal: 198, proteina: 25.0, carbo: 0, gordura: 10.0, porcoes: [UNIDADE(120, '1 lata')] },
  { nome: 'Camarão cozido', grupo: 'Peixes', kcal: 99, proteina: 21.0, carbo: 0.2, gordura: 1.0, porcoes: [PALMA] },
  { nome: 'Moqueca de peixe', grupo: 'Peixes', kcal: 145, proteina: 13.0, carbo: 3.0, gordura: 9.0, porcoes: [CONCHA] },
  { nome: 'Bacalhau cozido', grupo: 'Peixes', kcal: 136, proteina: 29.0, carbo: 0, gordura: 1.0, porcoes: [PALMA] },

  // ─────────────── Ovos e laticínios ───────────────
  { nome: 'Ovo cozido', grupo: 'Ovos', kcal: 146, proteina: 13.3, carbo: 0.6, gordura: 9.5, porcoes: [UNIDADE(50, '1 ovo'), UNIDADE(100, '2 ovos'), UNIDADE(150, '3 ovos')] },
  { nome: 'Ovo frito', grupo: 'Ovos', kcal: 240, proteina: 14.0, carbo: 0.6, gordura: 20.0, porcoes: [UNIDADE(50, '1 ovo'), UNIDADE(100, '2 ovos')] },
  { nome: 'Ovo mexido', grupo: 'Ovos', kcal: 200, proteina: 13.0, carbo: 1.0, gordura: 15.0, porcoes: [UNIDADE(110, '2 ovos'), UNIDADE(165, '3 ovos')] },
  { nome: 'Clara de ovo', grupo: 'Ovos', kcal: 52, proteina: 11.0, carbo: 0.7, gordura: 0.2, porcoes: [UNIDADE(33, '1 clara'), UNIDADE(99, '3 claras')] },
  { nome: 'Omelete de queijo', grupo: 'Ovos', kcal: 230, proteina: 15.0, carbo: 2.0, gordura: 18.0, porcoes: [UNIDADE(150, '1 omelete de 3 ovos')] },
  { nome: 'Leite integral', grupo: 'Laticínios', kcal: 61, proteina: 3.2, carbo: 4.7, gordura: 3.3, liquido: true, porcoes: [COPO, COPO_AMERICANO, { nome: '500 ml', g: 500 }] },
  { nome: 'Leite desnatado', grupo: 'Laticínios', kcal: 35, proteina: 3.4, carbo: 5.0, gordura: 0.2, liquido: true, porcoes: [COPO, { nome: '500 ml', g: 500 }] },
  { nome: 'Leite em pó integral', grupo: 'Laticínios', kcal: 497, proteina: 26.0, carbo: 38.0, gordura: 27.0, porcoes: [COLHER, { nome: '2 colheres', g: 40 }] },
  { nome: 'Iogurte natural integral', grupo: 'Laticínios', kcal: 61, proteina: 3.5, carbo: 4.7, gordura: 3.3, porcoes: [UNIDADE(170, '1 pote'), { nome: '1 pote grande', g: 500 }] },
  { nome: 'Iogurte grego', grupo: 'Laticínios', kcal: 97, proteina: 9.0, carbo: 4.0, gordura: 5.0, porcoes: [UNIDADE(130, '1 pote')] },
  { nome: 'Iogurte de frutas adoçado', grupo: 'Laticínios', kcal: 85, proteina: 3.0, carbo: 14.0, gordura: 1.8, porcoes: [UNIDADE(170, '1 pote')] },
  { nome: 'Queijo minas frescal', grupo: 'Laticínios', kcal: 264, proteina: 17.4, carbo: 3.2, gordura: 20.0, porcoes: [{ nome: '1 fatia', g: 30 }, CEM] },
  { nome: 'Queijo muçarela', grupo: 'Laticínios', kcal: 330, proteina: 25.0, carbo: 2.0, gordura: 25.0, porcoes: [{ nome: '1 fatia', g: 20 }, { nome: '2 fatias', g: 40 }] },
  { nome: 'Queijo coalho', grupo: 'Laticínios', kcal: 305, proteina: 24.0, carbo: 2.0, gordura: 22.0, porcoes: [{ nome: '1 espeto', g: 80 }, CEM] },
  { nome: 'Queijo parmesão ralado', grupo: 'Laticínios', kcal: 430, proteina: 36.0, carbo: 4.0, gordura: 29.0, porcoes: [COLHER] },
  { nome: 'Requeijão cremoso', grupo: 'Laticínios', kcal: 257, proteina: 9.0, carbo: 3.0, gordura: 23.0, porcoes: [COLHER] },
  { nome: 'Manteiga', grupo: 'Gorduras', kcal: 717, proteina: 0.9, carbo: 0.1, gordura: 81.0, porcoes: [{ nome: '1 ponta de faca', g: 8 }, COLHER] },
  { nome: 'Margarina', grupo: 'Gorduras', kcal: 596, proteina: 0.2, carbo: 0.6, gordura: 67.0, porcoes: [{ nome: '1 ponta de faca', g: 8 }, COLHER] },

  // ─────────────── Frutas ───────────────
  { nome: 'Banana prata', grupo: 'Frutas', kcal: 98, proteina: 1.3, carbo: 26.0, gordura: 0.1, porcoes: [UNIDADE(70, '1 banana'), UNIDADE(140, '2 bananas')] },
  { nome: 'Maçã', grupo: 'Frutas', kcal: 56, proteina: 0.3, carbo: 15.2, gordura: 0.2, porcoes: [UNIDADE(130, '1 maçã')] },
  { nome: 'Mamão papaia', grupo: 'Frutas', kcal: 40, proteina: 0.5, carbo: 10.4, gordura: 0.1, porcoes: [UNIDADE(160, '1/2 mamão'), CEM] },
  { nome: 'Manga', grupo: 'Frutas', kcal: 64, proteina: 0.4, carbo: 16.7, gordura: 0.2, porcoes: [UNIDADE(150, '1 manga pequena')] },
  { nome: 'Laranja', grupo: 'Frutas', kcal: 45, proteina: 1.0, carbo: 11.5, gordura: 0.1, porcoes: [UNIDADE(130, '1 laranja')] },
  { nome: 'Melancia', grupo: 'Frutas', kcal: 33, proteina: 0.9, carbo: 8.1, gordura: 0.1, porcoes: [{ nome: '1 fatia', g: 200 }] },
  { nome: 'Abacaxi', grupo: 'Frutas', kcal: 48, proteina: 0.9, carbo: 12.3, gordura: 0.1, porcoes: [{ nome: '1 fatia', g: 100 }] },
  { nome: 'Uva', grupo: 'Frutas', kcal: 69, proteina: 0.7, carbo: 17.0, gordura: 0.2, porcoes: [{ nome: '1 cacho pequeno', g: 100 }] },
  { nome: 'Abacate', grupo: 'Frutas', kcal: 160, proteina: 2.0, carbo: 8.5, gordura: 15.0, porcoes: [{ nome: '1/2 abacate', g: 100 }, COLHER] },
  { nome: 'Açaí polpa pura', grupo: 'Frutas', kcal: 58, proteina: 0.8, carbo: 6.2, gordura: 3.9, porcoes: [{ nome: '100 g', g: 100 }] },
  { nome: 'Açaí batido com xarope', grupo: 'Lanches', kcal: 190, proteina: 1.2, carbo: 30.0, gordura: 7.0, liquido: true, porcoes: [{ nome: '300 ml', g: 300 }, { nome: '500 ml', g: 500 }] },
  { nome: 'Melão', grupo: 'Frutas', kcal: 34, proteina: 0.8, carbo: 8.2, gordura: 0.1, porcoes: [{ nome: '1 fatia', g: 150 }] },

  // ─────────────── Vegetais ───────────────
  { nome: 'Alface', grupo: 'Vegetais', kcal: 15, proteina: 1.4, carbo: 2.4, gordura: 0.2, porcoes: [{ nome: '1 prato de sobremesa', g: 60 }] },
  { nome: 'Tomate', grupo: 'Vegetais', kcal: 15, proteina: 1.1, carbo: 3.1, gordura: 0.2, porcoes: [UNIDADE(90, '1 tomate'), { nome: '3 fatias', g: 45 }] },
  { nome: 'Cenoura crua', grupo: 'Vegetais', kcal: 34, proteina: 1.3, carbo: 7.7, gordura: 0.2, porcoes: [UNIDADE(80, '1 cenoura'), COLHER] },
  { nome: 'Brócolis cozido', grupo: 'Vegetais', kcal: 25, proteina: 2.1, carbo: 4.4, gordura: 0.5, porcoes: [ESCUMADEIRA, CEM] },
  { nome: 'Couve refogada', grupo: 'Vegetais', kcal: 90, proteina: 2.5, carbo: 5.0, gordura: 7.0, porcoes: [ESCUMADEIRA] },
  { nome: 'Abobrinha refogada', grupo: 'Vegetais', kcal: 55, proteina: 1.1, carbo: 3.5, gordura: 4.0, porcoes: [ESCUMADEIRA] },
  { nome: 'Chuchu cozido', grupo: 'Vegetais', kcal: 19, proteina: 0.4, carbo: 4.8, gordura: 0.1, porcoes: [ESCUMADEIRA] },
  { nome: 'Pepino', grupo: 'Vegetais', kcal: 10, proteina: 0.9, carbo: 2.0, gordura: 0.1, porcoes: [UNIDADE(100, '1 pepino')] },
  { nome: 'Beterraba cozida', grupo: 'Vegetais', kcal: 32, proteina: 1.3, carbo: 7.2, gordura: 0.1, porcoes: [COLHER, CEM] },
  { nome: 'Cebola', grupo: 'Vegetais', kcal: 39, proteina: 1.7, carbo: 8.9, gordura: 0.1, porcoes: [UNIDADE(70, '1 cebola')] },
  { nome: 'Salada de folhas com tomate', grupo: 'Vegetais', kcal: 20, proteina: 1.2, carbo: 3.0, gordura: 0.3, porcoes: [{ nome: '1 prato', g: 120 }] },

  // ─────────────── Gorduras e castanhas ───────────────
  { nome: 'Azeite de oliva', grupo: 'Gorduras', kcal: 884, proteina: 0, carbo: 0, gordura: 100, porcoes: [{ nome: '1 fio', g: 5 }, COLHER] },
  { nome: 'Óleo de soja', grupo: 'Gorduras', kcal: 884, proteina: 0, carbo: 0, gordura: 100, porcoes: [{ nome: '1 colher de sopa', g: 14 }] },
  { nome: 'Castanha de caju', grupo: 'Gorduras', kcal: 570, proteina: 18.0, carbo: 29.0, gordura: 44.0, porcoes: [{ nome: '1 punhado', g: 30 }] },
  { nome: 'Castanha-do-pará', grupo: 'Gorduras', kcal: 660, proteina: 14.0, carbo: 12.0, gordura: 66.0, porcoes: [UNIDADE(5, '1 castanha'), { nome: '1 punhado', g: 30 }] },
  { nome: 'Amendoim torrado', grupo: 'Gorduras', kcal: 570, proteina: 26.0, carbo: 20.0, gordura: 44.0, porcoes: [{ nome: '1 punhado', g: 30 }] },
  { nome: 'Pasta de amendoim', grupo: 'Gorduras', kcal: 590, proteina: 25.0, carbo: 20.0, gordura: 48.0, porcoes: [COLHER] },
  { nome: 'Coco ralado', grupo: 'Gorduras', kcal: 406, proteina: 3.7, carbo: 10.4, gordura: 42.0, porcoes: [COLHER] },
  { nome: 'Maionese', grupo: 'Gorduras', kcal: 300, proteina: 0.6, carbo: 8.0, gordura: 30.0, porcoes: [COLHER] },

  // ─────────────── Bebidas ───────────────
  { nome: 'Água de coco', grupo: 'Bebidas', kcal: 22, proteina: 0.4, carbo: 5.3, gordura: 0.1, liquido: true, porcoes: [COPO, { nome: '1 caixinha (330 ml)', g: 330 }] },
  { nome: 'Suco de laranja natural', grupo: 'Bebidas', kcal: 45, proteina: 0.7, carbo: 10.4, gordura: 0.2, liquido: true, porcoes: [COPO, { nome: '300 ml', g: 300 }] },
  { nome: 'Refrigerante comum', grupo: 'Bebidas', kcal: 42, proteina: 0, carbo: 10.6, gordura: 0, liquido: true, porcoes: [{ nome: '1 lata (350 ml)', g: 350 }, { nome: '1 copo', g: 200 }] },
  { nome: 'Refrigerante zero', grupo: 'Bebidas', kcal: 0, proteina: 0, carbo: 0, gordura: 0, liquido: true, porcoes: [{ nome: '1 lata (350 ml)', g: 350 }] },
  { nome: 'Cerveja', grupo: 'Bebidas', kcal: 43, proteina: 0.5, carbo: 3.6, gordura: 0, liquido: true, porcoes: [{ nome: '1 lata (350 ml)', g: 350 }, { nome: '1 long neck (355 ml)', g: 355 }, { nome: '1 garrafa (600 ml)', g: 600 }] },
  { nome: 'Vinho tinto', grupo: 'Bebidas', kcal: 85, proteina: 0.1, carbo: 2.6, gordura: 0, liquido: true, porcoes: [{ nome: '1 taça (150 ml)', g: 150 }] },
  { nome: 'Destilado (vodca, whisky, cachaça)', grupo: 'Bebidas', kcal: 231, proteina: 0, carbo: 0, gordura: 0, liquido: true, porcoes: [{ nome: '1 dose (50 ml)', g: 50 }] },
  { nome: 'Caipirinha', grupo: 'Bebidas', kcal: 160, proteina: 0, carbo: 15.0, gordura: 0, liquido: true, porcoes: [{ nome: '1 copo (250 ml)', g: 250 }] },
  { nome: 'Café sem açúcar', grupo: 'Bebidas', kcal: 2, proteina: 0.1, carbo: 0.3, gordura: 0, liquido: true, porcoes: [{ nome: '1 xícara (150 ml)', g: 150 }] },
  { nome: 'Café com leite e açúcar', grupo: 'Bebidas', kcal: 60, proteina: 2.0, carbo: 8.0, gordura: 2.0, liquido: true, porcoes: [{ nome: '1 xícara (200 ml)', g: 200 }] },
  { nome: 'Isotônico', grupo: 'Bebidas', kcal: 25, proteina: 0, carbo: 6.0, gordura: 0, liquido: true, porcoes: [{ nome: '1 garrafa (500 ml)', g: 500 }] },
  { nome: 'Energético', grupo: 'Bebidas', kcal: 45, proteina: 0, carbo: 11.0, gordura: 0, liquido: true, porcoes: [{ nome: '1 lata (250 ml)', g: 250 }] },
  { nome: 'Vitamina de banana com leite', grupo: 'Bebidas', kcal: 90, proteina: 3.0, carbo: 14.0, gordura: 2.5, liquido: true, porcoes: [{ nome: '1 copo (300 ml)', g: 300 }] },

  // ─────────────── Lanches e preparações ───────────────
  { nome: 'Pizza de muçarela', grupo: 'Lanches', kcal: 270, proteina: 12.0, carbo: 30.0, gordura: 11.0, porcoes: [{ nome: '1 fatia', g: 100 }, { nome: '3 fatias', g: 300 }] },
  { nome: 'X-burguer', grupo: 'Lanches', kcal: 260, proteina: 13.0, carbo: 22.0, gordura: 13.0, porcoes: [UNIDADE(200, '1 lanche')] },
  { nome: 'X-tudo', grupo: 'Lanches', kcal: 290, proteina: 14.0, carbo: 20.0, gordura: 17.0, porcoes: [UNIDADE(300, '1 lanche')] },
  { nome: 'Sanduíche natural de frango', grupo: 'Lanches', kcal: 200, proteina: 12.0, carbo: 24.0, gordura: 6.0, porcoes: [UNIDADE(150, '1 sanduíche')] },
  { nome: 'Sanduíche de atum', grupo: 'Lanches', kcal: 195, proteina: 14.0, carbo: 22.0, gordura: 5.5, porcoes: [UNIDADE(150, '1 sanduíche')] },
  { nome: 'Coxinha', grupo: 'Lanches', kcal: 290, proteina: 8.0, carbo: 30.0, gordura: 15.0, porcoes: [UNIDADE(80, '1 coxinha')] },
  { nome: 'Pastel de carne', grupo: 'Lanches', kcal: 320, proteina: 9.0, carbo: 30.0, gordura: 18.0, porcoes: [UNIDADE(100, '1 pastel')] },
  { nome: 'Empada', grupo: 'Lanches', kcal: 330, proteina: 7.0, carbo: 33.0, gordura: 19.0, porcoes: [UNIDADE(80, '1 empada')] },
  { nome: 'Esfiha de carne', grupo: 'Lanches', kcal: 250, proteina: 10.0, carbo: 30.0, gordura: 10.0, porcoes: [UNIDADE(80, '1 esfiha')] },
  { nome: 'Acarajé', grupo: 'Lanches', kcal: 320, proteina: 8.0, carbo: 20.0, gordura: 23.0, porcoes: [UNIDADE(140, '1 acarajé')] },
  { nome: 'Marmita comum (arroz, feijão, carne, salada)', grupo: 'Lanches', kcal: 145, proteina: 9.0, carbo: 16.0, gordura: 5.0, porcoes: [{ nome: '1 marmita média', g: 450 }, { nome: '1 marmita grande', g: 600 }] },
  { nome: 'Biscoito recheado', grupo: 'Lanches', kcal: 470, proteina: 5.0, carbo: 70.0, gordura: 19.0, porcoes: [UNIDADE(30, '3 biscoitos'), { nome: '1 pacote', g: 130 }] },
  { nome: 'Biscoito de água e sal', grupo: 'Lanches', kcal: 430, proteina: 9.0, carbo: 70.0, gordura: 13.0, porcoes: [UNIDADE(25, '5 biscoitos')] },
  { nome: 'Chocolate ao leite', grupo: 'Lanches', kcal: 540, proteina: 7.0, carbo: 59.0, gordura: 30.0, porcoes: [{ nome: '1 barra pequena', g: 25 }, { nome: '1 barra grande', g: 90 }] },
  { nome: 'Sorvete de massa', grupo: 'Lanches', kcal: 200, proteina: 3.5, carbo: 24.0, gordura: 10.0, porcoes: [{ nome: '1 bola', g: 60 }, { nome: '2 bolas', g: 120 }] },
  { nome: 'Bolo simples', grupo: 'Lanches', kcal: 300, proteina: 5.0, carbo: 50.0, gordura: 9.0, porcoes: [{ nome: '1 fatia', g: 80 }] },
  { nome: 'Brigadeiro', grupo: 'Lanches', kcal: 400, proteina: 4.0, carbo: 60.0, gordura: 16.0, porcoes: [UNIDADE(20, '1 brigadeiro')] },
  { nome: 'Salgadinho de pacote', grupo: 'Lanches', kcal: 520, proteina: 6.0, carbo: 60.0, gordura: 28.0, porcoes: [{ nome: '1 pacote pequeno', g: 50 }] },
  { nome: 'Barra de cereal', grupo: 'Lanches', kcal: 380, proteina: 5.0, carbo: 70.0, gordura: 9.0, porcoes: [UNIDADE(25, '1 barra')] },
  { nome: 'Tapioca com queijo e ovo', grupo: 'Lanches', kcal: 220, proteina: 11.0, carbo: 28.0, gordura: 8.0, porcoes: [UNIDADE(180, '1 tapioca')] },

  // ─────────────── Suplementos e temperos ───────────────
  { nome: 'Whey protein (pó)', grupo: 'Suplementos', kcal: 380, proteina: 75.0, carbo: 8.0, gordura: 5.0, porcoes: [{ nome: '1 scoop (30 g)', g: 30 }, { nome: '2 scoops', g: 60 }] },
  { nome: 'Creatina', grupo: 'Suplementos', kcal: 0, proteina: 0, carbo: 0, gordura: 0, porcoes: [{ nome: '1 dose (5 g)', g: 5 }] },
  { nome: 'Albumina (pó)', grupo: 'Suplementos', kcal: 370, proteina: 80.0, carbo: 5.0, gordura: 1.0, porcoes: [{ nome: '1 dose (30 g)', g: 30 }] },
  { nome: 'Açúcar refinado', grupo: 'Outros', kcal: 387, proteina: 0, carbo: 100, gordura: 0, porcoes: [{ nome: '1 colher de chá', g: 5 }, COLHER] },
  { nome: 'Mel', grupo: 'Outros', kcal: 309, proteina: 0.3, carbo: 84.0, gordura: 0, porcoes: [COLHER] },
  { nome: 'Ketchup', grupo: 'Outros', kcal: 110, proteina: 1.2, carbo: 26.0, gordura: 0.2, porcoes: [COLHER] },
  { nome: 'Leite condensado', grupo: 'Outros', kcal: 321, proteina: 7.8, carbo: 57.0, gordura: 6.7, porcoes: [COLHER] },
];
