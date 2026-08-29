/**
 * Agenda — o que ocupa o seu tempo, por frente.
 *
 * A tela responde três perguntas em ordem: o que tem hoje, o que está atrasado,
 * e para onde as horas da semana estão indo. Não é um calendário completo e não
 * quer ser: sem convite, sem participante, sem importação de Google Agenda.
 * Você digita, e o que aparece aqui é só o que você marcou.
 */
import { useMemo, useState } from 'react';
import {
  Plus, Clock, MapPin, Repeat, CalendarDays, CircleCheck, Circle, Trash2,
  ChevronLeft, ChevronRight, Star, TriangleAlert,
} from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Frente, Evento, Rotina, Tarefa } from '../tipos';
import { CORES_FRENTE } from '../tipos';
import {
  hoje, dataPorExtenso, rotuloMes, mesAtual, mesRelativo, mesDe, deYmd, somaDias,
} from '../formato';
import {
  itensDoDia, marcasDoPeriodo, gradeDoMes, proximoCompromisso, separarAfazeres,
  diasDeAtraso, horasSemanaisPorFrente, type ItemDaAgenda, type Fontes,
} from '../logica/agenda';
import { FRENTES_SUGERIDAS } from '../dados/sementes';
import { EscolhaDeFrente } from '../componentes/Frentes';
import {
  Cartao, TituloSecao, Botao, Campo, Entrada, AreaTexto, Selecao,
  Folha, Vazio, Legenda, Pilula,
} from '../componentes/ui';
import { BlocoCapacidade } from '../componentes/Capacidade';

const SIGLAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type Formulario =
  | { tipo: 'evento'; item: Evento | null; data: string }
  | { tipo: 'rotina'; item: Rotina | null }
  | { tipo: 'tarefa'; item: Tarefa | null; prazo?: string }
  | { tipo: 'frente'; item: Frente | null }
  | null;

export default function Agenda({ dados }: { dados: DadosApp }) {
  const [mes, setMes] = useState(mesAtual());
  const [dia, setDia] = useState(hoje());
  const [frenteId, setFrenteId] = useState<string | undefined>();
  const [form, setForm] = useState<Formulario>(null);

  const frentes = [...dados.frentes.itens].filter((f) => f.ativo);
  const fontes: Fontes = {
    eventos: dados.eventos.itens,
    rotinas: dados.rotinas.itens,
    tarefas: dados.tarefas.itens,
  };

  const semanas = useMemo(() => gradeDoMes(mes), [mes]);
  const marcas = useMemo(
    () => marcasDoPeriodo(semanas.flat(), fontes, frentes, frenteId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [semanas, dados.eventos.itens, dados.rotinas.itens, dados.tarefas.itens, dados.frentes.itens, frenteId],
  );

  const doDia = itensDoDia(dia, fontes, frenteId);
  const proximo = proximoCompromisso(fontes, frenteId);
  const porId = new Map(dados.frentes.itens.map((f) => [f.id, f]));

  function abrirItem(item: ItemDaAgenda) {
    if (item.origem === 'evento') {
      setForm({ tipo: 'evento', item: dados.eventos.itens.find((e) => e.id === item.id) || null, data: dia });
    } else if (item.origem === 'rotina') {
      setForm({ tipo: 'rotina', item: dados.rotinas.itens.find((r) => r.id === item.id) || null });
    } else {
      setForm({ tipo: 'tarefa', item: dados.tarefas.itens.find((t) => t.id === item.id) || null });
    }
  }

  return (
    <div className="space-y-6">
      <FiltroDeFrentes frentes={frentes} escolhida={frenteId} aoEscolher={setFrenteId} />

      {/* O calendário. Ponto colorido por frente: dá para ver de longe qual
          projeto está tomando a semana sem abrir dia por dia. */}
      <Cartao>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button onClick={() => setMes(mesRelativo(mes, -1))} aria-label="Mês anterior"
            className="rounded-lg p-1.5 text-suave transition hover:bg-superficie2 hover:text-creme">
            <ChevronLeft size={18} />
          </button>
          <h2 className="titulo text-[17px]">{rotuloMes(mes)}</h2>
          <button onClick={() => setMes(mesRelativo(mes, 1))} aria-label="Próximo mês"
            className="rounded-lg p-1.5 text-suave transition hover:bg-superficie2 hover:text-creme">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {SIGLAS.map((s, i) => (
            <div key={i} className="rotulo pb-1 text-center text-fraco">{s}</div>
          ))}
          {semanas.flat().map((data) => {
            const doMes = mesDe(data) === mes;
            const marca = marcas.get(data);
            const ehHoje = data === hoje();
            const escolhido = data === dia;
            return (
              <button key={data} onClick={() => { setDia(data); if (!doMes) setMes(mesDe(data)); }}
                className={'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-[13px] transition '
                  + (escolhido ? 'bg-creme text-fundo'
                    : doMes ? 'text-creme hover:bg-superficie2' : 'text-fraco/50 hover:bg-superficie2')}>
                <span className={'tabular leading-none ' + (ehHoje && !escolhido ? 'text-brasa underline underline-offset-4' : '')}>
                  {deYmd(data).getDate()}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {marca?.cores.map((c, i) => (
                    <i key={i} className="h-1.5 w-1.5 rounded-full"
                      style={{ background: escolhido ? 'var(--color-fundo)' : c }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-borda2 pt-3">
          <button onClick={() => { setDia(hoje()); setMes(mesAtual()); }}
            className="rotulo text-fraco transition hover:text-creme">
            ir para hoje
          </button>
          {proximo && (
            <span className="truncate text-[12px] text-suave">
              próximo: <span className="text-creme">{proximo.item.titulo}</span>
              {' · '}{proximo.data === hoje() ? 'hoje' : proximo.data === somaDias(hoje(), 1) ? 'amanhã' : dataPorExtenso(proximo.data).split(',')[0].toLowerCase()}
              {proximo.item.hora ? ' ' + proximo.item.hora : ''}
            </span>
          )}
        </div>
      </Cartao>

      {/* O dia escolhido, aberto. */}
      <Cartao>
        <TituloSecao acao={
          <Botao variante="fantasma" onClick={() => setForm({ tipo: 'evento', item: null, data: dia })}>
            <Plus size={15} />Evento
          </Botao>
        }>
          {dia === hoje() ? 'Hoje' : dataPorExtenso(dia)}
        </TituloSecao>

        {!doDia.length ? (
          <Vazio titulo="Dia livre">
            Nada marcado{frenteId ? ' nesta frente' : ''}. Um dia vazio na agenda é informação também —
            ou é folga de verdade, ou é trabalho que existe e ainda não foi escrito em lugar nenhum.
          </Vazio>
        ) : (
          <div className="space-y-1">
            {doDia.map((item) => (
              <LinhaDoDia key={item.chave} item={item} frente={item.frenteId ? porId.get(item.frenteId) : undefined}
                aoAbrir={() => abrirItem(item)}
                aoConcluir={item.origem === 'tarefa'
                  ? () => void dados.tarefas.salvar({
                      id: item.id, feita: !item.feita, feitaEm: item.feita ? undefined : new Date().toISOString(),
                    })
                  : undefined} />
            ))}
          </div>
        )}
      </Cartao>

      {/* Antes da lista de afazeres, e não depois: a pergunta "cabe?" precisa
          vir antes de você decidir marcar mais uma coisa. */}
      <BlocoCapacidade dados={dados} />

      <BlocoAfazeres dados={dados} frenteId={frenteId} porId={porId}
        aoNovo={() => setForm({ tipo: 'tarefa', item: null })}
        aoAbrir={(t) => setForm({ tipo: 'tarefa', item: t })} />

      <BlocoRotinas dados={dados} frenteId={frenteId} porId={porId}
        aoNovo={() => setForm({ tipo: 'rotina', item: null })}
        aoAbrir={(r) => setForm({ tipo: 'rotina', item: r })} />

      <BlocoFrentes dados={dados}
        aoNovo={() => setForm({ tipo: 'frente', item: null })}
        aoAbrir={(f) => setForm({ tipo: 'frente', item: f })} />

      <FormularioEvento aberta={form?.tipo === 'evento'} aoFechar={() => setForm(null)} dados={dados}
        evento={form?.tipo === 'evento' ? form.item : null}
        dataPadrao={form?.tipo === 'evento' ? form.data : dia} />
      <FormularioRotina aberta={form?.tipo === 'rotina'} aoFechar={() => setForm(null)} dados={dados}
        rotina={form?.tipo === 'rotina' ? form.item : null} />
      <FormularioTarefa aberta={form?.tipo === 'tarefa'} aoFechar={() => setForm(null)} dados={dados}
        tarefa={form?.tipo === 'tarefa' ? form.item : null} />
      <FormularioFrente aberta={form?.tipo === 'frente'} aoFechar={() => setForm(null)} dados={dados}
        frente={form?.tipo === 'frente' ? form.item : null} />
    </div>
  );
}

function FiltroDeFrentes({
  frentes, escolhida, aoEscolher,
}: { frentes: Frente[]; escolhida?: string; aoEscolher: (id?: string) => void }) {
  if (!frentes.length) return null;
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
      <button onClick={() => aoEscolher(undefined)}
        className={'shrink-0 rounded-lg px-3 py-1.5 text-[12px] transition '
          + (!escolhida ? 'bg-creme font-medium text-fundo' : 'bg-superficie2 text-suave hover:text-creme')}>
        Tudo
      </button>
      {frentes.map((f) => (
        <button key={f.id} onClick={() => aoEscolher(escolhida === f.id ? undefined : f.id)}
          className={'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition '
            + (escolhida === f.id ? 'font-medium text-fundo' : 'bg-superficie2 text-suave hover:text-creme')}
          style={escolhida === f.id ? { background: f.cor } : undefined}>
          <i className="h-1.5 w-1.5 rounded-full"
            style={{ background: escolhida === f.id ? 'var(--color-fundo)' : f.cor }} />
          {f.nome}
        </button>
      ))}
    </div>
  );
}

function LinhaDoDia({
  item, frente, aoAbrir, aoConcluir,
}: { item: ItemDaAgenda; frente?: Frente; aoAbrir: () => void; aoConcluir?: () => void }) {
  const Icone = item.origem === 'rotina' ? Repeat : item.origem === 'tarefa' ? CircleCheck : CalendarDays;
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-2.5 transition hover:bg-superficie2">
      {aoConcluir ? (
        <button onClick={aoConcluir} aria-label={item.feita ? 'Reabrir' : 'Concluir'}
          className={'shrink-0 transition ' + (item.feita ? 'text-verde' : 'text-fraco hover:text-creme')}>
          {item.feita ? <CircleCheck size={17} /> : <Circle size={17} />}
        </button>
      ) : (
        <Icone size={15} className="shrink-0 text-fraco" />
      )}

      <button onClick={aoAbrir} className="min-w-0 flex-1 text-left">
        <span className={'flex items-center gap-1.5 truncate text-sm ' + (item.feita ? 'text-fraco line-through' : '')}>
          {item.peso === 'chave' && <Star size={12} className="shrink-0 text-ouro" />}
          {item.titulo}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-fraco">
          {item.hora && (
            <span className="tabular flex items-center gap-1"><Clock size={10} />{item.hora}
              {item.duracaoMin ? `–${somaMinutos(item.hora, item.duracaoMin)}` : ''}
            </span>
          )}
          {item.local && <span className="flex items-center gap-1 truncate"><MapPin size={10} />{item.local}</span>}
          {item.origem === 'rotina' && <span>toda semana</span>}
        </span>
      </button>

      {frente && (
        <span className="shrink-0"><Pilula cor={frente.cor}>{frente.nome}</Pilula></span>
      )}
    </div>
  );
}

/** 19:00 + 90min = 20:30. Vira do dia sem drama: 23:30 + 60 = 00:30. */
function somaMinutos(hora: string, minutos: number) {
  const [h, m] = hora.split(':').map(Number);
  const total = (h * 60 + m + minutos) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function BlocoAfazeres({
  dados, frenteId, porId, aoNovo, aoAbrir,
}: {
  dados: DadosApp; frenteId?: string; porId: Map<string, Frente>;
  aoNovo: () => void; aoAbrir: (t: Tarefa) => void;
}) {
  const [verFeitas, setVerFeitas] = useState(false);
  const a = separarAfazeres(dados.tarefas.itens, frenteId);
  const abertas = a.atrasadas.length + a.hoje.length + a.proximas.length + a.semPrazo.length;

  async function alternar(t: Tarefa) {
    await dados.tarefas.salvar({
      id: t.id, feita: !t.feita, feitaEm: t.feita ? undefined : new Date().toISOString(),
    });
  }

  const linha = (t: Tarefa, rotulo?: string, tom?: string) => (
    <div key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-superficie2">
      <button onClick={() => void alternar(t)} aria-label={t.feita ? 'Reabrir' : 'Concluir'}
        className={'shrink-0 transition ' + (t.feita ? 'text-verde' : 'text-fraco hover:text-creme')}>
        {t.feita ? <CircleCheck size={17} /> : <Circle size={17} />}
      </button>
      <button onClick={() => aoAbrir(t)} className="min-w-0 flex-1 text-left">
        <span className={'flex items-center gap-1.5 truncate text-sm ' + (t.feita ? 'text-fraco line-through' : '')}>
          {t.peso === 'chave' && <Star size={12} className="shrink-0 text-ouro" />}
          {t.titulo}
        </span>
        {rotulo && <span className={'mt-0.5 block text-[11px] ' + (tom || 'text-fraco')}>{rotulo}</span>}
      </button>
      {t.frenteId && porId.get(t.frenteId) && (
        <span className="shrink-0"><Pilula cor={porId.get(t.frenteId)!.cor}>{porId.get(t.frenteId)!.nome}</Pilula></span>
      )}
    </div>
  );

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={aoNovo}><Plus size={15} />Afazer</Botao>
      }>Afazeres</TituloSecao>

      {!abertas && !a.feitas.length ? (
        <Vazio titulo="Nada em aberto">
          Afazer é o que tem fim: ligar para o patrocinador, fechar o regulamento, pagar o alvará.
          O que se repete toda semana é rotina; o que você quer virar constância é hábito.
        </Vazio>
      ) : (
        <div className="space-y-3">
          {a.atrasadas.length > 0 && (
            <div>
              <div className="rotulo mb-1 flex items-center gap-1.5 text-perigo">
                <TriangleAlert size={12} />atrasados · {a.atrasadas.length}
              </div>
              {a.atrasadas.map((t) => { const d = diasDeAtraso(t.prazo!); return linha(t, d === 1 ? '1 dia de atraso' : d + ' dias de atraso', 'text-perigo'); })}
            </div>
          )}
          {a.hoje.length > 0 && (
            <div>
              <div className="rotulo mb-1 text-ouro">para hoje · {a.hoje.length}</div>
              {a.hoje.map((t) => linha(t))}
            </div>
          )}
          {a.proximas.length > 0 && (
            <div>
              <div className="rotulo mb-1 text-fraco">a caminho</div>
              {a.proximas.slice(0, 6).map((t) => linha(t, dataPorExtenso(t.prazo!).split(',')[0] + ', ' + t.prazo!.slice(8) + '/' + t.prazo!.slice(5, 7)))}
            </div>
          )}
          {a.semPrazo.length > 0 && (
            <div>
              <div className="rotulo mb-1 text-fraco">sem data · {a.semPrazo.length}</div>
              {a.semPrazo.slice(0, 6).map((t) => linha(t))}
            </div>
          )}

          {a.feitas.length > 0 && (
            <div className="border-t border-borda2 pt-2">
              <button onClick={() => setVerFeitas(!verFeitas)}
                className="rotulo text-fraco transition hover:text-suave">
                {verFeitas ? 'esconder' : 'ver'} {a.feitas.length === 1 ? 'o feito' : 'os ' + a.feitas.length + ' feitos'}
              </button>
              {verFeitas && <div className="mt-1">{a.feitas.slice(0, 20).map((t) => linha(t))}</div>}
            </div>
          )}
        </div>
      )}
    </Cartao>
  );
}

function BlocoRotinas({
  dados, frenteId, porId, aoNovo, aoAbrir,
}: {
  dados: DadosApp; frenteId?: string; porId: Map<string, Frente>;
  aoNovo: () => void; aoAbrir: (r: Rotina) => void;
}) {
  const rotinas = dados.rotinas.itens
    .filter((r) => !frenteId || r.frenteId === frenteId)
    .sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'));
  const horas = horasSemanaisPorFrente(dados.rotinas.itens);

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={aoNovo}><Plus size={15} />Rotina</Botao>
      }>Rotinas da semana</TituloSecao>

      {!rotinas.length ? (
        <Vazio titulo="Nenhuma rotina">
          O que acontece nos mesmos dias toda semana entra aqui uma vez só e passa a desenhar a
          grade sozinho — o expediente da arena, a rodada de segunda, o dia de treino do time.
        </Vazio>
      ) : (
        <>
          <div className="space-y-1">
            {rotinas.map((r) => (
              <button key={r.id} onClick={() => aoAbrir(r)}
                className={'flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition hover:bg-superficie2 '
                  + (r.ativo ? '' : 'opacity-45')}>
                <Repeat size={14} className="shrink-0 text-fraco" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{r.titulo}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-fraco">
                    <span className="flex gap-0.5">
                      {SIGLAS.map((s, i) => (
                        <i key={i} className={'flex h-3.5 w-3.5 items-center justify-center rounded-[3px] text-[8px] font-medium not-italic '
                          + (r.dias.includes(i) ? 'bg-superficie2 text-creme' : 'text-fraco/40')}>{s}</i>
                      ))}
                    </span>
                    {r.hora && <span className="tabular">{r.hora}</span>}
                    {!r.ativo && <span>pausada</span>}
                  </span>
                </span>
                {r.frenteId && porId.get(r.frenteId) && (
                  <span className="shrink-0"><Pilula cor={porId.get(r.frenteId)!.cor}>{porId.get(r.frenteId)!.nome}</Pilula></span>
                )}
              </button>
            ))}
          </div>

          {/* Para onde as horas previsíveis estão indo. É a conta que responde
              se a frente que paga o mês tem mais tempo que a que não paga. */}
          {horas.size > 0 && (
            <div className="mt-4 border-t border-borda2 pt-3">
              <div className="rotulo mb-2 text-fraco">horas por semana, só de rotina</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                {[...horas.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([chave, min]) => {
                    const f = porId.get(chave);
                    return (
                      <span key={chave} className="flex items-center gap-1.5">
                        <i className="h-1.5 w-1.5 rounded-full" style={{ background: f?.cor || 'var(--color-fraco)' }} />
                        <span className="text-suave">{f?.nome || 'sem frente'}</span>
                        <span className="tabular text-creme">{(min / 60).toFixed(min % 60 ? 1 : 0)}h</span>
                      </span>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </Cartao>
  );
}

function BlocoFrentes({
  dados, aoNovo, aoAbrir,
}: { dados: DadosApp; aoNovo: () => void; aoAbrir: (f: Frente) => void }) {
  const frentes = dados.frentes.itens;

  async function semear() {
    const agora = new Date().toISOString();
    for (const f of FRENTES_SUGERIDAS) await dados.frentes.salvar({ ...f, criadoEm: agora });
  }

  const TIPOS: Record<Frente['tipo'], string> = {
    fixo: 'contrato fixo', projeto: 'projeto', pessoal: 'pessoal',
  };

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={aoNovo}><Plus size={15} />Frente</Botao>
      }>Frentes</TituloSecao>

      {!frentes.length ? (
        <div className="space-y-3">
          <Vazio titulo="Nenhuma frente cadastrada">
            Frente é cada coisa que disputa o seu tempo: o contrato da arena, cada torneio, cada
            projeto, a vida pessoal. Com elas marcadas, a agenda deixa de ser uma lista só e passa a
            dizer para onde a semana foi.
          </Vazio>
          <Botao variante="secundario" className="w-full" onClick={() => void semear()}>
            Começar com as que eu já toco
          </Botao>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {frentes.map((f) => (
            <button key={f.id} onClick={() => aoAbrir(f)}
              className={'flex items-center gap-2 rounded-lg border border-borda px-3 py-2 text-left transition hover:border-borda2 '
                + (f.ativo ? '' : 'opacity-45')}>
              <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: f.cor }} />
              <span>
                <span className="block text-[13px]">{f.nome}</span>
                <span className="rotulo block text-fraco">{TIPOS[f.tipo]}{f.ativo ? '' : ' · pausada'}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Cartao>
  );
}

// ──────────────────────────── Formulários ────────────────────────────

/** Reaproveita o truque dos outros formulários: reidrata quando a folha abre. */
function useCampos<T>(aberta: boolean, id: string, montar: () => T) {
  const [chave, setChave] = useState('');
  const [valores, setValores] = useState<T>(montar);
  if (aberta && chave !== id) { setChave(id); setValores(montar()); }
  if (!aberta && chave) setChave('');
  const mudar = (parte: Partial<T>) => setValores((v) => ({ ...v, ...parte }));
  return [valores, mudar] as const;
}

function SeletorDeDias({ dias, aoMudar }: { dias: number[]; aoMudar: (d: number[]) => void }) {
  return (
    <Campo rotulo="Dias da semana">
      <div className="grid grid-cols-7 gap-1.5">
        {SIGLAS.map((s, i) => (
          <button key={i}
            onClick={() => aoMudar(dias.includes(i) ? dias.filter((d) => d !== i) : [...dias, i].sort())}
            className={'rounded-lg py-2.5 text-[12px] font-medium transition '
              + (dias.includes(i) ? 'bg-creme text-fundo' : 'bg-superficie2 text-suave hover:text-creme')}>
            {s}
          </button>
        ))}
      </div>
    </Campo>
  );
}

function FormularioEvento({
  aberta, aoFechar, evento, dataPadrao, dados,
}: { aberta: boolean; aoFechar: () => void; evento: Evento | null; dataPadrao: string; dados: DadosApp }) {
  const frentes = dados.frentes.itens.filter((f) => f.ativo);
  const [v, mudar] = useCampos(aberta, evento?.id || 'novo:' + dataPadrao, () => ({
    titulo: evento?.titulo || '',
    data: evento?.data || dataPadrao,
    hora: evento?.hora || '',
    duracaoMin: evento?.duracaoMin ? String(evento.duracaoMin) : '',
    local: evento?.local || '',
    frenteId: evento?.frenteId,
    nota: evento?.nota || '',
  }));

  async function gravar() {
    await dados.eventos.salvar({
      id: evento?.id,
      titulo: v.titulo.trim() || 'Compromisso',
      data: v.data,
      hora: v.hora || undefined,
      duracaoMin: Number(v.duracaoMin) || undefined,
      local: v.local.trim() || undefined,
      frenteId: v.frenteId,
      nota: v.nota.trim() || undefined,
      criadoEm: evento?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={evento ? 'Editar evento' : 'Novo evento'}>
      <div className="space-y-4">
        <Campo rotulo="O que é">
          <Entrada value={v.titulo} onChange={(e) => mudar({ titulo: e.target.value })}
            placeholder="Reunião com o patrocinador" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Dia">
            <Entrada type="date" value={v.data} onChange={(e) => mudar({ data: e.target.value })} />
          </Campo>
          <Campo rotulo="Hora" dica="Em branco = dia inteiro.">
            <Entrada type="time" value={v.hora} onChange={(e) => mudar({ hora: e.target.value })} />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Duração (min)">
            <Entrada type="number" inputMode="numeric" value={v.duracaoMin}
              onChange={(e) => mudar({ duracaoMin: e.target.value })} placeholder="60" />
          </Campo>
          <Campo rotulo="Onde">
            <Entrada value={v.local} onChange={(e) => mudar({ local: e.target.value })} placeholder="Arena" />
          </Campo>
        </div>

        <EscolhaDeFrente frentes={frentes} valor={v.frenteId} aoMudar={(id) => mudar({ frenteId: id })} />

        <Campo rotulo="Nota">
          <AreaTexto rows={2} value={v.nota} onChange={(e) => mudar({ nota: e.target.value })}
            placeholder="O que precisa estar pronto antes" />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!v.titulo.trim()}>Salvar</Botao>
          {evento && (
            <Botao variante="perigo"
              onClick={() => { void dados.eventos.remover(evento.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>
      </div>
    </Folha>
  );
}

function FormularioRotina({
  aberta, aoFechar, rotina, dados,
}: { aberta: boolean; aoFechar: () => void; rotina: Rotina | null; dados: DadosApp }) {
  const frentes = dados.frentes.itens.filter((f) => f.ativo);
  const [v, mudar] = useCampos(aberta, rotina?.id || 'novo', () => ({
    titulo: rotina?.titulo || '',
    dias: rotina?.dias || [1, 3, 5],
    hora: rotina?.hora || '',
    duracaoMin: rotina?.duracaoMin ? String(rotina.duracaoMin) : '',
    local: rotina?.local || '',
    frenteId: rotina?.frenteId,
    ativo: rotina?.ativo ?? true,
  }));

  async function gravar() {
    await dados.rotinas.salvar({
      id: rotina?.id,
      titulo: v.titulo.trim() || 'Rotina',
      dias: v.dias,
      hora: v.hora || undefined,
      duracaoMin: Number(v.duracaoMin) || undefined,
      local: v.local.trim() || undefined,
      frenteId: v.frenteId,
      ativo: v.ativo,
      criadoEm: rotina?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={rotina ? 'Editar rotina' : 'Nova rotina'}>
      <div className="space-y-4">
        <Campo rotulo="O que se repete">
          <Entrada value={v.titulo} onChange={(e) => mudar({ titulo: e.target.value })}
            placeholder="Expediente na arena" />
        </Campo>

        <SeletorDeDias dias={v.dias} aoMudar={(d) => mudar({ dias: d })} />

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Hora">
            <Entrada type="time" value={v.hora} onChange={(e) => mudar({ hora: e.target.value })} />
          </Campo>
          <Campo rotulo="Duração (min)" dica="Entra na conta de horas por frente.">
            <Entrada type="number" inputMode="numeric" value={v.duracaoMin}
              onChange={(e) => mudar({ duracaoMin: e.target.value })} placeholder="60" />
          </Campo>
        </div>

        <Campo rotulo="Onde">
          <Entrada value={v.local} onChange={(e) => mudar({ local: e.target.value })} placeholder="Arena Boulevard" />
        </Campo>

        <EscolhaDeFrente frentes={frentes} valor={v.frenteId} aoMudar={(id) => mudar({ frenteId: id })} />

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!v.titulo.trim() || !v.dias.length}>Salvar</Botao>
          {rotina && (
            <>
              <Botao variante="secundario" onClick={() => { mudar({ ativo: !v.ativo }); }}>
                {v.ativo ? 'Pausar' : 'Reativar'}
              </Botao>
              <Botao variante="perigo"
                onClick={() => { void dados.rotinas.remover(rotina.id); aoFechar(); }}>
                <Trash2 size={15} />
              </Botao>
            </>
          )}
        </div>
        {rotina && !v.ativo && (
          <Legenda>Pausada: some da grade, mas o cadastro fica. Salve para valer.</Legenda>
        )}
      </div>
    </Folha>
  );
}

function FormularioTarefa({
  aberta, aoFechar, tarefa, dados,
}: { aberta: boolean; aoFechar: () => void; tarefa: Tarefa | null; dados: DadosApp }) {
  const frentes = dados.frentes.itens.filter((f) => f.ativo);
  const [v, mudar] = useCampos(aberta, tarefa?.id || 'novo', () => ({
    titulo: tarefa?.titulo || '',
    prazo: tarefa?.prazo || '',
    frenteId: tarefa?.frenteId,
    peso: tarefa?.peso || ('normal' as 'normal' | 'chave'),
    estimativaMin: tarefa?.estimativaMin ? String(tarefa.estimativaMin) : '',
    nota: tarefa?.nota || '',
  }));

  async function gravar() {
    await dados.tarefas.salvar({
      id: tarefa?.id,
      titulo: v.titulo.trim() || 'Afazer',
      prazo: v.prazo || undefined,
      frenteId: v.frenteId,
      peso: v.peso,
      estimativaMin: Number(v.estimativaMin) || undefined,
      nota: v.nota.trim() || undefined,
      feita: tarefa?.feita || false,
      criadoEm: tarefa?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={tarefa ? 'Editar afazer' : 'Novo afazer'}>
      <div className="space-y-4">
        <Campo rotulo="O que precisa ser feito">
          <Entrada value={v.titulo} onChange={(e) => mudar({ titulo: e.target.value })}
            placeholder="Fechar o regulamento da 2ª etapa" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Prazo" dica="Em branco fica na lista sem cobrar data.">
            <Entrada type="date" value={v.prazo} onChange={(e) => mudar({ prazo: e.target.value })} />
          </Campo>
          <Campo rotulo="Peso" dica="Chave é a que move o placar da meta.">
            <Selecao value={v.peso} onChange={(e) => mudar({ peso: e.target.value as 'normal' | 'chave' })}>
              <option value="normal">Normal</option>
              <option value="chave">Chave</option>
            </Selecao>
          </Campo>
        </div>

        <Campo rotulo="Quanto tempo leva (min)"
          dica="Chute grosseiro serve. Em branco, a capacidade da semana assume 45 minutos — ou 2 horas se for chave. É essa soma que diz se a semana cabe.">
          <Entrada type="number" inputMode="numeric" value={v.estimativaMin}
            onChange={(e) => mudar({ estimativaMin: e.target.value })} placeholder="45" />
        </Campo>

        <EscolhaDeFrente frentes={frentes} valor={v.frenteId} aoMudar={(id) => mudar({ frenteId: id })} />

        <Campo rotulo="Nota">
          <AreaTexto rows={2} value={v.nota} onChange={(e) => mudar({ nota: e.target.value })}
            placeholder="O primeiro passo, para não travar na hora" />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!v.titulo.trim()}>Salvar</Botao>
          {tarefa && (
            <Botao variante="perigo"
              onClick={() => { void dados.tarefas.remover(tarefa.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>
      </div>
    </Folha>
  );
}

function FormularioFrente({
  aberta, aoFechar, frente, dados,
}: { aberta: boolean; aoFechar: () => void; frente: Frente | null; dados: DadosApp }) {
  const [v, mudar] = useCampos(aberta, frente?.id || 'novo', () => ({
    nome: frente?.nome || '',
    cor: frente?.cor || CORES_FRENTE[dados.frentes.itens.length % CORES_FRENTE.length],
    tipo: frente?.tipo || ('projeto' as Frente['tipo']),
    modelo: frente?.modelo,
    ativo: frente?.ativo ?? true,
  }));

  async function gravar() {
    await dados.frentes.salvar({
      id: frente?.id,
      nome: v.nome.trim() || 'Frente',
      cor: v.cor,
      tipo: v.tipo,
      modelo: v.modelo,
      ativo: v.ativo,
      ordem: frente?.ordem ?? dados.frentes.itens.length + 1,
      criadoEm: frente?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={frente ? 'Editar frente' : 'Nova frente'}>
      <div className="space-y-4">
        <Campo rotulo="Nome">
          <Entrada value={v.nome} onChange={(e) => mudar({ nome: e.target.value })}
            placeholder="Desafio das Arenas" />
        </Campo>

        <Campo rotulo="Tipo" dica="Contrato fixo paga todo mês; projeto tem fim.">
          <div className="grid grid-cols-3 gap-2">
            {([['fixo', 'Contrato fixo'], ['projeto', 'Projeto'], ['pessoal', 'Pessoal']] as const).map(([id, nome]) => (
              <button key={id} onClick={() => mudar({ tipo: id })}
                className={'rounded-lg border px-2 py-2 text-[12px] font-medium transition '
                  + (v.tipo === id ? 'border-creme text-creme' : 'border-borda bg-superficie2 text-suave')}>
                {nome}
              </button>
            ))}
          </div>
        </Campo>

        {/* A distinção que decide a agenda do mês: quem paga para você executar
          contra o evento em que o risco é seu. Fica opcional porque frente
          pessoal não tem modelo de receita. */}
      {v.tipo !== 'pessoal' && (
        <Campo rotulo="Modelo de receita"
          dica="Contratado: alguém te paga para executar, o prejuízo de bilheteria é do contratante. Próprio: o upside e o risco são seus.">
          <div className="grid grid-cols-3 gap-2">
            {([['contratado', 'Contratado'], ['proprio', 'Próprio'], [undefined, 'Não se aplica']] as const).map(([id, nome]) => (
              <button key={nome} onClick={() => mudar({ modelo: id })}
                className={'rounded-sm border px-2 py-2 text-[12px] transition-colors '
                  + (v.modelo === id ? 'border-creme text-creme' : 'border-borda2 bg-superficie2 text-fraco')}>
                {nome}
              </button>
            ))}
          </div>
        </Campo>
      )}

      <Campo rotulo="Cor">
          <div className="flex flex-wrap gap-2">
            {CORES_FRENTE.map((c) => (
              <button key={c} onClick={() => mudar({ cor: c })} aria-label={'Cor ' + c}
                className={'h-8 w-8 rounded-lg border-2 transition ' + (v.cor === c ? 'border-creme' : 'border-transparent')}
                style={{ background: c }} />
            ))}
          </div>
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!v.nome.trim()}>Salvar</Botao>
          {frente && (
            <>
              <Botao variante="secundario"
                onClick={() => { void dados.frentes.salvar({ id: frente.id, ativo: !frente.ativo }); aoFechar(); }}>
                {frente.ativo ? 'Pausar' : 'Reativar'}
              </Botao>
              <Botao variante="perigo"
                onClick={() => { void dados.frentes.remover(frente.id); aoFechar(); }}>
                <Trash2 size={15} />
              </Botao>
            </>
          )}
        </div>
        {frente && (
          <Legenda>
            Apagar a frente não apaga o que estava marcado nela — os compromissos ficam, só perdem a
            etiqueta. Pausar some dos filtros e mantém tudo no lugar.
          </Legenda>
        )}
      </div>
    </Folha>
  );
}
