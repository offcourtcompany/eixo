/**
 * Consultor — a leitura de todas as áreas, num lugar só.
 *
 * Ele responde a pergunta que nenhuma tela responde sozinha: *isto está sendo
 * levado de um jeito saudável?* E responde com duas ressalvas ditas em voz alta
 * na própria tela.
 *
 * **Não é IA.** São regras determinísticas sobre os seus dados. Funciona
 * offline, custa zero e nunca inventa. A conversa de verdade — em que dá para
 * discordar, pedir contexto e mudar de ideia — continua sendo o briefing.
 *
 * **Não cobra 100%.** Os limiares são frouxos de propósito: 80% de adesão é
 * verde, dois treinos por semana contam, um dia ruim não vira alerta. Sistema
 * que exige perfeição é abandonado por quem erra uma vez — e o objetivo aqui é
 * durar, não parecer rigoroso.
 */
import { useMemo } from 'react';
import { ClipboardCopy, ChevronRight } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Eixo } from '../tipos';
import { EIXOS } from '../tipos';
import { hoje, mesAtual, somaDias, trimestreAtual } from '../formato';
import { lerVida, aUnicaCoisa, contarSinais, type Sinal, type Gravidade } from '../logica/consultor';
import { resumoDoMes } from '../logica/financas';
import { jurosMensaisDe } from '../logica/dividas';
import { estadoDoHabito } from '../logica/habitos';
import { separarAfazeres } from '../logica/agenda';
import { resultadoPorFrente } from '../logica/frentes';
import {
  seriePeso, tendencia, tendenciaCintura, serieCintura, vereditoSemanal,
  calcularAlvos, adesaoRecente, sonoRecente,
} from '../logica/nutricao';
import { medidasDaSemana, semanaAtual } from '../logica/semana';
import { paraRevisar } from '../logica/estudo';
import { Cartao, TituloSecao, Botao, Legenda, Metrica } from '../componentes/ui';

const CORES: Record<Gravidade, string> = {
  alerta: 'var(--color-perigo)',
  atencao: 'var(--color-ouro)',
  ok: 'var(--color-verde)',
  'sem-dado': 'var(--color-graphite)',
};

const NOMES: Record<Gravidade, string> = {
  alerta: 'alerta', atencao: 'atenção', ok: 'no lugar', 'sem-dado': 'sem dado',
};

export default function Consultor({
  dados, irPara,
}: { dados: DadosApp; irPara: (d: 'briefing') => void }) {
  const data = hoje();

  const sinais = useMemo(() => {
    const mes = mesAtual();
    const resumo = resumoDoMes(dados.lancamentos.itens, mes);
    const pisoFixo = dados.perfil.custoFixoMensal ?? resumo.saidasFixas;
    const dividas = dados.dividas.itens.filter((d) => d.ativa);
    const juros = jurosMensaisDe(dividas);

    const serie = seriePeso(dados.porData, 90, data);
    const t = tendencia(serie);
    const tc = tendenciaCintura(serieCintura(dados.porData, 90, data).slice(-8));
    const alvoRitmo = dados.perfil.ritmoSemanal ?? (t.mediaAtual ? -(t.mediaAtual * 0.006) : -0.5);
    const veredito = vereditoSemanal(t, alvoRitmo, tc);
    const alvos = calcularAlvos(dados.perfil, t.mediaAtual ?? undefined);
    const comida = adesaoRecente(dados.refeicoes.itens, dados.porData, 14, data);
    const sono = sonoRecente(dados.porData, 14, data);

    const ativos = dados.habitos.itens.filter((h) => h.ativo);
    const estados = ativos.map((h) => estadoDoHabito(h, dados.porData, data));
    const habitos30d = estados.length
      ? estados.reduce((s, e) => s + e.ultimos30.taxa, 0) / estados.length
      : 0;

    const semana = semanaAtual(data);
    const medidas = medidasDaSemana(dados.metas.itens, trimestreAtual(),
      dados.semanas.itens.find((s) => s.id === semana));

    const meses = [0, 1, 2].map((i) => {
      const [a, m] = mes.split('-').map(Number);
      const d = new Date(a, m - 1 - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const porFrente = resultadoPorFrente(
      dados.lancamentos.itens, dados.frentes.itens, dados.rotinas.itens, meses,
    );
    // A frente que come muitas horas e devolve pouco: só vale citar acima de
    // cinco horas por semana, senão vira ruído sobre projeto pequeno.
    const pior = porFrente
      .filter((f) => f.frente && f.minutosSemana >= 300 && f.margem <= 0)
      .sort((a, b) => a.margem - b.margem)[0];

    const treinosNaSemana = dados.treinos.itens
      .filter((tr) => tr.data > somaDias(data, -7) && tr.data <= data).length;

    return lerVida({
      sobraDoMes: resumo.sobra,
      previsivel: resumo.previsivel,
      pisoFixo,
      jurosMensais: juros,
      aporteDisponivel: dividas.reduce((s, d) => s + d.parcelaMinima, 0) + Math.max(0, resumo.sobra),
      lancamentosNoMes: resumo.lancamentos.length,
      acoesAbertas: dados.acoes.itens.filter((a) => a.status === 'aberta' || a.status === 'andamento').length,
      vereditoPeso: veredito.tipo === 'sem-dado'
        ? { tipo: veredito.tipo, texto: veredito.texto }
        : { tipo: veredito.tipo, texto: veredito.texto, sugestao: veredito.sugestao },
      proteinaMedia: comida.proteinaMedia,
      proteinaPiso: alvos.proteinaPiso,
      adesaoRefeicoes: comida.adesao,
      diasComRefeicao: comida.diasComRegistro,
      treinosNaSemana,
      sonoMedia: sono.media,
      habitos30d,
      habitosEmRisco: estados.filter((e) => e.emRisco).map((e) => e.habito.nome),
      afazeresAtrasados: separarAfazeres(dados.tarefas.itens, undefined, data).atrasadas.length,
      medidasBatidas: medidas.filter((m) => m.bateu).length,
      medidasTotal: medidas.length,
      frenteSemRetorno: pior && pior.frente
        ? { nome: pior.frente.nome, horas: pior.minutosSemana / 60, margem: pior.margem }
        : undefined,
      revisoesVencidas: paraRevisar(dados.perguntas.itens, data).length,
      materiaisAbertos: dados.estudos.itens.filter((e) => e.status === 'lendo').length,
      materiaisNaFila: dados.estudos.itens.filter((e) => e.status === 'fila').length,
    });
  }, [dados, data]);

  const unica = aUnicaCoisa(sinais);
  const contagem = contarSinais(sinais);
  const porEixo = (Object.keys(EIXOS) as Eixo[])
    .map((e) => ({ eixo: e, itens: sinais.filter((s) => s.eixo === e) }))
    .filter((g) => g.itens.length);

  return (
    <div className="space-y-6">
      {/* A única coisa. Um consultor que devolve quinze recomendações não
          ajudou — ele passou a lista de volta para você priorizar. */}
      {unica ? (
        <Cartao tom="destaque">
          <div className="rotulo text-fundo/70">Se for olhar uma coisa só</div>
          <h1 className="titulo mt-3 text-[26px] leading-tight">{unica.titulo}</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-fundo/80">{unica.detalhe}</p>
          {unica.acao && (
            <p className="mt-3 border-t border-fundo/15 pt-3 text-[13px] leading-relaxed text-fundo">
              <b>{unica.acao}</b>
            </p>
          )}
        </Cartao>
      ) : (
        <Cartao tom="destaque">
          <div className="rotulo text-fundo/70">Leitura de hoje</div>
          <h1 className="titulo mt-3 text-[26px] leading-tight">Nada pedindo atenção agora</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-fundo/80">
            Ou está tudo no lugar, ou ainda falta dado para dizer alguma coisa. Registre alguns dias
            e volte aqui.
          </p>
        </Cartao>
      )}

      <Cartao>
        <TituloSecao acao={
          <Botao variante="fantasma" onClick={() => irPara('briefing')}>
            <ClipboardCopy size={15} />Briefing
          </Botao>
        }>Como está o conjunto</TituloSecao>

        <div className="grid grid-cols-4 gap-3">
          <Metrica rotulo="Alerta" valor={String(contagem.alerta)} tamanho="medio"
            cor={contagem.alerta ? 'text-perigo' : 'text-fraco'} />
          <Metrica rotulo="Atenção" valor={String(contagem.atencao)} tamanho="medio"
            cor={contagem.atencao ? 'text-ouro' : 'text-fraco'} />
          <Metrica rotulo="No lugar" valor={String(contagem.ok)} tamanho="medio"
            cor={contagem.ok ? 'text-verde' : 'text-fraco'} />
          <Metrica rotulo="Sem dado" valor={String(contagem.semDado)} tamanho="medio"
            cor="text-fraco" />
        </div>

        <div className="mt-4">
          <Legenda>
            Isto não é IA: são regras sobre os seus próprios números, sempre iguais para a mesma
            entrada. Para a leitura que discorda, pergunta e muda de ideia, use o briefing — ele
            monta o dossiê para você colar numa conversa comigo.
          </Legenda>
        </div>
      </Cartao>

      {porEixo.map(({ eixo, itens }) => (
        <Cartao key={eixo}>
          <TituloSecao acao={
            <span className="flex items-center gap-1.5">
              <i className="h-1.5 w-1.5 rounded-full" style={{ background: EIXOS[eixo].cor }} />
              <span className="rotulo text-fraco">{itens.length}</span>
            </span>
          }>{EIXOS[eixo].nome}</TituloSecao>

          <div className="space-y-3">
            {itens.map((s) => <LinhaDeSinal key={s.id} sinal={s} />)}
          </div>
        </Cartao>
      ))}

      <Cartao tom="calmo">
        <TituloSecao>Sobre o rigor</TituloSecao>
        <Legenda>
          Nada aqui exige 100%. Adesão de 80% com plano imperfeito vence adesão de 40% com plano
          perfeito, e um dia ruim não muda mês nenhum. O que aparece como alerta é o que compromete
          o trimestre — dívida que cresce, sono curto, hábito na segunda falta seguida. O resto é
          informação, não cobrança.
        </Legenda>
        <div className="mt-3">
          <Legenda>
            E há uma coisa que este consultor não faz: dizer se você está feliz. Ele lê número. Se a
            leitura aqui estiver verde e a sua semana estiver ruim, a leitura está incompleta — não
            a sua sensação.
          </Legenda>
        </div>
      </Cartao>
    </div>
  );
}

function LinhaDeSinal({ sinal }: { sinal: Sinal }) {
  return (
    <div className="border-t border-borda2 pt-3 first:border-0 first:pt-0">
      <div className="flex items-start gap-2.5">
        <i className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: CORES[sinal.gravidade] }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[14px] leading-snug text-creme">{sinal.titulo}</span>
            <span className="rotulo text-fraco">{sinal.area} · {NOMES[sinal.gravidade]}</span>
          </div>
          {sinal.detalhe && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-fraco">{sinal.detalhe}</p>
          )}
          {sinal.acao && (
            <p className="mt-2 flex gap-1.5 text-[13px] leading-relaxed text-suave">
              <ChevronRight size={14} className="mt-0.5 shrink-0 text-fraco" />
              {sinal.acao}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
