import { useMemo, useState } from 'react';
import { Plus, Trash2, Flame, TriangleAlert } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Habito, Eixo } from '../tipos';
import { EIXOS } from '../tipos';
import { hoje, somaDias, diaSemanaCurto, dataPorExtenso, porcento, DIAS_LONGOS } from '../formato';
import { estadoDoHabito, ehDiaDe, feitoEm, placarDoDia } from '../logica/habitos';
import { HABITOS_SUGERIDOS } from '../dados/sementes';
import {
  Cartao, TituloSecao, Botao, Campo, Entrada, Selecao, Folha, Vazio, Barra,
  Aviso, Legenda, Pilula,
} from '../componentes/ui';

export default function Habitos({ dados }: { dados: DadosApp }) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Habito | null>(null);
  const data = hoje();

  const ativos = dados.habitos.itens.filter((h) => h.ativo);
  const estados = useMemo(
    () => ativos.map((h) => estadoDoHabito(h, dados.porData, data)),
    [ativos, dados.porData, data],
  );
  const emRisco = estados.filter((e) => e.emRisco);
  const placar = placarDoDia(ativos, dados.porData.get(data), data);

  async function alternar(h: Habito) {
    const dia = dados.porData.get(data) as { habitos?: Record<string, boolean> } | undefined;
    const marcados = { ...(dia?.habitos || {}) };
    marcados[h.id] = !marcados[h.id];
    await dados.salvarDia({ id: data, habitos: marcados });
  }

  async function semear() {
    const agora = new Date().toISOString();
    for (const h of HABITOS_SUGERIDOS) await dados.habitos.salvar({ ...h, criadoEm: agora });
  }

  function abrir(h: Habito | null) { setEditando(h); setAberta(true); }

  return (
    <div className="space-y-6">
      <Cartao>
        <TituloSecao acao={<Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Hábito</Botao>}>
          {dataPorExtenso(data)}
        </TituloSecao>

        {!ativos.length ? (
          <div className="space-y-3">
            <Vazio titulo="Nenhum hábito ainda">
              Um hábito aqui tem quatro partes: o nome, o <b>piso</b> (a versão de dois minutos que ainda
              conta como feito), e <b>quando</b> e <b>onde</b> ele acontece. Sem piso, você troca constância
              por intensidade — e é a constância que compõe.
            </Vazio>
            <Botao variante="secundario" onClick={() => void semear()} className="w-full">
              Começar com oito hábitos sugeridos
            </Botao>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="rotulo text-fraco">Dia de hoje</span>
                <span className="tabular text-sm">{placar.feitos}/{placar.total}</span>
              </div>
              <Barra valor={placar.taxa} cor={placar.taxa === 1 ? 'var(--color-verde)' : 'var(--color-brasa)'} />
            </div>

            {emRisco.length > 0 && (
              <div className="mb-4">
                <Aviso>
                  <div className="mb-1 flex items-center gap-1.5">
                    <TriangleAlert size={15} />Nunca duas faltas seguidas
                  </div>
                  Você já falhou no último dia programado de: <b>{emRisco.map((e) => e.habito.nome).join(', ')}</b>.
                  Uma falta é ruído; duas viram o novo padrão. Hoje faça só o piso — ele existe exatamente
                  para dias assim.
                </Aviso>
              </div>
            )}

            <div className="space-y-2">
              {estados.map((e) => (
                <LinhaHabito key={e.habito.id} estado={e}
                  aoAlternar={() => void alternar(e.habito)} aoAbrir={() => abrir(e.habito)} />
              ))}
            </div>
          </>
        )}
      </Cartao>

      {ativos.length > 0 && <QuinzeDias dados={dados} habitos={ativos} />}
      {ativos.length > 0 && <Constancia estados={estados} />}

      <FormularioHabito aberta={aberta} aoFechar={() => setAberta(false)} habito={editando} dados={dados} />
    </div>
  );
}

function LinhaHabito({
  estado, aoAlternar, aoAbrir,
}: { estado: ReturnType<typeof estadoDoHabito>; aoAlternar: () => void; aoAbrir: () => void }) {
  const { habito: h, hoje: feito, eraPraHoje, sequencia } = estado;
  const cor = EIXOS[h.eixo].cor;

  return (
    <div className={'flex items-start gap-3 rounded-xl border px-3 py-3 transition '
      + (feito ? 'border-verde/30' : eraPraHoje ? 'border-borda bg-superficie2' : 'border-transparent opacity-45')}>
      <button onClick={aoAlternar} aria-label={feito ? 'Desmarcar' : 'Marcar como feito'}
        className={'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm transition '
          + (feito ? 'border-verde bg-verde text-fundo' : 'border-borda2 hover:border-suave')}>
        {feito ? '✓' : ''}
      </button>

      <button onClick={aoAbrir} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className={'text-sm font-medium ' + (feito ? 'text-suave' : '')}>{h.nome}</span>
          <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cor }} />
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-fraco">
          {eraPraHoje ? h.piso : 'não é dia deste hábito'}
        </div>
        {eraPraHoje && (h.quando || h.onde) && (
          <div className="mt-1 text-[11px] text-fraco">
            {[h.quando, h.onde].filter(Boolean).join(' · ')}
          </div>
        )}
      </button>

      {sequencia > 0 && (
        <span className="tabular mt-0.5 flex shrink-0 items-center gap-1 text-[12px] font-medium text-ouro">
          <Flame size={13} />{sequencia}
        </span>
      )}
    </div>
  );
}

function QuinzeDias({ dados, habitos }: { dados: DadosApp; habitos: Habito[] }) {
  const dias = useMemo(
    () => Array.from({ length: 15 }, (_, i) => somaDias(hoje(), -(14 - i))),
    [],
  );

  return (
    <Cartao>
      <TituloSecao>Últimos 15 dias</TituloSecao>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th className="w-36" />
              {dias.map((d) => (
                <th key={d} className="pb-1 text-center text-[9px] font-medium uppercase text-fraco">
                  {diaSemanaCurto(d)[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitos.map((h) => (
              <tr key={h.id}>
                <td className="max-w-36 truncate pr-3 text-[12px] text-suave">{h.nome}</td>
                {dias.map((d) => {
                  const alvo = ehDiaDe(h, d);
                  const feito = feitoEm(dados.porData, h.id, d);
                  return (
                    <td key={d} className="text-center">
                      <span className="mx-auto block h-4 w-4 rounded"
                        title={d}
                        style={{
                          background: feito ? EIXOS[h.eixo].cor : alvo ? 'var(--color-superficie2)' : 'transparent',
                          border: !feito && alvo ? '1px solid var(--color-borda)' : 'none',
                          opacity: feito ? 1 : 0.9,
                        }} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legenda>
        Quadrado vazio é dia programado que não aconteceu. Espaço em branco não é falha — é dia que o
        hábito nem estava marcado. O que você procura aqui não é a linha perfeita: é o buraco duplo.
      </Legenda>
    </Cartao>
  );
}

function Constancia({ estados }: { estados: ReturnType<typeof estadoDoHabito>[] }) {
  const ordenados = [...estados].sort((a, b) => a.ultimos30.taxa - b.ultimos30.taxa);
  const pior = ordenados[0];

  return (
    <Cartao>
      <TituloSecao>Constância em 30 dias</TituloSecao>
      <div className="space-y-3">
        {ordenados.map((e) => (
          <div key={e.habito.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[12px]">
              <span className="truncate text-suave">{e.habito.nome}</span>
              <span className="tabular shrink-0 text-fraco">
                {e.ultimos30.feitos}/{e.ultimos30.alvos} · {porcento(e.ultimos30.taxa)}
              </span>
            </div>
            <Barra valor={e.ultimos30.taxa} cor={EIXOS[e.habito.eixo].cor} />
          </div>
        ))}
      </div>
      {pior && pior.ultimos30.alvos >= 4 && pior.ultimos30.taxa < 0.5 && (
        <div className="mt-4">
          <Legenda>
            <b>{pior.habito.nome}</b> está abaixo da metade. Antes de tentar mais disciplina, tente um
            piso menor: se o piso ainda parece trabalho, ele está alto demais. Um hábito que você cumpre
            em 90% dos dias na versão mínima vale mais que o ideal cumprido em 30%.
          </Legenda>
        </div>
      )}
    </Cartao>
  );
}

function FormularioHabito({
  aberta, aoFechar, habito, dados,
}: { aberta: boolean; aoFechar: () => void; habito: Habito | null; dados: DadosApp }) {
  const [nome, setNome] = useState('');
  const [piso, setPiso] = useState('');
  const [quando, setQuando] = useState('');
  const [onde, setOnde] = useState('');
  const [depoisDe, setDepoisDe] = useState('');
  const [eixo, setEixo] = useState<Eixo>('corpo');
  const [dias, setDias] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [chave, setChave] = useState('');

  const idAtual = habito?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setNome(habito?.nome || '');
    setPiso(habito?.piso || '');
    setQuando(habito?.quando || '');
    setOnde(habito?.onde || '');
    setDepoisDe(habito?.depoisDe || '');
    setEixo(habito?.eixo || 'corpo');
    setDias(habito?.dias || [0, 1, 2, 3, 4, 5, 6]);
  }
  if (!aberta && chave) setChave('');

  async function gravar() {
    await dados.habitos.salvar({
      id: habito?.id,
      nome: nome.trim(),
      piso: piso.trim(),
      quando: quando.trim(),
      onde: onde.trim(),
      depoisDe: depoisDe.trim(),
      eixo,
      dias: dias.length ? dias : [0, 1, 2, 3, 4, 5, 6],
      ativo: true,
      ordem: habito?.ordem ?? Date.now(),
      criadoEm: habito?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={habito ? 'Editar hábito' : 'Novo hábito'}>
      <div className="space-y-4">
        <Campo rotulo="Hábito">
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Treino de força" />
        </Campo>

        <Campo rotulo="Piso — o que conta como feito num dia ruim"
          dica="Deve ser pequeno a ponto de parecer bobo. É ele que mantém a corrente viva quando o dia desanda.">
          <Entrada value={piso} onChange={(e) => setPiso(e.target.value)}
            placeholder="Vestir a roupa e entrar na academia" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Quando">
            <Entrada value={quando} onChange={(e) => setQuando(e.target.value)} placeholder="17h" />
          </Campo>
          <Campo rotulo="Onde">
            <Entrada value={onde} onChange={(e) => setOnde(e.target.value)} placeholder="Academia" />
          </Campo>
        </div>

        <Campo rotulo="Logo depois de… (opcional)"
          dica="Encaixar um hábito novo logo depois de um que já é automático dá a ele um gatilho pronto.">
          <Entrada value={depoisDe} onChange={(e) => setDepoisDe(e.target.value)} placeholder="Tomar café" />
        </Campo>

        <Campo rotulo="Eixo">
          <Selecao value={eixo} onChange={(e) => setEixo(e.target.value as Eixo)}>
            {(Object.keys(EIXOS) as Eixo[]).map((p) => (
              <option key={p} value={p}>{EIXOS[p].nome}</option>
            ))}
          </Selecao>
        </Campo>

        <Campo rotulo="Dias">
          <div className="grid grid-cols-7 gap-1.5">
            {DIAS_LONGOS.map((nomeDia, i) => (
              <button key={i}
                onClick={() => setDias(dias.includes(i) ? dias.filter((d) => d !== i) : [...dias, i])}
                title={nomeDia}
                className={'rounded-lg py-2 text-[11px] font-medium transition '
                  + (dias.includes(i) ? 'bg-brasa text-fundo' : 'bg-superficie2 text-fraco')}>
                {nomeDia.slice(0, 1)}
              </button>
            ))}
          </div>
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" onClick={() => void gravar()} className="flex-1" disabled={!nome.trim()}>
            Salvar
          </Botao>
          {habito && (
            <>
              <Botao variante="secundario" onClick={() => { void dados.habitos.salvar({ id: habito.id, ativo: false }); aoFechar(); }}>
                Pausar
              </Botao>
              <Botao variante="perigo" onClick={() => { void dados.habitos.remover(habito.id); aoFechar(); }}>
                <Trash2 size={15} />
              </Botao>
            </>
          )}
        </div>

        {habito && !habito.ativo && (
          <Pilula>pausado — salvar reativa</Pilula>
        )}
      </div>
    </Folha>
  );
}
