import { useMemo } from 'react';
import {
  Dumbbell, Wallet, TriangleAlert, Flame, Clock, MapPin, Repeat, CalendarDays, CircleCheck,
} from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Dia } from '../tipos';
import { EIXOS } from '../tipos';
import {
  hoje, dataPorExtenso, moeda, moedaCurta, mesAtual, numero, porcento, diaSemana, trimestreAtual,
  diasRestantesDoTrimestre,
} from '../formato';
import { estadoDoHabito, placarDoDia } from '../logica/habitos';
import { resumoDoMes } from '../logica/financas';
import { jurosMensaisDe } from '../logica/dividas';
import { itensDoDia, separarAfazeres } from '../logica/agenda';
import { PLANOS, programaPorId } from '../dados/programas';
import { planoAtivo, proximoPrograma } from '../logica/treino';
import { Cartao, TituloSecao, Botao, Barra, Aviso, Legenda, Metrica, Vazio } from '../componentes/ui';
import { ConviteDeFechamento } from '../componentes/FecharSemana';
import { BlocoIdeiaDoDia } from '../componentes/Ideias';

type Destino = 'dinheiro' | 'habitos' | 'treino' | 'metas' | 'briefing' | 'agenda' | 'estudo';

export default function Hoje({ dados, irPara }: { dados: DadosApp; irPara: (d: Destino) => void }) {
  const data = hoje();
  const dia = dados.porData.get(data) as Dia | undefined;
  const ativos = dados.habitos.itens.filter((h) => h.ativo);

  const estados = useMemo(
    () => ativos.map((h) => estadoDoHabito(h, dados.porData, data)),
    [ativos, dados.porData, data],
  );
  const doDia = estados.filter((e) => e.eraPraHoje);
  const emRisco = doDia.filter((e) => e.emRisco);
  const placar = placarDoDia(ativos, dia, data);

  const resumo = useMemo(
    () => resumoDoMes(dados.lancamentos.itens, mesAtual()),
    [dados.lancamentos.itens],
  );
  const juros = jurosMensaisDe(dados.dividas.itens);

  // O placar do objetivo declarado. Sem piso cadastrado não existe conta, e o
  // cartão diz isso em vez de inventar um número.
  const pisoFixo = dados.perfil.custoFixoMensal ?? resumo.saidasFixas;
  const cobertura = pisoFixo > 0 ? resumo.previsivel / pisoFixo : null;
  const falta = Math.max(0, pisoFixo - resumo.previsivel);

  const agenda = useMemo(() => {
    const fontes = {
      eventos: dados.eventos.itens, rotinas: dados.rotinas.itens, tarefas: dados.tarefas.itens,
    };
    return {
      itens: itensDoDia(data, fontes),
      atrasadas: separarAfazeres(dados.tarefas.itens, undefined, data).atrasadas,
    };
  }, [dados.eventos.itens, dados.rotinas.itens, dados.tarefas.itens, data]);
  const coresDeFrente = new Map(dados.frentes.itens.map((f) => [f.id, f.cor]));
  const treinouHoje = dados.treinos.itens.some((t) => t.data === data);
  const planoDeTreino = planoAtivo(dados.treinos.itens, PLANOS);
  const ehDiaDeTreino = planoDeTreino.diasSemana.includes(diaSemana(data));
  const proximoTreino = programaPorId(proximoPrograma(dados.treinos.itens, planoDeTreino));

  async function alternar(id: string) {
    const marcados = { ...(dia?.habitos || {}) };
    marcados[id] = !marcados[id];
    await dados.salvarDia({ id: data, habitos: marcados });
  }

  async function registrar(campo: 'humor' | 'energia' | 'sonoHoras', valor: number) {
    await dados.salvarDia({ id: data, [campo]: valor });
  }

  return (
    <div className="space-y-6">
      {/* O cartão claro sobre o preto — o movimento-assinatura da referência.
          Aparece UMA vez no app inteiro, aqui, e carrega o placar do objetivo
          declarado: receita previsível contra o piso de custo fixo. Um sistema
          de acompanhamento tem que abrir mostrando o placar do que se quer
          alcançar, não a data — a data cabe na linha de cima. */}
      <Cartao tom="destaque">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="rotulo text-fundo/70">
              {dataPorExtenso(data)} · {trimestreAtual().replace('-T', 'T')} — faltam{' '}
              {diasRestantesDoTrimestre()} dias
            </div>

            {cobertura === null ? (
              <>
                <h1 className="titulo mt-3 text-[32px] leading-none">Sem piso definido</h1>
                <p className="mt-3 max-w-md text-[13px] leading-relaxed text-fundo/70">
                  Cadastre o custo fixo em Ajustes para este cartão passar a mostrar o placar que
                  importa: quanto da sua conta do mês já está coberta por receita previsível.
                </p>
              </>
            ) : (
              <>
                <div className="rotulo mt-3 text-fundo/70">Previsível × piso fixo</div>
                <h1 className="tabular mt-1.5 text-[44px] leading-none tracking-[-0.03em]">
                  {porcento(cobertura)}
                </h1>
                <p className="mt-3 text-[13px] leading-relaxed text-fundo/70">
                  {moeda(resumo.previsivel)} de {moeda(pisoFixo)}
                  {falta > 0
                    ? ' — faltam ' + moeda(falta) + ' por mês para o mês parar de depender de evento avulso.'
                    : ' — o piso está coberto. O que entrar de avulso daqui é avanço.'}
                </p>
              </>
            )}
          </div>

          {placar.total > 0 && (
            <div className="shrink-0 text-right">
              <div className="rotulo text-fundo/70">hábitos</div>
              <div className="tabular mt-2 text-[32px] leading-none">{placar.feitos}/{placar.total}</div>
            </div>
          )}
        </div>
      </Cartao>

      {emRisco.length > 0 && (
        <Aviso>
          <div className="mb-1 flex items-center gap-1.5">
            <TriangleAlert size={15} />Hoje é o dia que decide
          </div>
          Você falhou no último dia programado de <b>{emRisco.map((e) => e.habito.nome).join(', ')}</b>.
          Faça só o piso — o piso existe para o dia ruim, não para o dia bom.
        </Aviso>
      )}

      {resumo.sobra < 0 && (
        <Aviso tom="alerta">
          Este mês está <b>{moeda(Math.abs(resumo.sobra))}</b> no vermelho
          {juros > 0 ? ', com ' + moedaCurta(juros) + ' só de juros' : ''}. Enquanto a sobra for negativa,
          nenhuma decisão de negócio é livre — ela é feita sob pressão de caixa.{' '}
          <button onClick={() => irPara('dinheiro')} className="underline">Ver o que dá para destravar</button>
        </Aviso>
      )}

      {/* Hábitos do dia — o gesto mais repetido do app fica no topo. */}
      <Cartao>
        <TituloSecao acao={
          <span className="tabular text-sm text-suave">{placar.feitos}/{placar.total}</span>
        }>Hábitos do dia</TituloSecao>

        {!doDia.length ? (
          <Vazio titulo="Nenhum hábito programado para hoje">
            <Botao variante="secundario" className="mt-3" onClick={() => irPara('habitos')}>
              Montar meus hábitos
            </Botao>
          </Vazio>
        ) : (
          <>
            <Barra valor={placar.taxa} cor={placar.taxa === 1 ? 'var(--color-verde)' : 'var(--color-brasa)'} />
            <div className="mt-3 space-y-1.5">
              {doDia.map((e) => (
                <button key={e.habito.id} onClick={() => void alternar(e.habito.id)}
                  className={'flex w-full items-center gap-3 rounded-sm px-2 py-2.5 text-left transition '
                    + (e.hoje ? 'opacity-60' : 'hover:bg-superficie2')}>
                  <span className={'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs '
                    + (e.hoje ? 'border-verde bg-verde text-fundo' : 'border-borda2')}>
                    {e.hoje ? '✓' : ''}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={'block truncate text-sm ' + (e.hoje ? 'line-through' : '')}>{e.habito.nome}</span>
                    {!e.hoje && e.habito.piso && (
                      <span className="block truncate text-[11px] text-fraco">piso: {e.habito.piso}</span>
                    )}
                  </span>
                  {e.sequencia > 0 && (
                    <span className="tabular flex shrink-0 items-center gap-1 text-[12px] text-ouro">
                      <Flame size={12} />{e.sequencia}
                    </span>
                  )}
                  <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EIXOS[e.habito.eixo].cor }} />
                </button>
              ))}
            </div>
          </>
        )}
      </Cartao>

      {/* O dia, do jeito que ele já está marcado. Fica logo abaixo dos hábitos
          porque a pergunta "o que eu tenho hoje" vem antes de qualquer outra —
          e porque afazer atrasado precisa aparecer sem você ir procurar. */}
      <Cartao>
        <TituloSecao acao={
          <Botao variante="fantasma" onClick={() => irPara('agenda')}>Abrir agenda</Botao>
        }>Agenda de hoje</TituloSecao>

        {agenda.atrasadas.length > 0 && (
          <button onClick={() => irPara('agenda')}
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-perigo/40 px-3 py-2 text-left text-[12px] text-perigo">
            <TriangleAlert size={14} className="shrink-0" />
            <span><b>{agenda.atrasadas.length === 1 ? '1 afazer atrasado' : agenda.atrasadas.length + ' afazeres atrasados'}</b> — o mais antigo é
              {' '}“{agenda.atrasadas[0].titulo}”.</span>
          </button>
        )}

        {!agenda.itens.length ? (
          <Vazio titulo="Nada marcado para hoje">
            Marque os compromissos e as rotinas de cada frente para o dia parar de ser decidido
            de manhã, no susto.
          </Vazio>
        ) : (
          <div className="space-y-1">
            {agenda.itens.map((i) => (
              <button key={i.chave} onClick={() => irPara('agenda')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-superficie2">
                {i.origem === 'rotina' ? <Repeat size={14} className="shrink-0 text-fraco" />
                  : i.origem === 'tarefa' ? <CircleCheck size={14} className={'shrink-0 ' + (i.feita ? 'text-verde' : 'text-fraco')} />
                  : <CalendarDays size={14} className="shrink-0 text-fraco" />}
                <span className="min-w-0 flex-1">
                  <span className={'block truncate text-sm ' + (i.feita ? 'text-fraco line-through' : '')}>{i.titulo}</span>
                  <span className="mt-0.5 flex items-center gap-2.5 text-[11px] text-fraco">
                    {i.hora && <span className="tabular flex items-center gap-1"><Clock size={10} />{i.hora}</span>}
                    {i.local && <span className="flex items-center gap-1 truncate"><MapPin size={10} />{i.local}</span>}
                  </span>
                </span>
                {i.frenteId && coresDeFrente.get(i.frenteId) && (
                  <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: coresDeFrente.get(i.frenteId) }} />
                )}
              </button>
            ))}
          </div>
        )}
      </Cartao>

      <ConviteDeFechamento dados={dados} data={data} />

      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => irPara('dinheiro')}
          className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 py-4 text-left transition hover:border-brasa/40">
          <Wallet size={20} className="shrink-0 text-brasa" />
          <span className="min-w-0">
            <span className="block text-sm font-medium">Lançar dinheiro</span>
            <span className="block truncate text-[11px] text-fraco">
              {resumo.lancamentos.length} lançamentos no mês
            </span>
          </span>
        </button>

        <button onClick={() => irPara('treino')}
          className={'flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition '
            + (treinouHoje ? 'border-verde/40' : ehDiaDeTreino ? 'border-brasa/40 bg-superficie hover:border-brasa/60' : 'border-borda bg-superficie')}>
          <Dumbbell size={20} className={'shrink-0 ' + (treinouHoje ? 'text-verde' : 'text-brasa')} />
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {treinouHoje ? 'Treino feito' : ehDiaDeTreino ? 'Treino de hoje' : 'Registrar treino'}
            </span>
            <span className="block truncate text-[11px] text-fraco">
              {treinouHoje ? 'bom trabalho' : 'próximo: ' + (proximoTreino?.nome || 'Treino livre')}
            </span>
          </span>
        </button>
      </div>

      <Cartao tom="calmo">
        <TituloSecao>Como você está</TituloSecao>
        <div className="space-y-4">
          <Escala rotulo="Humor" valor={dia?.humor} aoEscolher={(v) => void registrar('humor', v)} />
          <Escala rotulo="Energia" valor={dia?.energia} aoEscolher={(v) => void registrar('energia', v)} />

          {/* Sono entra aqui, no gesto que já é diário, e não numa tela própria:
              para quem trabalha de madrugada é a variável que mais mexe em fome,
              recuperação e humor — e a que mais explica semana ruim. */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium text-suave">Sono desta noite</span>
              <span className="text-[11px] text-fraco">
                {dia?.sonoHoras ? numero(dia.sonoHoras, 1) + ' h' : 'sem registro'}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[4, 5, 6, 7, 8, 9].map((h) => (
                <button key={h} onClick={() => void registrar('sonoHoras', h)}
                  className={'rounded-sm py-3 text-sm transition-colors '
                    + (dia?.sonoHoras === h
                      ? 'bg-creme text-fundo'
                      : 'bg-superficie2 text-suave hover:text-creme')}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Legenda>
            Três toques por dia. Depois de algumas semanas isso deixa de ser diário e vira dado: dá para
            ver se a queda de humor vem antes ou depois da semana em que os hábitos caem, e o quanto do
            resto é só noite mal dormida — que é o fator que mais atrapalha comida e treino.
          </Legenda>
        </div>
      </Cartao>

      {/* Escura de propósito: o cartão claro desta tela é o previsível ÷ piso,
          e dois claros na mesma tela anulam o contraste dos dois. Fica aqui, no
          fim, porque não é urgência — é a única coisa da tela que trata do ano
          que vem em vez do dia de hoje. */}
      <BlocoIdeiaDoDia dados={dados} tom="escuro" aoVerEstante={() => irPara('estudo')} />

      <Cartao>
        <TituloSecao>O mês</TituloSecao>
        <div className="grid grid-cols-3 gap-3">
          <Metrica rotulo="Sobra" valor={moedaCurta(resumo.sobra)} tamanho="medio"
            cor={resumo.sobra >= 0 ? 'text-verde' : 'text-perigo'} />
          <Metrica rotulo="Previsível" valor={moedaCurta(resumo.previsivel)} tamanho="medio" />
          <Metrica rotulo="Hábitos 30d" tamanho="medio"
            valor={porcento(estados.length
              ? estados.reduce((s, e) => s + e.ultimos30.taxa, 0) / estados.length
              : 0)} />
        </div>
        <div className="mt-4 flex gap-2">
          <Botao variante="secundario" className="flex-1" onClick={() => irPara('metas')}>Metas</Botao>
          <Botao variante="secundario" className="flex-1" onClick={() => irPara('briefing')}>Briefing</Botao>
        </div>
      </Cartao>
    </div>
  );
}

function Escala({
  rotulo, valor, aoEscolher,
}: { rotulo: string; valor?: number; aoEscolher: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-suave">{rotulo}</span>
        <span className="text-[11px] text-fraco">{valor ? valor + '/5' : 'sem registro'}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => aoEscolher(n)}
            className={'rounded-sm py-3 text-sm font-medium transition '
              + (valor === n ? 'bg-creme text-fundo' : 'bg-superficie2 text-suave hover:text-creme')}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
