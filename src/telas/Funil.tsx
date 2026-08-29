/**
 * Funil — cota de patrocínio, contrato de gestão, evento contratado.
 *
 * É o módulo que ataca a receita previsível de frente, e o desenho inteiro gira
 * em torno de uma disciplina só: **toda oportunidade em andamento tem um
 * próximo passo com data.** Sem isso ela não está em andamento — está parada, e
 * a tela começa por elas em vez de começar pelo total, que é a métrica
 * confortável e inútil.
 *
 * A segunda coisa que ele faz e que planilha nenhuma faz: diz quanto precisa
 * entrar em conversa para fechar o que você precisa fechar. "Preciso de mais
 * patrocínio" vira número de ligações.
 */
import { useMemo, useState } from 'react';
import { Plus, Trash2, Phone, TriangleAlert, ArrowRight } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Oportunidade, EtapaFunil } from '../tipos';
import { moeda, moedaCurta, porcento, hoje, dataCurta } from '../formato';
import {
  ETAPAS, EM_ANDAMENTO, resumoDoFunil, taxaReal, pipelineNecessario, motivosDePerda,
} from '../logica/funil';
import { resumoDoMes } from '../logica/financas';
import { mesAtual } from '../formato';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, AreaTexto, Selecao,
  Folha, Vazio, Legenda, Aviso, Pilula,
} from '../componentes/ui';
import { EscolhaDeFrente } from '../componentes/Frentes';

export default function Funil({ dados }: { dados: DadosApp }) {
  const data = hoje();
  const itens = dados.oportunidades.itens;
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Oportunidade | null>(null);

  const r = useMemo(() => resumoDoFunil(itens, data), [itens, data]);
  const t = useMemo(() => taxaReal(itens), [itens]);

  // O alvo é o buraco de receita previsível: o que falta para o piso fixo ser
  // coberto sem depender de evento avulso. É o número que o app inteiro persegue.
  const resumo = useMemo(() => resumoDoMes(dados.lancamentos.itens, mesAtual()), [dados.lancamentos.itens]);
  const pisoFixo = dados.perfil.custoFixoMensal ?? resumo.saidasFixas;
  const alvoMensal = Math.max(0, pisoFixo - resumo.previsivel);
  const p = useMemo(() => pipelineNecessario(alvoMensal * 12, itens), [alvoMensal, itens]);

  function abrir(o: Oportunidade | null) { setEditando(o); setAberta(true); }

  if (!itens.length) {
    return (
      <div className="space-y-6">
        <Cartao>
          <TituloSecao acao={
            <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Oportunidade</Botao>
          }>Funil</TituloSecao>
          <Vazio titulo="Nenhuma oportunidade">
            Cota de patrocínio, contrato de gestão, evento contratado. Cada uma com valor, etapa e —
            o campo que decide tudo — o próximo passo com data. Prospecção que vive em conversa de
            WhatsApp não tem etapa nem retorno marcado, e por isso morre sem ninguém perceber.
          </Vazio>
        </Cartao>
        <FormularioOportunidade aberta={aberta} aoFechar={() => setAberta(false)}
          oportunidade={editando} dados={dados} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* As paradas vêm antes do total. Total é a métrica confortável; parada é
          a que cobra ação — e é por elas que um funil morre. */}
      {r.paradas.length > 0 && (
        <Cartao>
          <TituloSecao acao={
            <span className="tabular text-sm text-perigo">{r.paradas.length}</span>
          }>Paradas</TituloSecao>
          <Legenda>
            Sem próximo passo marcado, ou com a data já vencida. Em venda de ticket alto, o que
            prevê fechamento não é entusiasmo — é sair de toda conversa com um avanço combinado.
          </Legenda>
          <div className="mt-4 space-y-1">
            {r.paradas.map((o) => (
              <button key={o.id} onClick={() => abrir(o)}
                className="flex w-full items-center gap-3 rounded-sm px-2 py-2.5 text-left transition-colors hover:bg-superficie2">
                <TriangleAlert size={14} className="shrink-0 text-perigo" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{o.empresa}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-fraco">
                    {ETAPAS[o.etapa].nome}
                    {o.proximoEm ? ' · passo vencido em ' + dataCurta(o.proximoEm) : ' · sem próximo passo'}
                  </span>
                </span>
                <span className="tabular shrink-0 text-[13px] text-suave">{moedaCurta(o.valor)}</span>
              </button>
            ))}
          </div>
        </Cartao>
      )}

      <Cartao>
        <TituloSecao acao={
          <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Oportunidade</Botao>
        }>Funil</TituloSecao>

        <div className="grid grid-cols-3 gap-3">
          <Metrica rotulo="Ponderado" valor={moedaCurta(r.ponderado)} tamanho="medio"
            cor="text-verde" detalhe={'de ' + moedaCurta(r.total) + ' em conversa'} />
          <Metrica rotulo="Em andamento" valor={String(r.quantidade)} tamanho="medio"
            detalhe={r.paradas.length ? r.paradas.length + ' parada(s)' : 'todas com passo'} />
          <Metrica rotulo="Fechado" valor={moedaCurta(r.fechado)} tamanho="medio"
            cor={r.fechado ? 'text-verde' : 'text-fraco'}
            detalhe={r.recorrenteFechado ? moedaCurta(r.recorrenteFechado) + ' recorrente' : 'nenhum recorrente'} />
        </div>

        <div className="mt-4">
          <Legenda>
            Ponderado é a soma dos valores multiplicada pela chance de cada etapa — o número que se
            usa para planejar, porque o total bruto sempre mente para cima.
          </Legenda>
        </div>
      </Cartao>

      {/* A conta que transforma "preciso de mais patrocínio" em ligações. */}
      {alvoMensal > 0 && (
        <Cartao tom="calmo">
          <TituloSecao>Quanto precisa entrar em conversa</TituloSecao>
          <Legenda>
            Faltam <span className="tabular text-creme">{moeda(alvoMensal)}</span> por mês de receita
            previsível para o seu piso fixo ficar coberto — {moeda(alvoMensal * 12)} no ano.
          </Legenda>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metrica rotulo="Taxa usada" valor={porcento(p.taxa)} tamanho="medio"
              cor={p.usandoReal ? 'text-verde' : 'text-suave'}
              detalhe={p.usandoReal ? 'sua taxa real' : 'referência, até 10 decididas'} />
            <Metrica rotulo="Pipeline necessário" valor={moedaCurta(p.necessario)} tamanho="medio"
              detalhe="em conversa" />
            <Metrica rotulo="Falta prospectar" valor={moedaCurta(p.falta)} tamanho="medio"
              cor={p.falta > 0 ? 'text-ouro' : 'text-verde'}
              detalhe={p.falta > 0 ? 'em oportunidade nova' : 'pipeline suficiente'} />
          </div>

          <div className="mt-4">
            <Legenda>
              A conta é simples e quase ninguém faz: se uma em cada cinco conversas fecha, você
              precisa de cinco vezes o alvo em conversa. Prospectar de menos e culpar o mercado é o
              erro mais comum de quem vende cota.
              {t.decididas > 0 && !t.confiavel && (
                <> Você tem {t.decididas} oportunidade(s) decidida(s); com dez, a sua taxa real
                substitui a referência.</>
              )}
            </Legenda>
          </div>
        </Cartao>
      )}

      {r.porEtapa.filter((e) => e.itens.length).map(({ etapa, itens: lista, soma }) => (
        <Cartao key={etapa}>
          <TituloSecao acao={
            <span className="tabular text-sm text-suave">{moedaCurta(soma)}</span>
          }>{ETAPAS[etapa].nome}</TituloSecao>

          <div className="space-y-1">
            {lista.map((o) => (
              <button key={o.id} onClick={() => abrir(o)}
                className="w-full rounded-sm px-2 py-2.5 text-left transition-colors hover:bg-superficie2">
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{o.empresa}</span>
                  {o.recorrente && <Pilula cor="#A0CA92">temporada</Pilula>}
                  <span className="tabular shrink-0 text-[13px] text-suave">{moedaCurta(o.valor)}</span>
                </span>
                {o.proximoPasso && (
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-fraco">
                    <ArrowRight size={11} className="shrink-0" />
                    <span className="truncate">{o.proximoPasso}</span>
                    {o.proximoEm && <span className="tabular shrink-0">· {dataCurta(o.proximoEm)}</span>}
                  </span>
                )}
                {o.dor && (
                  <span className="mt-1 block truncate text-[11px] text-fraco">“{o.dor}”</span>
                )}
              </button>
            ))}
          </div>
        </Cartao>
      ))}

      <BlocoPerdas oportunidades={itens} aoAbrir={abrir} />

      <FormularioOportunidade aberta={aberta} aoFechar={() => setAberta(false)}
        oportunidade={editando} dados={dados} />
    </div>
  );
}

/** A autópsia. Funil que só olha o que ganhou repete o que perdeu. */
function BlocoPerdas({
  oportunidades, aoAbrir,
}: { oportunidades: Oportunidade[]; aoAbrir: (o: Oportunidade) => void }) {
  const perdidas = oportunidades.filter((o) => o.etapa === 'perdido');
  const motivos = motivosDePerda(oportunidades);
  const t = taxaReal(oportunidades);

  if (!perdidas.length) return null;

  return (
    <Cartao>
      <TituloSecao acao={
        <span className="tabular text-sm text-suave">
          {t.decididas ? porcento(t.taxa) + ' de conversão' : ''}
        </span>
      }>Perdidas</TituloSecao>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {motivos.map(([motivo, n]) => (
          <span key={motivo} className="text-[13px] text-suave">
            {motivo} <span className="tabular text-fraco">×{n}</span>
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-1 border-t border-borda2 pt-3">
        {perdidas.slice(0, 6).map((o) => (
          <button key={o.id} onClick={() => aoAbrir(o)}
            className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-superficie2">
            <span className="min-w-0 flex-1 truncate text-[13px] text-fraco">{o.empresa}</span>
            <span className="tabular shrink-0 text-[12px] text-fraco">{moedaCurta(o.valor)}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Legenda>
          Motivo que se repete três vezes não é azar: é a sua oferta, o seu preço ou o seu momento
          de abordagem. É a informação mais barata que um funil produz, e a que quase todo mundo
          joga fora ao apagar a oportunidade perdida.
        </Legenda>
      </div>
    </Cartao>
  );
}

function FormularioOportunidade({
  aberta, aoFechar, oportunidade, dados,
}: { aberta: boolean; aoFechar: () => void; oportunidade: Oportunidade | null; dados: DadosApp }) {
  const [v, setV] = useState({
    empresa: '', contato: '', telefone: '', etapa: 'lista' as EtapaFunil,
    valor: '', recorrente: false, frenteId: undefined as string | undefined,
    proximoPasso: '', proximoEm: '', previsaoEm: '', dor: '', nota: '', motivoPerda: '',
  });
  const [chave, setChave] = useState('');

  const idAtual = oportunidade?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setV({
      empresa: oportunidade?.empresa || '',
      contato: oportunidade?.contato || '',
      telefone: oportunidade?.telefone || '',
      etapa: oportunidade?.etapa || 'lista',
      valor: oportunidade ? String(oportunidade.valor) : '',
      recorrente: oportunidade?.recorrente ?? false,
      frenteId: oportunidade?.frenteId,
      proximoPasso: oportunidade?.proximoPasso || '',
      proximoEm: oportunidade?.proximoEm || '',
      previsaoEm: oportunidade?.previsaoEm || '',
      dor: oportunidade?.dor || '',
      nota: oportunidade?.nota || '',
      motivoPerda: oportunidade?.motivoPerda || '',
    });
  }
  if (!aberta && chave) setChave('');

  const emAberto = EM_ANDAMENTO.includes(v.etapa);
  const semPasso = emAberto && (!v.proximoPasso.trim() || !v.proximoEm);

  async function gravar() {
    await dados.oportunidades.salvar({
      id: oportunidade?.id,
      empresa: v.empresa.trim() || 'Empresa',
      contato: v.contato.trim() || undefined,
      telefone: v.telefone.trim() || undefined,
      etapa: v.etapa,
      valor: Number(v.valor) || 0,
      recorrente: v.recorrente,
      frenteId: v.frenteId,
      proximoPasso: v.proximoPasso.trim() || undefined,
      proximoEm: v.proximoEm || undefined,
      previsaoEm: v.previsaoEm || undefined,
      dor: v.dor.trim() || undefined,
      nota: v.nota.trim() || undefined,
      motivoPerda: v.etapa === 'perdido' ? (v.motivoPerda.trim() || undefined) : undefined,
      criadoEm: oportunidade?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar}
      titulo={oportunidade ? oportunidade.empresa : 'Nova oportunidade'}>
      <div className="space-y-4">
        <Campo rotulo="Empresa">
          <Entrada value={v.empresa} onChange={(e) => setV({ ...v, empresa: e.target.value })}
            placeholder="Rede de academias X" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Quem decide" dica="Nome de quem assina, não de quem atende.">
            <Entrada value={v.contato} onChange={(e) => setV({ ...v, contato: e.target.value })}
              placeholder="Marina, sócia" />
          </Campo>
          <Campo rotulo="Telefone">
            <Entrada value={v.telefone} onChange={(e) => setV({ ...v, telefone: e.target.value })}
              placeholder="(71) 9…" />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Etapa">
            <Selecao value={v.etapa}
              onChange={(e) => setV({ ...v, etapa: e.target.value as EtapaFunil })}>
              {(Object.keys(ETAPAS) as EtapaFunil[])
                .sort((a, b) => ETAPAS[a].ordem - ETAPAS[b].ordem)
                .map((k) => <option key={k} value={k}>{ETAPAS[k].nome}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Valor (R$)">
            <Entrada type="number" inputMode="decimal" value={v.valor}
              onChange={(e) => setV({ ...v, valor: e.target.value })} placeholder="30000" />
          </Campo>
        </div>

        {/* Recorrente é o campo que muda o valor estratégico da oportunidade:
            temporada inteira vira receita previsível, edição única não. */}
        <button onClick={() => setV({ ...v, recorrente: !v.recorrente })}
          className={'flex w-full items-center gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors '
            + (v.recorrente ? 'border-verde' : 'border-borda2 bg-superficie2')}>
          <span className={'flex h-5 w-5 items-center justify-center rounded-sm border text-[11px] '
            + (v.recorrente ? 'border-verde bg-verde text-fundo' : 'border-borda2')}>
            {v.recorrente ? '✓' : ''}
          </span>
          <span>
            <span className="block text-sm">Temporada inteira, não edição única</span>
            <span className="block text-[11px] text-fraco">
              É o que vira receita previsível e empurra o placar do app
            </span>
          </span>
        </button>

        <EscolhaDeFrente frentes={dados.frentes.itens.filter((f) => f.ativo)}
          valor={v.frenteId} aoMudar={(id) => setV({ ...v, frenteId: id })}
          rotulo="De qual frente" />

        <Campo rotulo="O que ela precisa resolver"
          dica="Com as palavras dela, não com as suas. Proposta em cima da dor declarada fecha; em cima do que você supõe, vira comparação de preço.">
          <AreaTexto rows={2} value={v.dor} onChange={(e) => setV({ ...v, dor: e.target.value })}
            placeholder="Não conseguem alcançar público de 25 a 40 anos que já pratica esporte" />
        </Campo>

        {emAberto && (
          <div className={'rounded-sm border p-3.5 ' + (semPasso ? 'border-perigo/40' : 'border-borda2')}>
            <div className="rotulo mb-2 text-fraco">O próximo passo</div>
            <div className="space-y-3">
              <Entrada value={v.proximoPasso}
                onChange={(e) => setV({ ...v, proximoPasso: e.target.value })}
                placeholder="Levar na arena numa quinta à noite" />
              <Entrada type="date" value={v.proximoEm}
                onChange={(e) => setV({ ...v, proximoEm: e.target.value })} />
            </div>
            {semPasso && (
              <div className="mt-3">
                <Aviso>
                  Sem próximo passo com data, esta oportunidade entra na lista de paradas. Conversa
                  que termina em “vou pensar” sem data marcada é conversa perdida, mesmo quando
                  parece boa.
                </Aviso>
              </div>
            )}
          </div>
        )}

        {emAberto && (
          <Campo rotulo="Previsão de entrada do dinheiro"
            dica="Diferente do próximo passo: o passo é a próxima conversa, isto é o caixa. Só com esta data a oportunidade aparece na projeção de 90 dias — e sempre pelo valor ponderado pela etapa, nunca cheio.">
            <Entrada type="date" value={v.previsaoEm}
              onChange={(e) => setV({ ...v, previsaoEm: e.target.value })} />
          </Campo>
        )}

        {v.etapa === 'perdido' && (
          <Campo rotulo="Por que perdeu"
            dica="Seja específico: preço, timing, decisor errado, sem verba, foi para o concorrente. Motivo repetido três vezes não é azar.">
            <Entrada value={v.motivoPerda}
              onChange={(e) => setV({ ...v, motivoPerda: e.target.value })}
              placeholder="Sem verba neste semestre" />
          </Campo>
        )}

        <Campo rotulo="Nota">
          <AreaTexto rows={2} value={v.nota} onChange={(e) => setV({ ...v, nota: e.target.value })} />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!v.empresa.trim()}>Salvar</Botao>
          {v.telefone && (
            <a href={'tel:' + v.telefone.replace(/\D/g, '')}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-superficie2 px-3.5 py-2.5 text-sm text-creme transition-colors hover:bg-borda2">
              <Phone size={15} />
            </a>
          )}
          {oportunidade && (
            <Botao variante="perigo"
              onClick={() => { void dados.oportunidades.remover(oportunidade.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>
      </div>
    </Folha>
  );
}
