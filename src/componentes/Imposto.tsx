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
 * Com o mês zerado os números somem. Um bloco de imposto piscando numa tela sem
 * receita nenhuma é cobrança sem fato, e ensina a ignorar o cartão justamente
 * antes do mês em que ele importa. O que fica é só a porta das perguntas para o
 * contador — que vale antes de existir receita, e não depois.
 */
import { useMemo, useState } from 'react';
import { Check, Copy, MessageSquareText } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import { moeda, moedaCurta, porcento, dataCurta, hoje } from '../formato';
import { reservaDeImposto } from '../logica/imposto';
import { BLOCOS, PERGUNTAS_CONTADOR } from '../dados/perguntasContador';
import { Cartao, TituloSecao, Metrica, Legenda, Aviso, Botao, Folha } from './ui';

export function BlocoImposto({ dados }: { dados: DadosApp }) {
  const lancamentos = dados.lancamentos.itens;
  const perfil = dados.perfil;
  const r = useMemo(() => reservaDeImposto(lancamentos, perfil), [lancamentos, perfil]);
  const [perguntas, setPerguntas] = useState(false);

  if (r.aliquota <= 0) return null;

  const venceu = r.venceEm <= hoje();
  const semMovimento = r.receitaDoMes <= 0 && r.aPagar <= 0;

  const abrirPerguntas = (
    <Botao variante="fantasma" onClick={() => setPerguntas(true)}>
      <MessageSquareText size={15} />Perguntas para o contador
    </Botao>
  );

  if (semMovimento) {
    return (
      <Cartao>
        <TituloSecao acao={abrirPerguntas}>Imposto</TituloSecao>
        <Legenda>
          Sem receita registrada neste mês, não há guia a estimar. O que vale fazer agora é a
          conversa: são {PERGUNTAS_CONTADOR.length} perguntas cujas respostas mudam preço de
          inscrição, calendário de temporada e quanto sobra no fim — e a primeira delas é a
          alíquota que este app inteiro está presumindo.
        </Legenda>
        <FolhaDoContador aberta={perguntas} aoFechar={() => setPerguntas(false)} />
      </Cartao>
    );
  }

  return (
    <Cartao>
      <TituloSecao acao={abrirPerguntas}>Imposto</TituloSecao>

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

      <FolhaDoContador aberta={perguntas} aoFechar={() => setPerguntas(false)} />
    </Cartao>
  );
}

/**
 * A lista para levar na reunião.
 *
 * O formato é deliberado: a pergunta em cima, em letra de ler, e **por que ela
 * importa** logo abaixo, menor. O "porquê" não é enfeite — é o que permite
 * insistir quando a resposta vier vaga, que é o momento em que estas conversas
 * costumam terminar cedo demais.
 *
 * O botão de copiar existe porque a reunião de verdade acontece no WhatsApp, e
 * mandar as perguntas antes é o que faz a resposta vir com número em vez de vir
 * com "depende".
 */
function FolhaDoContador({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
  const [copiado, setCopiado] = useState(false);

  const texto = useMemo(() => {
    const linhas = ['Perguntas sobre a tributação da empresa:', ''];
    for (const bloco of BLOCOS) {
      const doBloco = PERGUNTAS_CONTADOR.filter((q) => q.bloco === bloco);
      if (!doBloco.length) continue;
      linhas.push(bloco.toUpperCase());
      for (const q of doBloco) linhas.push('- ' + q.pergunta);
      linhas.push('');
    }
    return linhas.join('\n').trim();
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Área de transferência bloqueada: a lista na tela continua servindo.
      setCopiado(false);
    }
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Perguntas para o contador">
      <div className="space-y-5">
        <Legenda>
          Toda pergunta aqui tem a mesma qualidade: a resposta muda uma decisão sua, não o seu
          conhecimento geral. Pergunta cuja resposta não muda nada ficou de fora — lista longa é
          lista que não se lê na hora.
        </Legenda>

        <Botao variante="secundario" onClick={() => void copiar()}>
          {copiado ? <><Check size={15} />Copiado</> : <><Copy size={15} />Copiar as perguntas</>}
        </Botao>

        {BLOCOS.map((bloco) => {
          const doBloco = PERGUNTAS_CONTADOR.filter((q) => q.bloco === bloco);
          if (!doBloco.length) return null;
          return (
            <div key={bloco}>
              <div className="rotulo mb-2 text-fraco">{bloco}</div>
              <div className="space-y-2">
                {doBloco.map((q) => (
                  <div key={q.id} className="rounded-sm border border-borda2 px-3.5 py-3">
                    <p className="text-[14px] leading-snug text-creme">{q.pergunta}</p>
                    <p className="mt-2 text-[12px] leading-relaxed text-fraco">{q.porque}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <Legenda>
          A resposta da primeira pergunta é a única que entra no app: escreva a alíquota em Ajustes
          e todo ponto de equilíbrio desta tela para de usar o valor presumido. O resto é decisão
          sua com informação, e não cabe em campo nenhum.
        </Legenda>
      </div>
    </Folha>
  );
}
