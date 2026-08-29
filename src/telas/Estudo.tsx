/**
 * Estudo — estante com tese, e prática de recuperação.
 *
 * Duas coisas separam isto de uma lista de livros. Cada item carrega **por que
 * ele**, ligado a uma pergunta que você já tem em aberto; estante sem tese é
 * lista de compras. E cada item pede a **aplicação** antes de ser terminado:
 * leitura de negócio que não vira ação é entretenimento caro.
 *
 * A revisão não é leitura de novo. É tentar lembrar antes de ver a resposta, com
 * o intervalo crescendo a cada acerto — ver de novo produz familiaridade, que é
 * confundida com domínio.
 */
import { useMemo, useState } from 'react';
import { Plus, Trash2, BookOpen, Brain, Check, X, Minus } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Estudo, Pergunta, TipoFonte, StatusEstudo } from '../tipos';
import { EIXOS } from '../tipos';
import { hoje, porcento } from '../formato';
import {
  estadoDoEstudo, paraRevisar, reagendar, abertosDemais, aproveitamento,
  type Resultado,
} from '../logica/estudo';
import { ESTUDOS_SUGERIDOS, PERGUNTAS_SUGERIDAS } from '../dados/estudos';
import { IDEIAS_SUGERIDAS } from '../dados/ideias';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, AreaTexto, Selecao,
  Folha, Vazio, Barra, Legenda, Aviso, Pilula,
} from '../componentes/ui';
import { BlocoIdeiaDoDia, ProgressoDeIdeias, FolhaDoMaterial } from '../componentes/Ideias';

export default function EstudoTela({ dados }: { dados: DadosApp }) {
  const estudos = dados.estudos.itens;
  const perguntas = dados.perguntas.itens;
  const estado = useMemo(() => estadoDoEstudo(estudos, perguntas), [estudos, perguntas]);

  const [revisando, setRevisando] = useState(false);
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Estudo | null>(null);
  const [material, setMaterial] = useState<Estudo | null>(null);

  function abrir(e: Estudo | null) { setEditando(e); setAberta(true); }

  async function semear() {
    const agora = new Date().toISOString();
    const porOrdem = new Map<number, string>();
    for (const e of ESTUDOS_SUGERIDOS) {
      const id = await dados.estudos.salvar({ ...e, criadoEm: agora });
      porOrdem.set(e.ordem, id);
    }
    for (const q of PERGUNTAS_SUGERIDAS) {
      const estudoId = porOrdem.get(q.ordemDoEstudo);
      if (!estudoId) continue;
      await dados.perguntas.salvar({
        estudoId,
        pergunta: q.pergunta,
        resposta: q.resposta,
        proximaEm: hoje(),
        intervalo: 0,
        acertos: 0,
        erros: 0,
        criadoEm: agora,
      });
    }
    // As ideias entram na mesma passada: sem elas, a estante volta a ser uma
    // lista de livros que ele já disse que não vai ler.
    const porEstudo = new Map<number, number>();
    for (const i of IDEIAS_SUGERIDAS) {
      const estudoId = porOrdem.get(i.ordemDoEstudo);
      if (!estudoId) continue;
      const ordem = (porEstudo.get(i.ordemDoEstudo) || 0) + 1;
      porEstudo.set(i.ordemDoEstudo, ordem);
      await dados.ideias.salvar({
        estudoId,
        titulo: i.titulo,
        conteudo: i.conteudo,
        aplicacao: i.aplicacao,
        ordem: i.ordemDoEstudo * 100 + ordem,
        estudada: false,
        criadoEm: agora,
      });
    }
  }

  if (!estudos.length) {
    return (
      <div className="space-y-6">
        <Cartao>
          <TituloSecao>Estudo</TituloSecao>
          <Vazio titulo="Estante vazia">
            Posso começar com treze materiais escolhidos para o que você está construindo — caixa,
            venda de cota, negócio que funciona sem o dono, e os métodos que este app já usa. Cada
            um vem com o motivo de estar na lista e com as ideias centrais já escritas: 52 ao todo,
            uma por dia, com o lugar onde cada uma encosta na arena, no torneio ou na dívida. Dá
            para estudar a estante inteira sem ler nenhum dos livros por completo.
          </Vazio>
          <div className="mt-3 flex gap-2">
            <Botao variante="secundario" className="flex-1" onClick={() => void semear()}>
              <BookOpen size={16} />Montar a estante
            </Botao>
            <Botao variante="fantasma" onClick={() => abrir(null)}>
              <Plus size={15} />Do zero
            </Botao>
          </div>
        </Cartao>
        <FormularioEstudo aberta={aberta} aoFechar={() => setAberta(false)}
          estudo={editando} dados={dados} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Cartao>
        <TituloSecao acao={
          <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Material</Botao>
        }>Estudo</TituloSecao>

        <div className="grid grid-cols-3 gap-3">
          <Metrica rotulo="Lendo agora" valor={String(estado.lendo.length)} tamanho="medio"
            cor={abertosDemais(estado) ? 'text-ouro' : 'text-creme'}
            detalhe={estado.fila.length + ' na fila'} />
          <Metrica rotulo="Terminados" valor={String(estado.lidos.length)} tamanho="medio"
            cor="text-verde" detalhe={estado.largados.length ? estado.largados.length + ' largados' : 'nenhum largado'} />
          <Metrica rotulo="Revisões" valor={String(estado.vencidas)} tamanho="medio"
            cor={estado.vencidas ? 'text-ouro' : 'text-verde'} detalhe="vencidas hoje" />
        </div>

        {abertosDemais(estado) && (
          <div className="mt-4">
            <Aviso>
              {estado.lendo.length} materiais abertos ao mesmo tempo. Ler três em paralelo é a forma
              educada de não terminar nenhum — escolha um, ponha os outros de volta na fila.
            </Aviso>
          </div>
        )}

        {estado.vencidas > 0 && (
          <div className="mt-4">
            <Botao variante="primario" className="w-full" onClick={() => setRevisando(true)}>
              <Brain size={16} />Revisar {estado.vencidas} pergunta(s)
            </Botao>
          </div>
        )}
      </Cartao>

      <BlocoIdeiaDoDia dados={dados} />

      {estado.lendo.length > 0 && (
        <BlocoDeLista titulo="Lendo agora" itens={estado.lendo} dados={dados} aoAbrir={abrir} aoAbrirIdeias={setMaterial} />
      )}
      <BlocoDeLista titulo="Fila" itens={estado.fila} dados={dados} aoAbrir={abrir} aoAbrirIdeias={setMaterial} />
      {estado.lidos.length > 0 && (
        <BlocoDeLista titulo="Terminados" itens={estado.lidos} dados={dados} aoAbrir={abrir} aoAbrirIdeias={setMaterial} />
      )}
      {estado.largados.length > 0 && (
        <BlocoDeLista titulo="Largados" itens={estado.largados} dados={dados} aoAbrir={abrir} aoAbrirIdeias={setMaterial} />
      )}

      <BlocoRevisao perguntas={perguntas} />

      <FolhaRevisao aberta={revisando} aoFechar={() => setRevisando(false)} dados={dados} />
      <FolhaDoMaterial aberta={Boolean(material)} aoFechar={() => setMaterial(null)}
        estudo={material} dados={dados} />
      <FormularioEstudo aberta={aberta} aoFechar={() => setAberta(false)}
        estudo={editando} dados={dados} />
    </div>
  );
}

function BlocoDeLista({
  titulo, itens, dados, aoAbrir, aoAbrirIdeias,
}: {
  titulo: string; itens: Estudo[]; dados: DadosApp;
  aoAbrir: (e: Estudo) => void; aoAbrirIdeias: (e: Estudo) => void;
}) {
  const perguntasDe = (id: string) => dados.perguntas.itens.filter((p) => p.estudoId === id).length;

  return (
    <Cartao>
      <TituloSecao acao={<span className="tabular text-sm text-suave">{itens.length}</span>}>
        {titulo}
      </TituloSecao>

      {!itens.length ? (
        <Legenda>Nada aqui.</Legenda>
      ) : (
        <div className="space-y-1">
          {itens.map((e) => (
            <div key={e.id} className="rounded-sm px-2 py-2.5">
              <button onClick={() => aoAbrir(e)} className="w-full text-left">
                <span className="flex items-start gap-2.5">
                  <i className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: EIXOS[e.eixo].cor }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{e.titulo}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-fraco">
                      {e.autor ? e.autor + ' · ' : ''}{e.trilha}
                      {perguntasDe(e.id) ? ' · ' + perguntasDe(e.id) + ' pergunta(s)' : ''}
                    </span>
                  </span>
                  {e.status === 'lendo' && e.progresso > 0 && (
                    <span className="tabular shrink-0 text-[12px] text-fraco">{e.progresso}%</span>
                  )}
                </span>
                {e.status === 'lendo' && (
                  <span className="mt-2 block"><Barra valor={e.progresso / 100} /></span>
                )}
                {e.porque && e.status !== 'lido' && (
                  <span className="mt-1.5 block text-[12px] leading-relaxed text-fraco">{e.porque}</span>
                )}
              </button>
              {/* As ideias embarcadas ficam num toque separado do cadastro: é
                  para estudar o conteúdo que ele vem aqui, não para editar
                  ficha de livro. */}
              <ProgressoDeIdeias dados={dados} estudo={e} aoAbrir={() => aoAbrirIdeias(e)} />
            </div>
          ))}
        </div>
      )}
    </Cartao>
  );
}

/** O histórico de revisão: quantas perguntas existem e como você tem ido. */
function BlocoRevisao({ perguntas }: { perguntas: Pergunta[] }) {
  const a = aproveitamento(perguntas);
  if (!perguntas.length) return null;

  return (
    <Cartao tom="calmo">
      <TituloSecao>Como a memória está</TituloSecao>
      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo="Perguntas" valor={String(perguntas.length)} tamanho="medio"
          detalhe="na rotação" />
        <Metrica rotulo="Tentativas" valor={String(a.tentativas)} tamanho="medio" cor="text-suave"
          detalhe={a.tentativas < 10 ? 'poucas ainda' : 'registradas'} />
        <Metrica rotulo="Acerto" tamanho="medio"
          valor={a.tentativas >= 10 ? porcento(a.taxa) : '—'}
          cor={a.tentativas < 10 ? 'text-fraco' : a.taxa >= 0.8 ? 'text-verde' : 'text-ouro'}
          detalhe={a.tentativas < 10 ? 'precisa de 10 tentativas' : 'das tentativas'} />
      </div>
      <div className="mt-4">
        <Legenda>
          Acerto muito alto significa que o intervalo está curto demais e você está revisando o que
          já sabe. Entre 70% e 85% é onde a revisão rende: difícil o bastante para fixar, fácil o
          bastante para não desanimar.
        </Legenda>
      </div>
    </Cartao>
  );
}

/** A revisão em si: pergunta, tentativa, resposta, e como foi. */
function FolhaRevisao({
  aberta, aoFechar, dados,
}: { aberta: boolean; aoFechar: () => void; dados: DadosApp }) {
  const [i, setI] = useState(0);
  const [revelada, setRevelada] = useState(false);
  const [chave, setChave] = useState(false);

  const fila = useMemo(() => paraRevisar(dados.perguntas.itens), [dados.perguntas.itens]);

  if (aberta && !chave) { setChave(true); setI(0); setRevelada(false); }
  if (!aberta && chave) setChave(false);

  const p = fila[i];
  const estudo = p ? dados.estudos.itens.find((e) => e.id === p.estudoId) : undefined;

  async function responder(r: Resultado) {
    if (!p) return;
    await dados.perguntas.salvar(reagendar(p, r));
    setRevelada(false);
    setI(i + 1);
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Revisão">
      {!p ? (
        <div className="space-y-4">
          <Aviso tom="bom">
            {i > 0 ? 'Revisão do dia terminada.' : 'Nada vencido para revisar agora.'}
          </Aviso>
          <Legenda>
            As perguntas voltam sozinhas quando o intervalo vence. Errou, volta amanhã; acertou, o
            intervalo estica. É assim que o tempo de revisão vai para o que ainda não está firme.
          </Legenda>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="rotulo text-fraco">{i + 1} de {fila.length}</span>
            {estudo && <Pilula>{estudo.titulo.slice(0, 28)}</Pilula>}
          </div>

          <p className="text-[16px] leading-relaxed text-creme">{p.pergunta}</p>

          {!revelada ? (
            <>
              <Legenda>
                Tente responder de cabeça, em voz alta ou escrevendo, antes de revelar. O esforço de
                puxar da memória é o que fixa — ler a resposta direto não vale quase nada.
              </Legenda>
              <Botao variante="secundario" className="w-full" onClick={() => setRevelada(true)}>
                Revelar resposta
              </Botao>
            </>
          ) : (
            <>
              <div className="rounded-sm border border-borda2 bg-superficie2 px-3.5 py-3">
                <p className="text-[14px] leading-relaxed text-suave">{p.resposta}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Botao variante="secundario" onClick={() => void responder('errei')}>
                  <X size={15} />Errei
                </Botao>
                <Botao variante="secundario" onClick={() => void responder('quase')}>
                  <Minus size={15} />Quase
                </Botao>
                <Botao variante="primario" onClick={() => void responder('acertei')}>
                  <Check size={15} />Acertei
                </Botao>
              </div>
              <Legenda>
                Seja honesto no "quase". Marcar acerto para acelerar a fila só faz a pergunta voltar
                daqui a um mês, quando você já não lembra de nada.
              </Legenda>
            </>
          )}
        </div>
      )}
    </Folha>
  );
}

function FormularioEstudo({
  aberta, aoFechar, estudo, dados,
}: { aberta: boolean; aoFechar: () => void; estudo: Estudo | null; dados: DadosApp }) {
  const [v, setV] = useState({
    titulo: '', autor: '', tipo: 'livro' as TipoFonte, trilha: '', porque: '',
    eixo: 'oficio' as Estudo['eixo'], status: 'fila' as StatusEstudo,
    progresso: 0, aplicacao: '', nota: '',
  });
  const [chave, setChave] = useState('');
  const [novaPergunta, setNovaPergunta] = useState({ pergunta: '', resposta: '' });

  const idAtual = estudo?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setV({
      titulo: estudo?.titulo || '', autor: estudo?.autor || '',
      tipo: estudo?.tipo || 'livro', trilha: estudo?.trilha || '',
      porque: estudo?.porque || '', eixo: estudo?.eixo || 'oficio',
      status: estudo?.status || 'fila', progresso: estudo?.progresso ?? 0,
      aplicacao: estudo?.aplicacao || '', nota: estudo?.nota || '',
    });
    setNovaPergunta({ pergunta: '', resposta: '' });
  }
  if (!aberta && chave) setChave('');

  const minhas = estudo
    ? dados.perguntas.itens.filter((p) => p.estudoId === estudo.id)
    : [];

  async function gravar() {
    await dados.estudos.salvar({
      id: estudo?.id,
      titulo: v.titulo.trim() || 'Material',
      autor: v.autor.trim() || undefined,
      tipo: v.tipo,
      trilha: v.trilha.trim() || 'Geral',
      porque: v.porque.trim(),
      eixo: v.eixo,
      status: v.status,
      progresso: Math.min(100, Math.max(0, v.progresso)),
      aplicacao: v.aplicacao.trim() || undefined,
      nota: v.nota.trim() || undefined,
      ordem: estudo?.ordem ?? dados.estudos.itens.length + 1,
      criadoEm: estudo?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  async function adicionarPergunta() {
    if (!estudo || !novaPergunta.pergunta.trim()) return;
    await dados.perguntas.salvar({
      estudoId: estudo.id,
      pergunta: novaPergunta.pergunta.trim(),
      resposta: novaPergunta.resposta.trim(),
      proximaEm: hoje(),
      intervalo: 0,
      acertos: 0,
      erros: 0,
      criadoEm: new Date().toISOString(),
    });
    setNovaPergunta({ pergunta: '', resposta: '' });
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={estudo ? 'Editar material' : 'Novo material'}>
      <div className="space-y-4">
        <Campo rotulo="Título">
          <Entrada value={v.titulo} onChange={(e) => setV({ ...v, titulo: e.target.value })}
            placeholder="O Mito do Empreendedor" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Autor">
            <Entrada value={v.autor} onChange={(e) => setV({ ...v, autor: e.target.value })}
              placeholder="Michael Gerber" />
          </Campo>
          <Campo rotulo="Tipo">
            <Selecao value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value as TipoFonte })}>
              {(['livro', 'curso', 'artigo', 'podcast', 'video'] as const).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Selecao>
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Trilha">
            <Entrada value={v.trilha} onChange={(e) => setV({ ...v, trilha: e.target.value })}
              placeholder="Vendas e patrocínio" />
          </Campo>
          <Campo rotulo="Eixo">
            <Selecao value={v.eixo}
              onChange={(e) => setV({ ...v, eixo: e.target.value as Estudo['eixo'] })}>
              {(Object.keys(EIXOS) as Estudo['eixo'][]).map((k) => (
                <option key={k} value={k}>{EIXOS[k].nome}</option>
              ))}
            </Selecao>
          </Campo>
        </div>

        <Campo rotulo="Por que este material"
          dica="Qual pergunta sua ele responde. Estante sem tese vira lista de compras.">
          <AreaTexto rows={2} value={v.porque}
            onChange={(e) => setV({ ...v, porque: e.target.value })} />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Situação">
            <Selecao value={v.status}
              onChange={(e) => setV({ ...v, status: e.target.value as StatusEstudo })}>
              <option value="fila">Na fila</option>
              <option value="lendo">Lendo agora</option>
              <option value="lido">Terminado</option>
              <option value="largado">Largado</option>
            </Selecao>
          </Campo>
          <Campo rotulo="Progresso (%)">
            <Entrada type="number" inputMode="numeric" min="0" max="100" value={String(v.progresso)}
              onChange={(e) => setV({ ...v, progresso: Number(e.target.value) || 0 })} />
          </Campo>
        </div>

        <Campo rotulo="O que eu vou fazer com isso"
          dica="Escreva antes de terminar. Leitura de negócio que não vira ação é entretenimento caro.">
          <AreaTexto rows={2} value={v.aplicacao}
            onChange={(e) => setV({ ...v, aplicacao: e.target.value })}
            placeholder="Reescrever a cota master usando a equação de valor" />
        </Campo>

        <Campo rotulo="Nota">
          <AreaTexto rows={2} value={v.nota} onChange={(e) => setV({ ...v, nota: e.target.value })}
            placeholder="O que ficou" />
        </Campo>

        {estudo && (
          <div className="border-t border-borda2 pt-4">
            <div className="rotulo mb-2 text-fraco">Perguntas de revisão · {minhas.length}</div>
            {minhas.length > 0 && (
              <div className="mb-3 space-y-1">
                {minhas.map((p) => (
                  <div key={p.id} className="flex items-start gap-2 rounded-sm px-2 py-1.5">
                    <span className="min-w-0 flex-1 text-[12px] leading-snug text-suave">{p.pergunta}</span>
                    <span className="tabular shrink-0 text-[11px] text-fraco">{p.intervalo}d</span>
                    <button onClick={() => void dados.perguntas.remover(p.id)} aria-label="Remover"
                      className="shrink-0 text-fraco transition-colors hover:text-perigo">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Entrada value={novaPergunta.pergunta}
                onChange={(e) => setNovaPergunta({ ...novaPergunta, pergunta: e.target.value })}
                placeholder="Pergunta — sem alternativas" />
              <AreaTexto rows={2} value={novaPergunta.resposta}
                onChange={(e) => setNovaPergunta({ ...novaPergunta, resposta: e.target.value })}
                placeholder="A resposta, para conferir depois de tentar" />
              <Botao variante="secundario" className="w-full"
                onClick={() => void adicionarPergunta()} disabled={!novaPergunta.pergunta.trim()}>
                <Plus size={15} />Adicionar pergunta
              </Botao>
            </div>
            <div className="mt-3">
              <Legenda>
                A melhor pergunta é a que você escreve com o livro fechado, sobre o que achou que
                usaria. Se não conseguir formulá-la, ainda não entendeu o capítulo.
              </Legenda>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!v.titulo.trim()}>Salvar</Botao>
          {estudo && (
            <Botao variante="perigo"
              onClick={() => { void dados.estudos.remover(estudo.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>
      </div>
    </Folha>
  );
}
