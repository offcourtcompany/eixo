/**
 * Eventos próprios e o ponto de equilíbrio de cada um.
 *
 * A tela é construída para uma frase caber na primeira olhada: **faltam N
 * inscrições para este evento se pagar.** Todo o resto — capital exposto,
 * cenários de ocupação, preço de equilíbrio — existe para dar contexto a esse
 * número, nunca para competir com ele.
 *
 * O aviso que mais vale aqui é o vermelho de "não fecha nem lotado". Ele muda a
 * conversa de "vender mais inscrição" para "cortar custo, vender cota ou subir
 * o preço", que é a única conversa que resolve um evento desenhado no
 * vermelho — e é a que ninguém tem porque o número nunca foi calculado.
 */
import { useMemo, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Circle, CircleCheck } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { PlanoEvento, CustoEvento } from '../tipos';
import { moeda, moedaCurta, porcento, numero, dataCurta } from '../formato';
import { analisar, precoDeEquilibrio, resumoDaTemporada, seguirOuCancelar } from '../logica/evento';
import {
  gerarChecklist, estadoDoChecklist, riscoDoEvento,
  type EstadoDoChecklist, type ItemComPrazo,
} from '../logica/checklist';
import { MODELO_TORNEIO } from '../dados/checklistTorneio';
import { EscolhaDeFrente } from './Frentes';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, Selecao, AreaTexto,
  Folha, Vazio, Barra, Aviso, Legenda, Pilula,
} from './ui';

const STATUS: Record<PlanoEvento['status'], string> = {
  rascunho: 'rascunho', confirmado: 'confirmado', realizado: 'realizado', cancelado: 'cancelado',
};

export function BlocoEventos({ dados }: { dados: DadosApp }) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<PlanoEvento | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const planos = dados.planos.itens;
  const temporada = useMemo(() => resumoDaTemporada(planos), [planos]);

  function abrir(p: PlanoEvento | null) { setEditando(p); setAberta(true); }

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Evento</Botao>
      }>Eventos próprios</TituloSecao>

      {!planos.length ? (
        <Vazio titulo="Nenhum evento orçado">
          Antes de abrir inscrição, existe um número que deveria estar escrito: quantas inscrições
          pagam o evento. Cadastre custo fixo, custo por inscrito, preço e capacidade — a conta sai
          sozinha, e às vezes ela diz que o evento não fecha nem lotado. É melhor descobrir isso
          agora do que na véspera.
        </Vazio>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Metrica rotulo="Capital exposto" valor={moedaCurta(temporada.capitalEmRisco)}
              cor={temporada.capitalEmRisco > 0 ? 'text-perigo' : 'text-verde'} tamanho="medio"
              detalhe="custo fixo sem cota assinada" />
            <Metrica rotulo="Resultado hoje" valor={moedaCurta(temporada.resultadoAgora)}
              cor={temporada.resultadoAgora < 0 ? 'text-perigo' : 'text-verde'} tamanho="medio"
              detalhe="com as inscrições que já entraram" />
            <Metrica rotulo="Se lotar tudo" valor={moedaCurta(temporada.resultadoLotado)}
              cor={temporada.resultadoLotado < 0 ? 'text-perigo' : 'text-verde'} tamanho="medio"
              detalhe="o teto da temporada" />
          </div>

          {temporada.impossiveis.length > 0 && (
            <div className="mt-4">
              <Aviso>
                {temporada.impossiveis.length === 1
                  ? <><b>{temporada.impossiveis[0].nome}</b> não fecha nem lotado.</>
                  : <><b>{temporada.impossiveis.length} eventos</b> não fecham nem lotados:{' '}
                    {temporada.impossiveis.map((p) => p.nome).join(', ')}.</>}
                {' '}Isso não é problema de divulgação — nenhuma campanha conserta orçamento. Ou o
                custo fixo cai, ou entra cota, ou o preço sobe.
              </Aviso>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {planos.map((p) => (
              <LinhaDoEvento key={p.id} plano={p} dados={dados}
                expandido={expandido === p.id}
                aoExpandir={() => setExpandido(expandido === p.id ? null : p.id)}
                aoEditar={() => abrir(p)} />
            ))}
          </div>
        </>
      )}

      <FormularioEvento aberta={aberta} aoFechar={() => setAberta(false)}
        plano={editando} dados={dados} />
    </Cartao>
  );
}

function LinhaDoEvento({
  plano, dados, expandido, aoExpandir, aoEditar,
}: {
  plano: PlanoEvento; dados: DadosApp; expandido: boolean;
  aoExpandir: () => void; aoEditar: () => void;
}) {
  const a = useMemo(() => analisar(plano), [plano]);
  const preco = useMemo(() => precoDeEquilibrio(plano), [plano]);
  const decisao = useMemo(() => seguirOuCancelar(plano), [plano]);
  const lista = useMemo(() => estadoDoChecklist(plano), [plano]);

  const pe = a.pontoDeEquilibrio;
  const peTexto = a.margemNegativa ? 'nunca' : pe === 0 ? 'já pago' : numero(pe);

  return (
    <div className="rounded-sm border border-borda2">
      <button onClick={aoExpandir}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-superficie2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] text-creme">{plano.nome}</span>
            <Pilula>{STATUS[plano.status]}</Pilula>
          </div>
          <div className="mt-1 text-[12px] text-fraco">
            {plano.data ? dataCurta(plano.data) + ' · ' : ''}
            {numero(plano.inscritos)} de {numero(plano.capacidade)} {plano.unidade}
            {plano.capacidade > 0 && ' · ' + porcento(plano.inscritos / plano.capacidade)}
          </div>
        </div>
        {lista.atrasados.length > 0 && (
          <span className="tabular shrink-0 text-[12px] text-perigo">
            {lista.atrasados.length} atrasado{lista.atrasados.length > 1 ? 's' : ''}
          </span>
        )}
        <div className="shrink-0 text-right">
          <div className="rotulo text-fraco">equilíbrio</div>
          <div className={'tabular text-[15px] ' + (a.impossivel ? 'text-perigo' : 'text-creme')}>
            {peTexto}
          </div>
        </div>
        {expandido ? <ChevronUp size={16} className="shrink-0 text-fraco" />
          : <ChevronDown size={16} className="shrink-0 text-fraco" />}
      </button>

      {/* A barra mostra as duas coisas na mesma régua: onde as inscrições estão
          e onde fica o ponto de equilíbrio. Enquanto o marcador estiver à
          frente da barra, o evento ainda não se paga. */}
      {plano.capacidade > 0 && (
        <div className="relative px-3.5 pb-3">
          <Barra valor={plano.inscritos / plano.capacidade}
            cor={a.faltamInscritos === 0 ? 'var(--color-verde)' : 'var(--color-creme)'} />
          {Number.isFinite(pe) && pe > 0 && pe <= plano.capacidade && (
            <div className="absolute bottom-3 h-1 w-[2px] bg-perigo"
              style={{ left: `calc(0.875rem + (100% - 1.75rem) * ${pe / plano.capacidade})` }} />
          )}
        </div>
      )}

      {expandido && (
        <div className="space-y-4 border-t border-borda2 px-3.5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metrica rotulo="Faltam" tamanho="medio"
              valor={a.margemNegativa ? '—' : numero(a.faltamInscritos)}
              cor={a.faltamInscritos > 0 ? 'text-creme' : 'text-verde'}
              detalhe={a.faltamInscritos > 0 ? plano.unidade + 's para pagar' : 'o evento já se paga'} />
            <Metrica rotulo="Ocupação necessária" tamanho="medio"
              valor={Number.isFinite(a.ocupacaoNecessaria) ? porcento(a.ocupacaoNecessaria) : '—'}
              cor={a.ocupacaoNecessaria > 0.8 ? 'text-perigo' : 'text-creme'}
              detalhe="da capacidade" />
            <Metrica rotulo="Margem por inscrição" tamanho="medio"
              valor={moedaCurta(a.margemContribuicao)}
              cor={a.margemContribuicao <= 0 ? 'text-perigo' : 'text-creme'}
              detalhe={'preço ' + moedaCurta(plano.precoInscricao) + ' − custo ' + moedaCurta(a.custoPorInscrito)} />
            <Metrica rotulo="Capital exposto" tamanho="medio"
              valor={moedaCurta(a.capitalEmRisco)}
              cor={a.capitalEmRisco > 0 ? 'text-perigo' : 'text-verde'}
              detalhe="antes de saber quantos vêm" />
          </div>

          <div>
            <div className="rotulo mb-2 text-fraco">Se lotar pela metade, três quartos, ou tudo</div>
            <div className="space-y-1">
              {a.cenarios.map((c) => (
                <div key={c.inscritos} className="flex items-center gap-3 text-[13px]">
                  <span className="tabular w-12 shrink-0 text-fraco">{porcento(c.ocupacao)}</span>
                  <span className="tabular w-16 shrink-0 text-suave">{numero(c.inscritos)}</span>
                  <span className="flex-1 text-fraco">{moedaCurta(c.receita)} − {moedaCurta(c.custo)}</span>
                  <span className={'tabular shrink-0 ' + (c.lucro < 0 ? 'text-perigo' : 'text-verde')}>
                    {c.lucro < 0 ? '−' : '+'}{moedaCurta(Math.abs(c.lucro))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {a.margemNegativa && (
            <Aviso>
              Cada inscrição custa <b>{moeda(a.custoPorInscrito)}</b> e é vendida por{' '}
              {moeda(plano.precoInscricao)}. Vender mais piora o resultado — este é o único caso em
              que lotar o evento é a pior notícia possível.
            </Aviso>
          )}

          {a.impossivel && !a.margemNegativa && (
            <Aviso>
              Lotado, este evento ainda perde <b>{moeda(a.patrocinioFaltante)}</b>. Para fechar sem
              mexer no custo, é esse o tamanho da cota que precisa entrar — ou{' '}
              {moeda(preco.preco)} por {plano.unidade} em vez de {moeda(plano.precoInscricao)}.
            </Aviso>
          )}

          {!a.impossivel && preco.diferenca > 0 && (
            <Aviso tom="info">
              A {porcento(0.8)} de ocupação — {numero(preco.inscritos)} {plano.unidade}s — o preço
              que empata é <b>{moeda(preco.preco)}</b>, {moeda(preco.diferenca)} acima do que você
              cobra. Você fecha por volume, não por preço: dá certo enquanto lota.
            </Aviso>
          )}

          {a.comprometido > 0 && (
            <Aviso tom="info">
              <b>{moeda(a.comprometido)}</b> já estão comprometidos e não voltam. Isso não entra na
              decisão de seguir ou cancelar — sai dos dois lados. O que decide é o que ainda dá
              para evitar: com {numero(decisao.inscritosEsperados)} {plano.unidade}s, realizar{' '}
              {decisao.valeRealizar ? 'rende' : 'custa'} {moeda(Math.abs(decisao.diferenca))}{' '}
              {decisao.valeRealizar ? 'a mais que cancelar' : 'a mais que cancelar'}.
            </Aviso>
          )}

          {(plano.patrocinioEmNegociacao || 0) > 0 && (
            <Legenda>
              {moeda(plano.patrocinioEmNegociacao || 0)} em negociação ficam de fora de todas as
              contas acima. Cota em conversa não paga arbitragem.
            </Legenda>
          )}

          <Checklist plano={plano} dados={dados} estado={lista} />

          <div className="flex justify-end">
            <Botao variante="secundario" onClick={aoEditar}>Editar orçamento</Botao>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A lista operacional.
 *
 * Ela abre no que está atrasado e no que vence em dez dias, e só isso — o resto
 * fica atrás de um toque. Checklist inteiro aberto é a forma mais rápida de
 * fazer alguém parar de usar checklist: quarenta itens de uma vez não pedem
 * ação, pedem paciência.
 */
function Checklist({
  plano, dados, estado,
}: { plano: PlanoEvento; dados: DadosApp; estado: EstadoDoChecklist }) {
  const [tudo, setTudo] = useState(false);
  const risco = riscoDoEvento(estado, plano);

  async function marcar(id: string, feita: boolean) {
    await dados.planos.salvar({
      ...plano,
      checklist: (plano.checklist || []).map((i) => (i.id === id
        ? { ...i, feita, feitaEm: feita ? new Date().toISOString() : undefined }
        : i)),
    });
  }

  if (!estado.total) {
    return (
      <div className="rounded-sm border border-borda2 p-3.5">
        <div className="rotulo mb-2 text-fraco">Checklist</div>
        <Legenda>
          {MODELO_TORNEIO.length} itens com prazo contado a partir da data do evento — da confirmação da
          quadra ao relatório do patrocinador. O que quebra torneio quase nunca é o que se esqueceu
          de planejar; é o que se lembrou tarde demais para resolver barato.
        </Legenda>
        <div className="mt-3">
          <Botao onClick={() => void dados.planos.salvar({ ...plano, checklist: gerarChecklist() })}>
            Criar o checklist
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-borda2 p-3.5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="rotulo text-fraco">Checklist</span>
        <span className="tabular text-[13px] text-suave">
          {numero(estado.feitas)} de {numero(estado.total)}
        </span>
      </div>
      <Barra valor={estado.progresso}
        cor={estado.progresso >= 1 ? 'var(--color-verde)' : 'var(--color-creme)'} />

      {risco && (
        <div className="mt-3">
          <Aviso tom={risco.tom}>{risco.texto}</Aviso>
        </div>
      )}

      {!tudo ? (
        <div className="mt-3 space-y-1">
          {estado.atrasados.map((i) => (
            <LinhaDoItem key={i.id} item={i} aoMarcar={(f) => void marcar(i.id, f)} />
          ))}
          {estado.agora.map((i) => (
            <LinhaDoItem key={i.id} item={i} aoMarcar={(f) => void marcar(i.id, f)} />
          ))}
          {!estado.atrasados.length && !estado.agora.length && (
            <Legenda>Nada vence nos próximos dez dias. Abra a lista inteira para ver o que vem.</Legenda>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {estado.porFase.map((g) => (
            <div key={g.fase}>
              <div className="rotulo mb-1.5 text-fraco">
                {g.nome} · {g.feitas}/{g.itens.length}
              </div>
              <div className="space-y-1">
                {g.itens.map((i) => (
                  <LinhaDoItem key={i.id} item={i} aoMarcar={(f) => void marcar(i.id, f)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setTudo(!tudo)}
        className="rotulo mt-3 text-fraco transition-colors hover:text-creme">
        {tudo ? 'mostrar só o que é agora' : 'ver a lista inteira'}
      </button>
    </div>
  );
}

function LinhaDoItem({
  item, aoMarcar,
}: { item: ItemComPrazo; aoMarcar: (feita: boolean) => void }) {
  return (
    <div className="flex items-start gap-2.5 rounded-sm px-1.5 py-1.5 transition-colors hover:bg-superficie2">
      <button onClick={() => aoMarcar(!item.feita)} aria-label={item.feita ? 'Desmarcar' : 'Marcar'}
        className="mt-0.5 shrink-0 text-fraco transition-colors hover:text-creme">
        {item.feita ? <CircleCheck size={16} className="text-verde" /> : <Circle size={16} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={'text-[13px] leading-snug ' + (item.feita ? 'text-fraco line-through' : 'text-creme')}>
          {item.titulo}
        </div>
        {item.detalhe && !item.feita && (
          <div className="mt-0.5 text-[12px] leading-snug text-fraco">{item.detalhe}</div>
        )}
      </div>
      {item.prazo && !item.feita && (
        <span className={'tabular shrink-0 text-[12px] ' + (item.atrasado ? 'text-perigo' : 'text-fraco')}>
          {dataCurta(item.prazo)}
        </span>
      )}
    </div>
  );
}

const custoVazio = (): CustoEvento => ({
  id: 'c' + Math.random().toString(36).slice(2, 8),
  nome: '', valor: 0, tipo: 'fixo',
});

function FormularioEvento({
  aberta, aoFechar, plano, dados,
}: { aberta: boolean; aoFechar: () => void; plano: PlanoEvento | null; dados: DadosApp }) {
  const [v, setV] = useState({
    nome: '', data: '', frenteId: undefined as string | undefined,
    precoInscricao: '', unidade: 'dupla', capacidade: '', inscritos: '',
    patrocinioContratado: '', patrocinioEmNegociacao: '', outrasReceitas: '',
    status: 'rascunho' as PlanoEvento['status'], nota: '',
  });
  const [custos, setCustos] = useState<CustoEvento[]>([]);
  const [chave, setChave] = useState('');

  const idAtual = plano?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setV({
      nome: plano?.nome || '',
      data: plano?.data || '',
      frenteId: plano?.frenteId,
      precoInscricao: plano ? String(plano.precoInscricao) : '',
      unidade: plano?.unidade || 'dupla',
      capacidade: plano ? String(plano.capacidade) : '',
      inscritos: plano ? String(plano.inscritos) : '0',
      patrocinioContratado: plano ? String(plano.patrocinioContratado) : '0',
      patrocinioEmNegociacao: plano?.patrocinioEmNegociacao ? String(plano.patrocinioEmNegociacao) : '',
      outrasReceitas: plano?.outrasReceitas ? String(plano.outrasReceitas) : '',
      status: plano?.status || 'rascunho',
      nota: plano?.nota || '',
    });
    setCustos(plano?.custos?.length ? plano.custos : [custoVazio()]);
  }
  if (!aberta && chave) setChave('');

  function mudarCusto(id: string, mudanca: Partial<CustoEvento>) {
    setCustos(custos.map((c) => (c.id === id ? { ...c, ...mudanca } : c)));
  }

  async function gravar() {
    await dados.planos.salvar({
      id: plano?.id,
      nome: v.nome.trim() || 'Evento',
      data: v.data || undefined,
      frenteId: v.frenteId,
      precoInscricao: Number(v.precoInscricao) || 0,
      unidade: v.unidade.trim() || 'dupla',
      capacidade: Number(v.capacidade) || 0,
      inscritos: Number(v.inscritos) || 0,
      patrocinioContratado: Number(v.patrocinioContratado) || 0,
      patrocinioEmNegociacao: Number(v.patrocinioEmNegociacao) || undefined,
      outrasReceitas: Number(v.outrasReceitas) || undefined,
      custos: custos.filter((c) => c.nome.trim() || c.valor > 0)
        .map((c) => ({ ...c, nome: c.nome.trim() || 'sem nome', valor: Number(c.valor) || 0 })),
      status: v.status,
      nota: v.nota.trim() || undefined,
      ordem: plano?.ordem ?? dados.planos.itens.length + 1,
      criadoEm: plano?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={plano ? plano.nome : 'Novo evento'}>
      <div className="space-y-4">
        <Campo rotulo="Nome">
          <Entrada value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })}
            placeholder="Desafio das Arenas — 2ª etapa" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data">
            <Entrada type="date" value={v.data} onChange={(e) => setV({ ...v, data: e.target.value })} />
          </Campo>
          <Campo rotulo="Situação">
            <Selecao value={v.status}
              onChange={(e) => setV({ ...v, status: e.target.value as PlanoEvento['status'] })}>
              {(Object.keys(STATUS) as PlanoEvento['status'][]).map((s) => (
                <option key={s} value={s}>{STATUS[s]}</option>
              ))}
            </Selecao>
          </Campo>
        </div>

        <EscolhaDeFrente frentes={dados.frentes.itens} valor={v.frenteId}
          aoMudar={(id) => setV({ ...v, frenteId: id })} rotulo="De qual frente" />

        <div className="grid grid-cols-3 gap-3">
          <Campo rotulo="Preço (R$)">
            <Entrada type="number" inputMode="decimal" value={v.precoInscricao}
              onChange={(e) => setV({ ...v, precoInscricao: e.target.value })} placeholder="300" />
          </Campo>
          <Campo rotulo="Unidade">
            <Entrada value={v.unidade} onChange={(e) => setV({ ...v, unidade: e.target.value })}
              placeholder="dupla" />
          </Campo>
          <Campo rotulo="Capacidade">
            <Entrada type="number" inputMode="numeric" value={v.capacidade}
              onChange={(e) => setV({ ...v, capacidade: e.target.value })} placeholder="64" />
          </Campo>
        </div>

        <Campo rotulo="Inscrições confirmadas"
          dica="Só as pagas. Interessado que disse que vai não é inscrição — e é exatamente essa confusão que faz o orçamento parecer saudável até a véspera.">
          <Entrada type="number" inputMode="numeric" value={v.inscritos}
            onChange={(e) => setV({ ...v, inscritos: e.target.value })} />
        </Campo>

        <div className="rounded-sm border border-borda2 p-3.5">
          <div className="rotulo mb-2 text-fraco">Receita que não vem de inscrição</div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Cota assinada (R$)">
              <Entrada type="number" inputMode="decimal" value={v.patrocinioContratado}
                onChange={(e) => setV({ ...v, patrocinioContratado: e.target.value })} />
            </Campo>
            <Campo rotulo="Cota em negociação (R$)">
              <Entrada type="number" inputMode="decimal" value={v.patrocinioEmNegociacao}
                onChange={(e) => setV({ ...v, patrocinioEmNegociacao: e.target.value })} />
            </Campo>
          </div>
          <div className="mt-3">
            <Campo rotulo="Bar, quadra, camisa (R$)">
              <Entrada type="number" inputMode="decimal" value={v.outrasReceitas}
                onChange={(e) => setV({ ...v, outrasReceitas: e.target.value })} />
            </Campo>
          </div>
          <div className="mt-3">
            <Legenda>
              Só a cota <b>assinada</b> entra na conta. A que está em negociação aparece na tela e
              fica de fora do ponto de equilíbrio — orçamento contando com cota que ainda não
              fechou é o jeito mais comum de um evento amador dar prejuízo.
            </Legenda>
          </div>
        </div>

        <div className="rounded-sm border border-borda2 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="rotulo text-fraco">Custos</span>
            <Botao variante="fantasma" onClick={() => setCustos([...custos, custoVazio()])}>
              <Plus size={14} />Linha
            </Botao>
          </div>

          <div className="space-y-2">
            {custos.map((c) => (
              <div key={c.id} className="space-y-2 rounded-sm bg-superficie2 p-2.5">
                <div className="flex gap-2">
                  <Entrada value={c.nome} placeholder="Arbitragem"
                    onChange={(e) => mudarCusto(c.id, { nome: e.target.value })} />
                  <Entrada type="number" inputMode="decimal" className="w-28" value={String(c.valor || '')}
                    placeholder="0" onChange={(e) => mudarCusto(c.id, { valor: Number(e.target.value) || 0 })} />
                  <button onClick={() => setCustos(custos.filter((x) => x.id !== c.id))}
                    aria-label="Remover custo"
                    className="shrink-0 rounded-sm px-2 text-fraco transition-colors hover:text-perigo">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Selecao className="w-auto flex-1" value={c.tipo}
                    onChange={(e) => mudarCusto(c.id, { tipo: e.target.value as CustoEvento['tipo'] })}>
                    <option value="fixo">custo fixo do evento</option>
                    <option value="porInscrito">por inscrito</option>
                  </Selecao>
                  <label className="flex items-center gap-2 text-[12px] text-fraco">
                    <input type="checkbox" checked={Boolean(c.comprometido)}
                      onChange={(e) => mudarCusto(c.id, { comprometido: e.target.checked })} />
                    já contratado
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Legenda>
              Custo fixo acontece com uma ou com cem inscrições — arbitragem, som, estrutura, mídia.
              Por inscrito escala com gente — kit, medalha, água. É essa separação que faz o ponto
              de equilíbrio existir; um orçamento de linha única não tem ponto de equilíbrio
              nenhum. E <b>já contratado</b> marca o que não volta se o evento cair.
            </Legenda>
          </div>
        </div>

        <Campo rotulo="Nota">
          <AreaTexto rows={2} value={v.nota} onChange={(e) => setV({ ...v, nota: e.target.value })} />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}>Salvar</Botao>
          {plano && (
            <Botao variante="perigo" onClick={() => { void dados.planos.remover(plano.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>
      </div>
    </Folha>
  );
}
