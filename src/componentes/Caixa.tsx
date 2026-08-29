/**
 * A projeção de 90 dias.
 *
 * O bloco existe para responder uma pergunta e uma só: **até quando dura.**
 * Tudo aqui é subordinado a isso — a manchete é uma data, o gráfico é a prova
 * dela, e o resto do cartão só explica de onde a data saiu.
 *
 * Duas linhas de propósito. A cheia é o que está contratado; a pontilhada soma
 * o funil ponderado. Ver as duas juntas é o que impede o erro clássico de quem
 * vende evento: contar com a proposta enviada como se fosse contrato assinado,
 * e descobrir em novembro que o mês de dezembro já estava perdido em setembro.
 */
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DadosApp } from '../dadosApp';
import { moeda, moedaCurta, numero, dataCurta, hoje, deYmd } from '../formato';
import { projetarCaixa, porSemana, ritmoMensal } from '../logica/caixa';
import { Cartao, TituloSecao, Metrica, Aviso, Legenda, Barra } from './ui';

/** Quantos dias até lá, em português de gente. */
function daquiA(data: string) {
  const dias = Math.round((deYmd(data).getTime() - deYmd(hoje()).getTime()) / 86400000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias < 14) return 'em ' + dias + ' dias';
  const semanas = Math.round(dias / 7);
  return 'em cerca de ' + semanas + ' semanas';
}

export function BlocoCaixa({ dados }: { dados: DadosApp }) {
  const marcos = dados.marcos.itens;
  const ultimoMarco = marcos.length ? marcos[marcos.length - 1] : null;
  // O ponto de patrimônio é a melhor fonte: tem data e foi conferido por você.
  // O campo do perfil é o segundo melhor. Sem nenhum dos dois, a linha vira
  // variação — e o cartão diz isso em vez de fingir um saldo.
  const saldoInicial = ultimoMarco?.reserva ?? dados.perfil.reservaAtual;

  const entrada = useMemo(() => ({
    lancamentos: dados.lancamentos.itens,
    recorrentes: dados.recorrentes.itens,
    dividas: dados.dividas.itens,
    oportunidades: dados.oportunidades.itens,
    perfil: dados.perfil,
    saldoInicial,
  }), [dados.lancamentos.itens, dados.recorrentes.itens, dados.dividas.itens,
    dados.oportunidades.itens, dados.perfil, saldoInicial]);

  const p = useMemo(() => projetarCaixa(entrada), [entrada]);
  const ritmo = useMemo(() => ritmoMensal(entrada), [entrada]);

  const serie = useMemo(
    () => porSemana(p).map((d) => ({
      data: dataCurta(d.data),
      Contratado: Math.round(d.saldo),
      'Com funil': Math.round(d.comFunil),
    })),
    [p],
  );

  const custoFixo = dados.perfil.custoFixoMensal || 0;
  const mesesDeFolego = custoFixo > 0 && p.saldoInicial > 0 ? p.saldoInicial / custoFixo : 0;

  // A manchete. É a única frase do cartão que muda de cor.
  const manchete = !p.temSaldo
    ? { texto: 'Sem saldo de partida', cor: 'text-fraco',
        detalhe: 'A linha abaixo é a variação, não o saldo.' }
    : p.aperto
      ? { texto: dataCurta(p.aperto), cor: 'text-perigo',
          detalhe: 'o caixa cruza o zero ' + daquiA(p.aperto) }
      : { texto: 'Não fura', cor: 'text-verde',
          detalhe: 'nos próximos 90 dias, com o que está contratado' };

  return (
    <Cartao>
      <TituloSecao>Os próximos 90 dias</TituloSecao>

      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo={p.aperto ? 'Data do aperto' : 'Caixa'} valor={manchete.texto}
          cor={manchete.cor} tamanho="medio" detalhe={manchete.detalhe} />
        <Metrica rotulo="Menor saldo" valor={moedaCurta(p.menorSaldo)} tamanho="medio"
          cor={p.menorSaldo < 0 ? 'text-perigo' : p.menorSaldo < custoFixo ? 'text-creme' : 'text-verde'}
          detalhe={'no fundo do vale, ' + dataCurta(p.menorSaldoEm)} />
        <Metrica rotulo="Em 90 dias" valor={moedaCurta(p.saldoFinal)} tamanho="medio"
          cor={p.saldoFinal < 0 ? 'text-perigo' : 'text-creme'}
          detalhe={'com o funil, ' + moedaCurta(p.dias[p.dias.length - 1]?.comFunil ?? p.saldoFinal)} />
      </div>

      {/* Fôlego: quantos meses de custo fixo o saldo de partida cobre. É a
          tradução do número em tempo, que é a unidade em que a decisão é
          tomada — ninguém decide em reais, decide em "até quando". */}
      {mesesDeFolego > 0 && dados.perfil.reservaAlvoMeses ? (
        <div className="mt-5 border-t border-borda2 pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="rotulo text-fraco">Fôlego em meses de custo fixo</span>
            <span className="tabular text-sm">
              {numero(mesesDeFolego, 1)} de {dados.perfil.reservaAlvoMeses}
            </span>
          </div>
          <Barra valor={mesesDeFolego / dados.perfil.reservaAlvoMeses}
            cor={mesesDeFolego >= dados.perfil.reservaAlvoMeses ? 'var(--color-verde)' : 'var(--color-creme)'} />
        </div>
      ) : null}

      <div className="-ml-2 mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <XAxis dataKey="data" tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false}
              interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? Math.round(v / 1000) + 'k' : String(Math.round(v)))}
              width={40} />
            <Tooltip
              contentStyle={{ background: '#101010', border: '1px solid #3D3A39', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#EEEEEE' }}
              formatter={(v, n) => [moeda(Number(v)), String(n)]} />
            <ReferenceLine y={0} stroke="#EE6018" strokeDasharray="4 4" />
            {custoFixo > 0 && (
              <ReferenceLine y={custoFixo} stroke="#A0CA92" strokeDasharray="2 4"
                label={{ value: 'um mês de custo fixo', fill: '#A0CA92', fontSize: 10, position: 'insideTopRight' }} />
            )}
            <Line type="monotone" dataKey="Contratado" stroke="#EEEEEE" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Com funil" stroke="#A0CA92" strokeWidth={1.5}
              strokeDasharray="5 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* O ritmo: de onde a inclinação da linha vem, em quatro números. Sem
          isto o gráfico é uma opinião; com isto ele é uma conta que dá para
          conferir de cabeça. */}
      <div className={'mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-borda2 pt-4 text-[13px] '
        + (ritmo.imposto > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4')}>
        <div>
          <div className="rotulo text-fraco">Entra fixo</div>
          <div className="tabular mt-1 text-verde">{moedaCurta(ritmo.entradaFixa)}</div>
        </div>
        {ritmo.imposto > 0 && (
          <div>
            <div className="rotulo text-fraco">Imposto</div>
            <div className="tabular mt-1 text-creme">−{moedaCurta(ritmo.imposto)}</div>
          </div>
        )}
        <div>
          <div className="rotulo text-fraco">Sai fixo</div>
          <div className="tabular mt-1 text-creme">−{moedaCurta(ritmo.saidaFixa)}</div>
        </div>
        <div>
          <div className="rotulo text-fraco">Variável médio</div>
          <div className="tabular mt-1 text-creme">−{moedaCurta(ritmo.variavel)}</div>
        </div>
        <div>
          <div className="rotulo text-fraco">Sobra por mês</div>
          <div className={'tabular mt-1 ' + (ritmo.sobra < 0 ? 'text-perigo' : 'text-verde')}>
            {ritmo.sobra < 0 ? '−' : '+'}{moedaCurta(Math.abs(ritmo.sobra))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {p.faltaParaNaoFurar > 0 && (
          <Aviso>
            Para a linha contratada não cruzar o zero, precisa entrar{' '}
            <b>{moeda(p.faltaParaNaoFurar)}</b> de receita nova até {dataCurta(p.menorSaldoEm)}.
            {p.entradasDoFunil > 0 && (
              <> O funil ponderado prevê {moeda(p.entradasDoFunil)} no período — o que já cobriria,
                se fechar. Ponderado quer dizer que ele já desconta o que historicamente não fecha.</>
            )}
          </Aviso>
        )}

        {!p.temSaldo && (
          <Aviso tom="info">
            A projeção não sabe com quanto você começa. Registre um <b>ponto de dívida e reserva</b>{' '}
            logo abaixo, ou preencha a reserva atual em Ajustes — sem isso a linha mostra só o
            movimento, e a data do aperto não existe.
          </Aviso>
        )}

        {!p.confiavel && (
          <Aviso tom="info">
            {p.mesesDeHistorico === 0
              ? 'Sem nenhum mês fechado, o gasto variável entra como zero — esta projeção conta apenas o que está cadastrado, e por isso é otimista.'
              : 'Só um mês fechado de histórico. A média do gasto variável ainda oscila muito; a partir de dois meses ela começa a valer.'}
          </Aviso>
        )}

        {p.semPrevisao > 0 && (
          <Aviso tom="info">
            {p.semPrevisao} {p.semPrevisao === 1 ? 'oportunidade aberta não tem' : 'oportunidades abertas não têm'}{' '}
            previsão de entrada e {p.semPrevisao === 1 ? 'ficou' : 'ficaram'} de fora da linha do
            funil. Abra cada uma no Funil e diga quando o dinheiro entraria — a projeção sem essa
            data está incompleta, não está errada.
          </Aviso>
        )}
      </div>

      <div className="mt-4">
        <Legenda>
          A linha cheia é só o contratado: fixos cadastrados, lançamentos já feitos com data à
          frente, e o seu gasto variável médio dos meses fechados. A pontilhada soma o funil
          ponderado.{' '}
          {p.incluiuDividas
            ? 'As mínimas de dívida entram diluídas por dia, porque o app não sabe o vencimento e inventar um dia criaria um penhasco falso.'
            : 'As mínimas de dívida não entram aqui: você já tem dívida cadastrada nos fixos, e contar duas vezes seria pior que não contar.'}
        </Legenda>
      </div>
    </Cartao>
  );
}
