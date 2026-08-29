/**
 * A parte do dinheiro que não é sua.
 *
 * Este cartão existe para desfazer um engano que quase todo mundo que fatura
 * por evento carrega: o de que o imposto sai do lucro. Ele sai da **receita**.
 * O mês em que giram R$ 20 mil gera guia sobre os R$ 20 mil, não sobre o que
 * sobrou — e a guia chega no dia 20 do mês seguinte, quando o caixa já voltou
 * ao tamanho normal e o dinheiro do evento já foi usado.
 *
 * Por isso a leitura principal aqui não é "quanto vou pagar", é **"quanto do
 * que já entrou eu não posso gastar"**. É um número de hoje, não de dia 20.
 *
 * O cartão não aparece com o mês zerado. Um bloco de imposto piscando numa tela
 * sem receita nenhuma é cobrança sem fato, e ensina a ignorar o cartão
 * justamente antes do mês em que ele importa.
 */
import { useMemo } from 'react';
import type { DadosApp } from '../dadosApp';
import { moeda, moedaCurta, porcento, dataCurta, hoje } from '../formato';
import { reservaDeImposto } from '../logica/imposto';
import { Cartao, TituloSecao, Metrica, Legenda, Aviso } from './ui';

export function BlocoImposto({ dados }: { dados: DadosApp }) {
  const lancamentos = dados.lancamentos.itens;
  const perfil = dados.perfil;
  const r = useMemo(() => reservaDeImposto(lancamentos, perfil), [lancamentos, perfil]);

  if (r.aliquota <= 0) return null;
  if (r.receitaDoMes <= 0 && r.aPagar <= 0) return null;

  const venceu = r.venceEm <= hoje();

  return (
    <Cartao>
      <TituloSecao>Imposto</TituloSecao>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metrica rotulo="Guardar deste mês" valor={moedaCurta(r.aGuardar)} tamanho="medio"
          cor="text-creme"
          detalhe={`${porcento(r.aliquota)} de ${moedaCurta(r.receitaDoMes)} que já entraram`} />
        <Metrica rotulo="Guia a pagar" valor={moedaCurta(r.aPagar)} tamanho="medio"
          cor={r.aPagar > 0 && venceu ? 'text-perigo' : 'text-creme'}
          detalhe={r.aPagar > 0 ? (venceu ? 'venceu em ' : 'vence em ') + dataCurta(r.venceEm) : 'nada do mês passado'} />
        <Metrica rotulo="Sobra de verdade" valor={moedaCurta(r.receitaDoMes - r.aGuardar)} tamanho="medio"
          cor="text-verde" detalhe="da receita do mês, depois do imposto" />
      </div>

      {r.aPagar > 0 && (
        <div className="mt-4">
          <Aviso tom={venceu ? 'alerta' : 'info'}>
            A receita de {moeda(r.receitaAnterior)} do mês passado gera{' '}
            <b>{moeda(r.aPagar)}</b> de guia {venceu ? 'com vencimento em' : 'para'}{' '}
            {dataCurta(r.venceEm)}. Ela sai do caixa deste mês, não do mês em que o dinheiro
            entrou — é essa defasagem que faz a conta parecer boa e o mês seguinte apertar.
          </Aviso>
        </div>
      )}

      {r.foraDaBase > 0 && (
        <Legenda>
          {moeda(r.foraDaBase)} entraram marcados como fora do CNPJ e ficaram de fora de tudo
          acima.
        </Legenda>
      )}

      <Legenda>
        {r.presumida ? (
          <>
            A alíquota aqui é <b>{porcento(r.aliquota)}</b>, o piso do Anexo III — um chute
            defensável, não a sua. A real sobe com o faturamento dos últimos doze meses e pode
            mudar de anexo pelo Fator R, se a folha ficar abaixo de 28% da receita. Peça o número
            ao seu contador e escreva em Ajustes; até lá, todo cálculo de evento desta tela está
            usando o chute.
          </>
        ) : (
          <>
            Cálculo de reserva, não apuração: quem apura é o seu contador, e é dele que vem a
            alíquota de {porcento(r.aliquota)} que está aqui. Isto serve para uma coisa só — não
            gastar o que já é da guia.
          </>
        )}
      </Legenda>
    </Cartao>
  );
}
