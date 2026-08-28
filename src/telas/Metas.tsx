import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Meta, Eixo, ResultadoChave } from '../tipos';
import { EIXOS } from '../tipos';
import { trimestreAtual, diasRestantesDoTrimestre, porcento, numero } from '../formato';
import { metaModelo } from '../dados/sementes';
import {
  Cartao, TituloSecao, Botao, Campo, Entrada, Selecao, AreaTexto,
  Folha, Vazio, Barra, Legenda, Pilula, Metrica,
} from '../componentes/ui';

/** Progresso de um KR: onde você está entre o ponto de partida e o alvo. */
function progresso(kr: ResultadoChave) {
  const curso = kr.alvo - kr.inicio;
  if (curso === 0) return kr.atual >= kr.alvo ? 1 : 0;
  return Math.max(0, Math.min(1, (kr.atual - kr.inicio) / curso));
}

export default function Metas({ dados }: { dados: DadosApp }) {
  const trimestre = trimestreAtual();
  const restam = diasRestantesDoTrimestre();
  const decorrido = 1 - restam / 91;

  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Meta | null>(null);

  const doTrimestre = dados.metas.itens.filter((m) => m.trimestre === trimestre && m.status === 'ativa');
  const outras = dados.metas.itens.filter((m) => m.trimestre !== trimestre || m.status !== 'ativa');

  const geral = useMemo(() => {
    const krs = doTrimestre.flatMap((m) => m.krs);
    if (!krs.length) return 0;
    return krs.reduce((s, k) => s + progresso(k), 0) / krs.length;
  }, [doTrimestre]);

  function abrir(m: Meta | null) { setEditando(m); setAberta(true); }

  return (
    <div className="space-y-6">
      <Cartao>
        <TituloSecao acao={<Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Meta</Botao>}>
          {trimestre.replace('-T', ' · trimestre ')}
        </TituloSecao>

        {!doTrimestre.length ? (
          <div className="space-y-3">
            <Vazio titulo="Nenhuma meta neste trimestre">
              O formato aqui é objetivo + resultados-chave: uma frase que diz para onde você vai e dois a
              três números que provam que você chegou. Objetivo sem número vira intenção; número sem
              objetivo vira planilha.
              <br /><br />
              Além disso, cada meta pede <b>medidas de direção</b>: o que você faz toda semana e controla.
              O resultado é histórico — a medida de direção é a alavanca.
            </Vazio>
            <Botao variante="secundario" className="w-full"
              onClick={() => void dados.metas.salvar({ ...metaModelo(trimestre), criadoEm: new Date().toISOString() })}>
              Começar com uma meta modelo
            </Botao>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Metrica rotulo="Progresso" valor={porcento(geral)} tamanho="medio"
                cor={geral >= decorrido ? 'text-verde' : 'text-ouro'} />
              <Metrica rotulo="Trimestre" valor={porcento(decorrido)} tamanho="medio" detalhe="decorrido" />
              <Metrica rotulo="Faltam" valor={restam} tamanho="medio" detalhe="dias" />
            </div>
            <div className="mt-4">
              <Barra valor={geral} cor={geral >= decorrido ? 'var(--color-verde)' : 'var(--color-ouro)'} />
              <div className="mt-2">
                <Legenda>
                  {geral >= decorrido
                    ? 'Você está adiantado em relação ao calendário do trimestre. O ritmo atual entrega.'
                    : 'Você está atrás do calendário do trimestre. Não aumente a meta nem tente compensar num fim de semana — olhe as medidas de direção abaixo e ajuste a que você não cumpriu.'}
                </Legenda>
              </div>
            </div>
          </>
        )}
      </Cartao>

      {doTrimestre.map((m) => (
        <CartaoMeta key={m.id} meta={m} dados={dados} aoEditar={() => abrir(m)} decorrido={decorrido} />
      ))}

      {outras.length > 0 && (
        <Cartao>
          <TituloSecao>Outros trimestres</TituloSecao>
          <div className="space-y-1">
            {outras.map((m) => (
              <button key={m.id} onClick={() => abrir(m)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-superficie2">
                <span className="w-16 shrink-0 text-[11px] text-fraco">{m.trimestre}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-suave">{m.objetivo}</span>
                <Pilula>{m.status}</Pilula>
              </button>
            ))}
          </div>
        </Cartao>
      )}

      <FormularioMeta aberta={aberta} aoFechar={() => setAberta(false)} meta={editando}
        dados={dados} trimestre={trimestre} />
    </div>
  );
}

function CartaoMeta({
  meta, dados, aoEditar, decorrido,
}: { meta: Meta; dados: DadosApp; aoEditar: () => void; decorrido: number }) {
  const cor = EIXOS[meta.eixo].cor;

  async function atualizarKr(id: string, atual: number) {
    await dados.metas.salvar({
      id: meta.id,
      krs: meta.krs.map((k) => (k.id === id ? { ...k, atual } : k)),
    });
  }

  return (
    <Cartao>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <i className="h-2 w-2 rounded-full" style={{ background: cor }} />
            <span className="rotulo text-fraco">
              {EIXOS[meta.eixo].nome}
            </span>
          </div>
          <h3 className="titulo text-lg leading-snug">{meta.objetivo}</h3>
        </div>
        <button onClick={aoEditar} className="shrink-0 rounded-lg p-2 text-suave hover:bg-superficie2 hover:text-creme">
          <Pencil size={15} />
        </button>
      </div>

      {meta.porque && (
        <p className="mt-2 border-l-2 border-borda pl-3 text-[13px] leading-relaxed text-suave">{meta.porque}</p>
      )}

      <div className="mt-4 space-y-4">
        {meta.krs.map((kr) => {
          const p = progresso(kr);
          return (
            <div key={kr.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[13px]">{kr.nome}</span>
                <span className="tabular shrink-0 text-[12px] text-suave">
                  {numero(kr.atual)} / {numero(kr.alvo)} {kr.unidade}
                </span>
              </div>
              <Barra valor={p} cor={p >= decorrido ? 'var(--color-verde)' : cor} />
              <div className="mt-1.5 flex items-center gap-2">
                <Entrada type="number" inputMode="decimal" step="any" defaultValue={kr.atual}
                  onBlur={(e) => void atualizarKr(kr.id, Number(e.target.value) || 0)}
                  className="!w-28 !py-1.5 !text-[13px]" />
                <span className="text-[11px] text-fraco">atualize aqui · partiu de {numero(kr.inicio)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {meta.medidasDirecao.length > 0 && (
        <div className="mt-5 border-t border-borda2 pt-4">
          <div className="mb-2 rotulo text-fraco">
            Medidas de direção
          </div>
          <ul className="space-y-1.5">
            {meta.medidasDirecao.map((m, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-suave">
                <span className="text-fraco">—</span>{m}
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <Legenda>
              Estes são os itens que você controla. Quando o resultado não anda, o problema quase sempre
              está aqui — e não na meta.
            </Legenda>
          </div>
        </div>
      )}
    </Cartao>
  );
}

/** Id de resultado-chave: único dentro da meta, e estável entre renders. */
const novoKr = (i: number) => ({ id: `kr${i + 1}`, nome: '', unidade: '', inicio: 0, alvo: 0, atual: 0 });

function FormularioMeta({
  aberta, aoFechar, meta, dados, trimestre,
}: { aberta: boolean; aoFechar: () => void; meta: Meta | null; dados: DadosApp; trimestre: string }) {
  const [objetivo, setObjetivo] = useState('');
  const [porque, setPorque] = useState('');
  const [eixo, setEixo] = useState<Eixo>('dinheiro');
  const [krs, setKrs] = useState<ResultadoChave[]>([]);
  const [medidas, setMedidas] = useState('');
  const [chave, setChave] = useState('');

  const idAtual = meta?.id || 'nova';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setObjetivo(meta?.objetivo || '');
    setPorque(meta?.porque || '');
    setEixo(meta?.eixo || 'dinheiro');
    setKrs(meta?.krs || [novoKr(0)]);
    setMedidas((meta?.medidasDirecao || []).join('\n'));
  }
  if (!aberta && chave) setChave('');

  function mudarKr(id: string, campo: keyof ResultadoChave, valor: string) {
    setKrs(krs.map((k) => (k.id === id
      ? { ...k, [campo]: campo === 'nome' || campo === 'unidade' ? valor : Number(valor) || 0 }
      : k)));
  }

  async function gravar() {
    await dados.metas.salvar({
      id: meta?.id,
      objetivo: objetivo.trim(),
      porque: porque.trim(),
      eixo,
      trimestre: meta?.trimestre || trimestre,
      krs: krs.filter((k) => k.nome.trim()),
      medidasDirecao: medidas.split('\n').map((s) => s.trim()).filter(Boolean),
      status: meta?.status || 'ativa',
      criadoEm: meta?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={meta ? 'Editar meta' : 'Nova meta'}>
      <div className="space-y-4">
        <Campo rotulo="Objetivo" dica="Uma frase, qualitativa, que você reconheceria como vitória.">
          <Entrada value={objetivo} onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Sair do vermelho estrutural" />
        </Campo>

        <Campo rotulo="Por que isso importa"
          dica="Escreva aqui o motivo real. É o que você vai reler no dia em que quiser abandonar.">
          <AreaTexto rows={3} value={porque} onChange={(e) => setPorque(e.target.value)} />
        </Campo>

        <Campo rotulo="Eixo">
          <Selecao value={eixo} onChange={(e) => setEixo(e.target.value as Eixo)}>
            {(Object.keys(EIXOS) as Eixo[]).map((p) => (
              <option key={p} value={p}>{EIXOS[p].nome}</option>
            ))}
          </Selecao>
        </Campo>

        <div>
          <div className="mb-2 text-xs font-medium text-suave">Resultados-chave</div>
          <div className="space-y-3">
            {krs.map((kr) => (
              <div key={kr.id} className="rounded-xl border border-borda bg-superficie2 p-3">
                <Entrada value={kr.nome} onChange={(e) => mudarKr(kr.id, 'nome', e.target.value)}
                  placeholder="Sobra mensal" className="mb-2" />
                <div className="grid grid-cols-4 gap-2">
                  <Campo rotulo="De">
                    <Entrada type="number" inputMode="decimal" value={kr.inicio}
                      onChange={(e) => mudarKr(kr.id, 'inicio', e.target.value)} className="!py-1.5 !text-[13px]" />
                  </Campo>
                  <Campo rotulo="Para">
                    <Entrada type="number" inputMode="decimal" value={kr.alvo}
                      onChange={(e) => mudarKr(kr.id, 'alvo', e.target.value)} className="!py-1.5 !text-[13px]" />
                  </Campo>
                  <Campo rotulo="Hoje">
                    <Entrada type="number" inputMode="decimal" value={kr.atual}
                      onChange={(e) => mudarKr(kr.id, 'atual', e.target.value)} className="!py-1.5 !text-[13px]" />
                  </Campo>
                  <Campo rotulo="Unid.">
                    <Entrada value={kr.unidade} onChange={(e) => mudarKr(kr.id, 'unidade', e.target.value)}
                      placeholder="R$" className="!py-1.5 !text-[13px]" />
                  </Campo>
                </div>
                {krs.length > 1 && (
                  <button onClick={() => setKrs(krs.filter((k) => k.id !== kr.id))}
                    className="mt-2 text-[11px] text-fraco hover:text-perigo">remover</button>
                )}
              </div>
            ))}
          </div>
          {krs.length < 4 && (
            <Botao variante="fantasma" className="mt-2"
              onClick={() => setKrs([...krs, novoKr(krs.length)])}>
              <Plus size={14} />Resultado-chave
            </Botao>
          )}
        </div>

        <Campo rotulo="Medidas de direção (uma por linha)"
          dica="O que você faz toda semana e controla — não o resultado. Ex: 'uma proposta enviada por dia'.">
          <AreaTexto rows={3} value={medidas} onChange={(e) => setMedidas(e.target.value)} />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" onClick={() => void gravar()} className="flex-1" disabled={!objetivo.trim()}>
            Salvar
          </Botao>
          {meta && (
            <>
              <Botao variante="secundario"
                onClick={() => { void dados.metas.salvar({ id: meta.id, status: 'concluida' }); aoFechar(); }}>
                Concluir
              </Botao>
              <Botao variante="perigo" onClick={() => { void dados.metas.remover(meta.id); aoFechar(); }}>
                <Trash2 size={15} />
              </Botao>
            </>
          )}
        </div>
      </div>
    </Folha>
  );
}
