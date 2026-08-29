/**
 * Cabe na semana?
 *
 * O cartão é construído em torno de uma frase que nenhuma outra tela do app
 * pode dizer: **não é falta de disciplina, é que não cabe.** Quando a semana
 * está estourada, essa é a manchete, e as horas por frente logo abaixo dizem de
 * onde tirar.
 *
 * A barra empilhada por frente é o coração: ela mostra a semana como um bolo
 * já dividido, e não como uma lista de compromissos que ainda vão caber em
 * algum lugar. Ver a frente que ocupa metade da semana ao lado do que ela paga
 * por hora é a informação que muda decisão de carreira.
 */
import { useMemo } from 'react';
import type { DadosApp } from '../dadosApp';
import { numero, porcento, moeda, dataCurta, mesAtual, mesRelativo, deYmd, DIAS_LONGOS } from '../formato';
import {
  calcularCapacidade, diaMaisCheio, porDia, frenteQueComeASemana, type Capacidade,
} from '../logica/capacidade';
import { resultadoPorFrente } from '../logica/frentes';
import { Cartao, TituloSecao, Metrica, Aviso, Legenda } from './ui';

const h = (n: number) => numero(n, 1) + ' h';

export function BlocoCapacidade({ dados }: { dados: DadosApp }) {
  const entrada = useMemo(() => ({
    rotinas: dados.rotinas.itens,
    eventos: dados.eventos.itens,
    tarefas: dados.tarefas.itens,
    frentes: dados.frentes.itens,
    treinos: dados.treinos.itens,
    dias: dados.dias,
  }), [dados.rotinas.itens, dados.eventos.itens, dados.tarefas.itens,
    dados.frentes.itens, dados.treinos.itens, dados.dias]);

  const c = useMemo(() => calcularCapacidade(entrada), [entrada]);
  const pior = useMemo(() => diaMaisCheio(entrada), [entrada]);

  // O cruzamento que só existe porque tempo e dinheiro moram no mesmo app:
  // a frente que mais come a semana, e quanto ela devolve por hora sua.
  const dona = useMemo(() => {
    const meses = [2, 1, 0].map((i) => mesRelativo(mesAtual(), -i));
    const r = resultadoPorFrente(dados.lancamentos.itens, dados.frentes.itens, dados.rotinas.itens, meses);
    return frenteQueComeASemana(c, r, meses.length);
  }, [c, dados.lancamentos.itens, dados.frentes.itens, dados.rotinas.itens]);

  const cor = {
    folga: 'text-verde', ok: 'text-verde', cheia: 'text-creme', estourada: 'text-perigo',
  }[c.zona];

  return (
    <Cartao>
      <TituloSecao>Cabe na semana?</TituloSecao>

      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo="Comprometido" valor={h(c.comprometido)} tamanho="medio" cor={cor}
          detalhe={porcento(c.ocupacao) + ' do disponível'} />
        <Metrica rotulo={c.livre >= 0 ? 'Livre' : 'Faltam'} valor={h(Math.abs(c.livre))} tamanho="medio"
          cor={c.livre < 0 ? 'text-perigo' : 'text-creme'}
          detalhe={numero(Math.abs(porDia(c.livre)), 1) + ' h por dia'} />
        <Metrica rotulo="Dia mais cheio" tamanho="medio"
          valor={pior.horas > 0 ? h(pior.horas) : '—'}
          detalhe={pior.horas > 0 ? DIAS_LONGOS[deYmd(pior.data).getDay()].toLowerCase() + ', ' + dataCurta(pior.data) : 'nada marcado'} />
      </div>

      <BarraDaSemana c={c} />

      <div className="mt-4">
        <Aviso tom={c.zona === 'estourada' ? 'alerta' : c.zona === 'cheia' ? 'info' : 'bom'}>
          <Recado c={c} />
        </Aviso>
      </div>

      {dona && dona.fatiaDaSemana >= 0.3 && (
        <div className="mt-3">
          <Legenda>
            <b>{dona.nome}</b> ocupa {porcento(dona.fatiaDaSemana)} da sua semana e devolveu{" "}
            {moeda(dona.porHora)} por hora nos últimos três meses. A pergunta que decide carreira
            não é qual frente dá mais dinheiro no mês — é qual devolve mais por hora sua. A que dá
            mais no mês costuma ser a mesma que come a semana inteira.
          </Legenda>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-borda2 pt-4 text-[13px] sm:grid-cols-4">
        {[
          ['Rotinas', c.rotinas], ['Eventos', c.eventos],
          ['Afazeres', c.tarefas], ['Treino e quadra', c.corpo],
        ].map(([rotulo, valor]) => (
          <div key={String(rotulo)}>
            <div className="rotulo text-fraco">{rotulo}</div>
            <div className="tabular mt-1 text-creme">{h(Number(valor))}</div>
          </div>
        ))}
      </div>

      {c.semEstimativa > 0 && (
        <div className="mt-3">
          <Legenda>
            {c.semEstimativa} {c.semEstimativa === 1 ? 'afazer entrou' : 'afazeres entraram'} com o
            tempo padrão porque {c.semEstimativa === 1 ? 'não tem' : 'não têm'} estimativa. Um chute
            grosseiro no formulário já vale mais que o padrão.
          </Legenda>
        </div>
      )}

      <div className="mt-3">
        <Legenda>
          Das 168 horas da semana, {h(c.sono)} são de sono-alvo e {h(c.manutencao)} de manutenção —
          comer, banho, deslocamento. Sobram {h(c.disponivel)} para tudo o mais. Discorde desses
          números se quiser: eles estão escritos justamente para poderem ser discutidos, e não
          para parecerem exatos.
        </Legenda>
      </div>
    </Cartao>
  );
}

function Recado({ c }: { c: Capacidade }) {
  if (c.zona === 'estourada') {
    const maior = c.porFrente[0];
    return (
      <>
        <b>Não cabe.</b> Você marcou {h(c.comprometido)} para uma semana que tem {h(c.disponivel)}.
        Faltam {h(-c.livre)} — isso é {numero(-porDia(c.livre), 1)} horas por dia que não existem.
        Não é falta de disciplina: alguma coisa vai deixar de acontecer, e é melhor você escolher
        qual do que descobrir na sexta.
        {maior && <> A maior fatia é <b>{maior.nome}</b>, com {h(maior.horas)}.</>}
      </>
    );
  }
  if (c.zona === 'cheia') {
    return (
      <>
        <b>Semana cheia.</b> {porcento(c.ocupacao)} do disponível já está marcado, e sobram apenas{' '}
        {h(c.livre)}. Cabe, mas não cabe imprevisto — e imprevisto em operação de evento não é
        exceção, é o trabalho. Se aparecer alguma coisa nova, ela entra tirando outra.
      </>
    );
  }
  if (c.zona === 'folga') {
    return (
      <>
        <b>Semana com folga.</b> {h(c.livre)} livres. Se isso te surpreende, o mais provável é que
        parte do que ocupa a sua semana não esteja cadastrada — rotina sem duração, afazer sem
        prazo. A conta só é útil quando o que está nela é o que existe.
      </>
    );
  }
  return (
    <>
      <b>Cabe.</b> {h(c.comprometido)} marcados de {h(c.disponivel)} disponíveis, com {h(c.livre)}{' '}
      de folga. É o formato de semana que aguenta o fornecedor atrasar sem derrubar o resto.
    </>
  );
}

function BarraDaSemana({ c }: { c: Capacidade }) {
  if (!c.porFrente.length) return null;
  const base = Math.max(c.disponivel, c.comprometido);

  return (
    <div className="mt-5">
      <div className="flex h-2 w-full overflow-hidden bg-superficie2">
        {c.porFrente.map((f) => (
          <div key={f.chave} style={{ width: `${(f.horas / base) * 100}%`, background: f.cor }} />
        ))}
        {c.corpo > 0 && (
          <div style={{ width: `${(c.corpo / base) * 100}%`, background: 'var(--color-borda2)' }} />
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {c.porFrente.map((f) => (
          <div key={f.chave} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: f.cor }} />
            <span className="min-w-0 flex-1 truncate text-suave">{f.nome}</span>
            <span className="tabular shrink-0 text-fraco">{porcento(f.horas / c.comprometido)}</span>
            <span className="tabular w-16 shrink-0 text-right text-creme">{h(f.horas)}</span>
          </div>
        ))}
        {c.corpo > 0 && (
          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-borda2" />
            <span className="min-w-0 flex-1 truncate text-suave">treino e quadra</span>
            <span className="tabular shrink-0 text-fraco">{porcento(c.corpo / c.comprometido)}</span>
            <span className="tabular w-16 shrink-0 text-right text-creme">{h(c.corpo)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
