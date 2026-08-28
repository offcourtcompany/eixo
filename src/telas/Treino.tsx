import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Check, Trophy, ChevronRight } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Treino as TreinoDoc, ExercicioFeito, GrupoMuscular } from '../tipos';
import { PROGRAMAS, GRUPOS, type Programa, type ExercicioProgramado } from '../dados/programas';
import { hoje, somaDias, dataCurta, dataPorExtenso, numero } from '../formato';
import { ultimaSessao, sugerirCarga, recorde, tonelagem, volumePorGrupo, e1rm } from '../logica/treino';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, Selecao, AreaTexto,
  Folha, Vazio, Legenda, Pilula, Aviso,
} from '../componentes/ui';

export default function Treino({ dados }: { dados: DadosApp }) {
  const treinos = dados.treinos.itens;
  const [sessaoId, setSessaoId] = useState<string | null>(null);

  const sessao = treinos.find((t) => t.id === sessaoId) || null;

  // Alterna A/B a partir do último treino registrado — sem exigir que você lembre.
  const proximo = useMemo(() => {
    const ultimo = treinos.find((t) => t.programa === 'A' || t.programa === 'B');
    return PROGRAMAS.find((p) => p.id !== ultimo?.programa) || PROGRAMAS[0];
  }, [treinos]);

  async function iniciar(programa: Programa) {
    const id = await dados.treinos.salvar({
      data: hoje(),
      programa: programa.id,
      exercicios: [],
      criadoEm: new Date().toISOString(),
    });
    setSessaoId(id);
  }

  if (sessao) {
    return <SessaoAberta dados={dados} sessao={sessao} aoFechar={() => setSessaoId(null)} />;
  }

  return (
    <div className="space-y-6">
      <Cartao>
        <TituloSecao>Próximo treino</TituloSecao>
        <Legenda>
          Você joga muito e não levanta peso. Isso não é só desempenho perdido: é a lesão que tira você
          de quadra — e a quadra é onde a sua rede de contatos, que gera receita, acontece. Força aqui é
          manutenção de ativo, não estética.
        </Legenda>
        <div className="mt-4 space-y-2">
          {PROGRAMAS.map((p) => (
            <button key={p.id} onClick={() => void iniciar(p)}
              className={'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition '
                + (p.id === proximo.id ? 'border-brasa/50' : 'border-borda bg-superficie2')}>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="titulo text-base">{p.nome}</span>
                  {p.id === proximo.id && <Pilula cor="#EE6018">é a vez dele</Pilula>}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-fraco">{p.foco}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-suave" />
            </button>
          ))}
        </div>
      </Cartao>

      <PesoCorporal dados={dados} />
      <VolumeSemanal treinos={treinos} />
      <Recordes treinos={treinos} />
      <Historico treinos={treinos} aoAbrir={setSessaoId} />
    </div>
  );
}

// ─────────────────────── sessão em andamento ───────────────────────

function SessaoAberta({
  dados, sessao, aoFechar,
}: { dados: DadosApp; sessao: TreinoDoc; aoFechar: () => void }) {
  const programa = PROGRAMAS.find((p) => p.id === sessao.programa);
  const outros = dados.treinos.itens.filter((t) => t.id !== sessao.id);
  const [livre, setLivre] = useState(false);

  async function atualizar(exercicios: ExercicioFeito[]) {
    await dados.treinos.salvar({ id: sessao.id, exercicios });
  }

  async function registrarSerie(nome: string, grupo: GrupoMuscular, carga: number, reps: number, rir?: number) {
    const lista = [...sessao.exercicios];
    const i = lista.findIndex((e) => e.nome === nome);
    if (i >= 0) lista[i] = { ...lista[i], series: [...lista[i].series, { carga, reps, rir }] };
    else lista.push({ nome, grupo, series: [{ carga, reps, rir }] });
    await atualizar(lista);
  }

  async function removerSerie(nome: string, indice: number) {
    const lista = sessao.exercicios
      .map((e) => (e.nome === nome ? { ...e, series: e.series.filter((_, i) => i !== indice) } : e))
      .filter((e) => e.series.length > 0);
    await atualizar(lista);
  }

  const feitos = sessao.exercicios.length;
  const total = programa?.exercicios.length ?? 0;

  return (
    <div className="space-y-6">
      <Cartao>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="titulo text-xl">{programa?.nome || 'Treino livre'}</h2>
            <p className="text-[12px] text-suave">{dataPorExtenso(sessao.data)}</p>
          </div>
          <Botao variante="primario" onClick={aoFechar}><Check size={15} />Concluir</Botao>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-suave">
          <span>{feitos}{total ? '/' + total : ''} exercícios</span>
          <span className="tabular">{numero(tonelagem(sessao))} kg de tonelagem</span>
        </div>
        <div className="mt-3">
          <Legenda>
            Cada série é gravada na hora, uma a uma. Se o sinal cair na academia, ela fica na fila e sobe
            quando a conexão voltar — não perde.
          </Legenda>
        </div>
      </Cartao>

      {programa?.exercicios.map((ex) => (
        <BlocoExercicio key={ex.nome} ex={ex} sessao={sessao} historico={outros}
          aoRegistrar={registrarSerie} aoRemover={removerSerie} />
      ))}

      {sessao.exercicios.filter((e) => !programa?.exercicios.some((p) => p.nome === e.nome)).map((e) => (
        <BlocoExercicio key={e.nome}
          ex={{ nome: e.nome, grupo: e.grupo, series: 3, repsAlvo: 8, incremento: 2.5 }}
          sessao={sessao} historico={outros} aoRegistrar={registrarSerie} aoRemover={removerSerie} />
      ))}

      <Botao variante="secundario" className="w-full" onClick={() => setLivre(true)}>
        <Plus size={15} />Exercício fora do programa
      </Botao>

      <Cartao>
        <Campo rotulo="Como foi (opcional)">
          <AreaTexto rows={2} defaultValue={sessao.nota || ''}
            onBlur={(e) => void dados.treinos.salvar({ id: sessao.id, nota: e.target.value })}
            placeholder="Ombro incomodou no desenvolvimento. Dormi 5h." />
        </Campo>
        <div className="mt-3 flex gap-2">
          <Botao variante="primario" onClick={aoFechar} className="flex-1"><Check size={15} />Concluir treino</Botao>
          <Botao variante="perigo" onClick={() => { void dados.treinos.remover(sessao.id); aoFechar(); }}>
            <Trash2 size={15} />
          </Botao>
        </div>
      </Cartao>

      <ExercicioLivre aberta={livre} aoFechar={() => setLivre(false)}
        aoAdicionar={(nome, grupo) => void registrarSerie(nome, grupo, 0, 0)} />
    </div>
  );
}

function BlocoExercicio({
  ex, sessao, historico, aoRegistrar, aoRemover,
}: {
  ex: ExercicioProgramado;
  sessao: TreinoDoc;
  historico: TreinoDoc[];
  aoRegistrar: (nome: string, grupo: GrupoMuscular, carga: number, reps: number, rir?: number) => void;
  aoRemover: (nome: string, indice: number) => void;
}) {
  const feito = sessao.exercicios.find((e) => e.nome === ex.nome);
  const series = (feito?.series || []).filter((s) => s.carga > 0 || s.reps > 0);
  const anterior = useMemo(() => ultimaSessao(historico, ex.nome), [historico, ex.nome]);
  const sugestao = useMemo(
    () => sugerirCarga(historico, ex.nome, ex.repsAlvo, ex.incremento),
    [historico, ex.nome, ex.repsAlvo, ex.incremento],
  );

  const [carga, setCarga] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');

  const cargaSugerida = sugestao?.carga;
  const cargaEfetiva = carga !== '' ? carga : (series.length ? String(series[series.length - 1].carga) : cargaSugerida ? String(cargaSugerida) : '');

  function adicionar() {
    const c = Number(cargaEfetiva) || 0;
    const r = Number(reps) || 0;
    if (!r) return;
    aoRegistrar(ex.nome, ex.grupo, c, r, rir === '' ? undefined : Number(rir));
    setReps(''); setRir('');
    setCarga(String(c));
  }

  const completo = series.length >= ex.series;

  return (
    <Cartao className={completo ? 'border-verde/30' : ''}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="titulo text-base">{ex.nome}</h3>
          <p className="text-[11px] text-fraco">
            {ex.series} séries × {ex.repsAlvo} {ex.grupo === 'core' ? 'segundos' : 'reps'}
          </p>
        </div>
        <span className="tabular shrink-0 text-[12px] text-suave">{series.length}/{ex.series}</span>
      </div>

      {ex.nota && <p className="mt-2 text-[11px] leading-relaxed text-fraco">{ex.nota}</p>}

      {anterior && (
        <div className="mt-3 rounded-xl bg-superficie2 px-3 py-2.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-fraco">
            Última vez · {dataCurta(anterior.data)}
          </div>
          <div className="tabular mt-1 text-[13px] text-suave">
            {anterior.series.map((s, i) => (
              <span key={i}>{i > 0 ? ' · ' : ''}{s.carga}kg × {s.reps}</span>
            ))}
          </div>
          {sugestao && (
            <div className="mt-2 border-t border-borda2 pt-2 text-[12px]">
              <span className="text-fraco">Hoje: </span>
              <span className="tabular text-brasa">{sugestao.carga} kg</span>
              <span className="text-fraco"> — {sugestao.motivo}</span>
            </div>
          )}
        </div>
      )}

      {series.length > 0 && (
        <div className="mt-3 space-y-1">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-superficie2 px-3 py-2">
              <span className="w-5 text-[11px] text-fraco">{i + 1}</span>
              <span className="tabular flex-1 text-sm">
                {s.carga} kg × {s.reps}
                {s.rir !== undefined && <span className="text-fraco"> · RIR {s.rir}</span>}
              </span>
              {s.reps >= ex.repsAlvo && <Pilula cor="#A0CA92">alvo</Pilula>}
              <button onClick={() => aoRemover(ex.nome, i)} className="text-fraco hover:text-perigo">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
        <Campo rotulo="Carga">
          <Entrada type="number" inputMode="decimal" step="0.5" value={cargaEfetiva}
            onChange={(e) => setCarga(e.target.value)} placeholder="0" />
        </Campo>
        <Campo rotulo={ex.grupo === 'core' ? 'Seg.' : 'Reps'}>
          <Entrada type="number" inputMode="numeric" value={reps}
            onChange={(e) => setReps(e.target.value)} placeholder={String(ex.repsAlvo)} />
        </Campo>
        <Campo rotulo="RIR">
          <Entrada type="number" inputMode="numeric" value={rir}
            onChange={(e) => setRir(e.target.value)} placeholder="2" />
        </Campo>
        <div className="flex items-end">
          <Botao variante="primario" onClick={adicionar} disabled={!Number(reps)}><Plus size={16} /></Botao>
        </div>
      </div>
    </Cartao>
  );
}

function ExercicioLivre({
  aberta, aoFechar, aoAdicionar,
}: { aberta: boolean; aoFechar: () => void; aoAdicionar: (nome: string, grupo: GrupoMuscular) => void }) {
  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscular>('corpo-todo');

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Exercício fora do programa">
      <div className="space-y-4">
        <Campo rotulo="Nome">
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Afundo búlgaro" />
        </Campo>
        <Campo rotulo="Grupo">
          <Selecao value={grupo} onChange={(e) => setGrupo(e.target.value as GrupoMuscular)}>
            {GRUPOS.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </Selecao>
        </Campo>
        <Botao variante="primario" className="w-full" disabled={!nome.trim()}
          onClick={() => { aoAdicionar(nome.trim(), grupo); setNome(''); aoFechar(); }}>
          Adicionar ao treino de hoje
        </Botao>
      </div>
    </Folha>
  );
}

// ───────────────────────────── painéis ─────────────────────────────

function PesoCorporal({ dados }: { dados: DadosApp }) {
  const [valor, setValor] = useState('');
  const data = hoje();
  const registros = dados.dias
    .filter((d) => typeof d.peso === 'number')
    .sort((a, b) => a.id.localeCompare(b.id));
  const atual = registros[registros.length - 1];
  const anterior = registros[registros.length - 8];
  const alvo = dados.perfil.pesoAlvo;

  async function gravar() {
    const n = Number(valor);
    if (!n) return;
    await dados.salvarDia({ id: data, peso: n });
    setValor('');
  }

  return (
    <Cartao>
      <TituloSecao>Peso</TituloSecao>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Campo rotulo="Peso de hoje (kg)">
            <Entrada type="number" inputMode="decimal" step="0.1" value={valor}
              onChange={(e) => setValor(e.target.value)} placeholder={atual ? String(atual.peso) : '96'} />
          </Campo>
        </div>
        <Botao variante="secundario" onClick={() => void gravar()} disabled={!Number(valor)}>Registrar</Botao>
      </div>

      {atual && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metrica rotulo="Atual" valor={numero(atual.peso as number, 1) + ' kg'} tamanho="medio" />
          {anterior && (
            <Metrica rotulo="7 registros atrás" tamanho="medio"
              valor={((atual.peso as number) > (anterior.peso as number) ? '+' : '') + numero((atual.peso as number) - (anterior.peso as number), 1) + ' kg'}
              cor={(atual.peso as number) <= (anterior.peso as number) ? 'text-verde' : 'text-ouro'} />
          )}
          {alvo && (
            <Metrica rotulo="Falta" valor={numero(Math.abs((atual.peso as number) - alvo), 1) + ' kg'}
              tamanho="medio" detalhe={'alvo ' + alvo + ' kg'} />
          )}
        </div>
      )}
    </Cartao>
  );
}

function VolumeSemanal({ treinos }: { treinos: TreinoDoc[] }) {
  const semanas = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const fim = somaDias(hoje(), -7 * (5 - i));
      const inicio = somaDias(fim, -6);
      const doIntervalo = treinos.filter((t) => t.data >= inicio && t.data <= fim);
      return {
        semana: dataCurta(inicio),
        Sessões: doIntervalo.length,
        Tonelagem: Math.round(doIntervalo.reduce((s, t) => s + tonelagem(t), 0)),
      };
    });
  }, [treinos]);

  const grupos = useMemo(() => volumePorGrupo(treinos, somaDias(hoje(), -27)), [treinos]);
  const temDado = semanas.some((s) => s.Sessões > 0);

  return (
    <Cartao>
      <TituloSecao>Volume</TituloSecao>
      {!temDado ? (
        <Vazio titulo="Nenhum treino registrado ainda">
          Três sessões por semana é o alvo. Duas já sustentam. Uma é melhor que zero — e zero é a única
          que não conta.
        </Vazio>
      ) : (
        <>
          <div className="-ml-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semanas} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <XAxis dataKey="semana" tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false} width={40}
                  tickFormatter={(v: number) => (v >= 1000 ? (v / 1000) + 't' : String(v))} />
                <Tooltip cursor={{ fill: '#ffffff08' }}
                  contentStyle={{ background: '#101010', border: '1px solid #3D3A39', borderRadius: 10, fontSize: 12 }}
                  formatter={(v, n) => [n === 'Tonelagem' ? numero(Number(v)) + ' kg' : String(v), String(n)]} />
                <Bar dataKey="Tonelagem" fill="#EEEEEE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {GRUPOS.map((g) => {
              const v = grupos.get(g.id);
              if (!v) return null;
              return <Pilula key={g.id}>{g.nome} · {v.series} séries</Pilula>;
            })}
          </div>
          <div className="mt-3">
            <Legenda>Séries por grupo nos últimos 28 dias. Grupo ausente da lista é grupo que não recebeu estímulo.</Legenda>
          </div>
        </>
      )}
    </Cartao>
  );
}

function Recordes({ treinos }: { treinos: TreinoDoc[] }) {
  const nomes = useMemo(() => {
    const s = new Set<string>();
    for (const t of treinos) for (const e of t.exercicios) s.add(e.nome);
    return [...s];
  }, [treinos]);

  const prs = nomes
    .map((n) => ({ nome: n, pr: recorde(treinos, n) }))
    .filter((x) => x.pr && x.pr.carga > 0)
    .sort((a, b) => (b.pr!.e1rm) - (a.pr!.e1rm));

  if (!prs.length) return null;

  return (
    <Cartao>
      <TituloSecao>Recordes</TituloSecao>
      <div className="space-y-1.5">
        {prs.map(({ nome, pr }) => (
          <div key={nome} className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Trophy size={14} className="shrink-0 text-ouro" />
            <span className="min-w-0 flex-1 truncate text-sm">{nome}</span>
            <span className="tabular shrink-0 text-sm font-medium">{pr!.carga} kg × {pr!.reps}</span>
            <span className="tabular w-20 shrink-0 text-right text-[11px] text-fraco">
              ~{numero(e1rm(pr!.carga, pr!.reps))} kg 1RM
            </span>
          </div>
        ))}
      </div>
      <Legenda>
        O 1RM estimado permite comparar séries de repetições diferentes: 60 kg × 8 vale mais que 70 kg × 3.
        É a régua honesta de progresso quando o número de repetições varia.
      </Legenda>
    </Cartao>
  );
}

function Historico({ treinos, aoAbrir }: { treinos: TreinoDoc[]; aoAbrir: (id: string) => void }) {
  if (!treinos.length) return null;
  return (
    <Cartao>
      <TituloSecao>Histórico</TituloSecao>
      <div className="space-y-1">
        {treinos.slice(0, 20).map((t) => (
          <button key={t.id} onClick={() => aoAbrir(t.id)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-superficie2">
            <span className="w-11 shrink-0 text-[11px] text-fraco">{dataCurta(t.data)}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm">Treino {t.programa}</span>
              <span className="block truncate text-[11px] text-fraco">
                {t.exercicios.length} exercícios · {t.exercicios.reduce((s, e) => s + e.series.length, 0)} séries
              </span>
            </span>
            <span className="tabular shrink-0 text-[12px] text-suave">{numero(tonelagem(t))} kg</span>
          </button>
        ))}
      </div>
      {treinos.length === 0 && <Aviso tom="info">Nenhum treino ainda.</Aviso>}
    </Cartao>
  );
}
