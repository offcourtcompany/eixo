/**
 * Fechar a semana.
 *
 * Dez minutos, uma vez por semana, iniciados por você. É o que costura os
 * módulos: sem isto, cada tela responde bem à sua própria pergunta e nenhuma
 * responde "como foi a semana".
 *
 * Duas coisas que ele deliberadamente NÃO faz. Não acontece sozinho — a revisão
 * automática foi recusada, e a diferença entre isto e aquilo é quem começa. E
 * não julga: mostra os números e faz as perguntas; a conclusão é sua. Um app
 * que decreta se a semana foi boa tira de você justamente a parte que faz a
 * revisão valer.
 */
import { useMemo, useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import { EIXOS } from '../tipos';
import { moedaCurta, numero, porcento, trimestreAtual, somaDias } from '../formato';
import {
  resumoDaSemana, medidasDaSemana, rotuloDaSemana, segundaDa, semanaAtual,
  historicoDaMedida, sequenciaDaMedida,
} from '../logica/semana';
import {
  Cartao, TituloSecao, Metrica, Botao, Folha, Legenda, Aviso, Barra, AreaTexto, Pilula,
} from './ui';

/** As perguntas da revisão. Vêm por último, depois dos números. */
const PERGUNTAS = [
  'O que andou nesta semana que você não esperava?',
  'O que você adiou de novo — e é a mesma coisa da semana passada?',
  'Qual é a ÚNICA coisa da semana que vem que faria o resto ficar mais fácil?',
];

export function FolhaFecharSemana({
  aberta, aoFechar, dados, segunda,
}: { aberta: boolean; aoFechar: () => void; dados: DadosApp; segunda: string }) {
  const [nota, setNota] = useState('');
  const [chave, setChave] = useState('');
  const [salvo, setSalvo] = useState(false);

  const semana = dados.semanas.itens.find((s) => s.id === segunda);

  if (aberta && chave !== segunda) {
    setChave(segunda);
    setNota(semana?.nota || '');
    setSalvo(false);
  }
  if (!aberta && chave) setChave('');

  const resumo = useMemo(() => resumoDaSemana(segunda, {
    lancamentos: dados.lancamentos.itens,
    habitos: dados.habitos.itens,
    porData: dados.porData,
    treinos: dados.treinos.itens,
    tarefas: dados.tarefas.itens,
    refeicoes: dados.refeicoes.itens,
  }), [segunda, dados]);

  const linhas = useMemo(
    () => medidasDaSemana(dados.metas.itens, trimestreAtual(), semana),
    [dados.metas.itens, semana],
  );

  async function contar(medidaId: string, delta: number) {
    const medidas = { ...(semana?.medidas || {}) };
    medidas[medidaId] = Math.max(0, (medidas[medidaId] || 0) + delta);
    await dados.semanas.salvar({
      id: segunda,
      medidas,
      nota: semana?.nota,
      fechadaEm: semana?.fechadaEm || new Date().toISOString(),
    });
  }

  async function fechar() {
    await dados.semanas.salvar({
      id: segunda,
      medidas: semana?.medidas || {},
      nota: nota.trim() || undefined,
      fechadaEm: new Date().toISOString(),
    });
    setSalvo(true);
  }

  const bateram = linhas.filter((l) => l.bateu).length;

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={'Semana de ' + rotuloDaSemana(segunda)}>
      <div className="space-y-5">
        {/* 1. O placar das medidas de direção — o que você controla vem antes
               de qualquer resultado. É a correção do 4DX pela metade. */}
        <div>
          <div className="rotulo mb-2 flex items-baseline justify-between text-fraco">
            <span>Medidas de direção</span>
            {linhas.length > 0 && <span className="tabular">{bateram}/{linhas.length}</span>}
          </div>

          {!linhas.length ? (
            <Legenda>
              Nenhuma meta ativa com medida de direção neste trimestre. Medida de direção é o que
              você controla e faz toda semana — "cinco ações de receita recorrente" —, diferente do
              resultado, que você só observa. Cadastre em Metas.
            </Legenda>
          ) : (
            <div className="space-y-2">
              {linhas.map((l) => (
                <div key={l.medida.id}
                  className="rounded-sm border border-borda2 px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <i className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: EIXOS[l.meta.eixo].cor }} />
                    <span className="min-w-0 flex-1 text-[13px] leading-snug">{l.medida.texto}</span>
                    <span className={'tabular shrink-0 text-[13px] ' + (l.bateu ? 'text-verde' : 'text-creme')}>
                      {l.feito}/{l.medida.alvoSemanal}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Barra valor={l.medida.alvoSemanal ? l.feito / l.medida.alvoSemanal : 0}
                      cor={l.bateu ? 'var(--color-verde)' : 'var(--color-creme)'} />
                    <button onClick={() => void contar(l.medida.id, -1)} aria-label="Menos um"
                      className="shrink-0 rounded-sm border border-borda2 p-1 text-fraco transition-colors hover:text-creme">
                      <Minus size={13} />
                    </button>
                    <button onClick={() => void contar(l.medida.id, 1)} aria-label="Mais um"
                      className="shrink-0 rounded-sm border border-borda2 p-1 text-suave transition-colors hover:text-creme">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. O que o app já sabe. Você não deveria gastar a revisão caçando
               número — a revisão é para pensar. */}
        <div className="border-t border-borda2 pt-4">
          <div className="rotulo mb-3 text-fraco">O que aconteceu</div>
          <div className="grid grid-cols-3 gap-3">
            <Metrica rotulo="Sobra" valor={moedaCurta(resumo.sobra)} tamanho="medio"
              cor={resumo.sobra >= 0 ? 'text-verde' : 'text-perigo'}
              detalhe={moedaCurta(resumo.entrou) + ' entrou'} />
            <Metrica rotulo="Hábitos" valor={porcento(resumo.habitos.taxa)} tamanho="medio"
              cor={resumo.habitos.taxa >= 0.8 ? 'text-verde' : 'text-creme'}
              detalhe={resumo.habitos.feitos + ' de ' + resumo.habitos.possiveis} />
            <Metrica rotulo="Treinos" valor={String(resumo.treinos)} tamanho="medio"
              cor={resumo.treinos >= 3 ? 'text-verde' : 'text-creme'} detalhe="sessões" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metrica rotulo="Refeições" tamanho="medio"
              valor={resumo.refeicoes.possiveis ? porcento(resumo.refeicoes.taxa) : '—'}
              cor={resumo.refeicoes.taxa >= 0.8 ? 'text-verde' : 'text-creme'}
              detalhe={resumo.proteinaMedia ? resumo.proteinaMedia + ' g de proteína' : 'sem registro'} />
            <Metrica rotulo="Sono" tamanho="medio"
              valor={resumo.sonoMedia !== null ? numero(resumo.sonoMedia, 1) + ' h' : '—'}
              cor={resumo.sonoMedia === null ? 'text-fraco' : resumo.sonoMedia >= 7 ? 'text-verde' : 'text-ouro'}
              detalhe="média da semana" />
            <Metrica rotulo="Atrasados" valor={String(resumo.atrasados)} tamanho="medio"
              cor={resumo.atrasados ? 'text-perigo' : 'text-verde'} detalhe="afazeres vencidos" />
          </div>

          {resumo.diasRegistrados < 4 && (
            <div className="mt-4">
              <Aviso tom="info">
                Só {resumo.diasRegistrados} dia(s) com registro nesta semana. Os números acima
                existem, mas descrevem os dias que você anotou — não a semana.
              </Aviso>
            </div>
          )}
        </div>

        {/* 3. As perguntas. Vêm depois dos números de propósito: revisão que
               começa pela pergunta vira desabafo; começando pelo dado, vira
               diagnóstico. */}
        <div className="border-t border-borda2 pt-4">
          <div className="rotulo mb-2 text-fraco">Três perguntas</div>
          <ul className="mb-3 space-y-1.5">
            {PERGUNTAS.map((p) => (
              <li key={p} className="flex gap-2 text-[13px] leading-relaxed text-suave">
                <span className="text-fraco">—</span>{p}
              </li>
            ))}
          </ul>
          <AreaTexto rows={5} value={nota} onChange={(e) => setNota(e.target.value)}
            placeholder="Escreva em português comum. Ninguém além de você lê isto." />
        </div>

        {salvo && <Aviso tom="bom">Semana fechada. Ela fica no histórico e some da tela de Hoje.</Aviso>}

        <div className="flex gap-2">
          <Botao variante="primario" className="flex-1" onClick={() => void fechar()}>
            <Check size={16} />Fechar a semana
          </Botao>
        </div>

        <Legenda>
          Fechar não exige ter ido bem. Exige ter olhado — e a semana que você não quer olhar é
          exatamente a que mais explica o mês.
        </Legenda>
      </div>
    </Folha>
  );
}

/**
 * O convite, no painel de Hoje.
 *
 * Aparece grande no domingo e na segunda, que é quando a revisão cabe; nos
 * outros dias fica uma linha discreta, para não virar cobrança diária de uma
 * coisa semanal.
 */
export function ConviteDeFechamento({ dados, data }: { dados: DadosApp; data: string }) {
  const [aberta, setAberta] = useState(false);

  // No domingo e na segunda, a semana que interessa fechar é a que está
  // terminando — ou seja, a anterior à de hoje quando já virou segunda.
  const dow = new Date(data + 'T12:00:00').getDay();
  const ehJanela = dow === 0 || dow === 1;
  const alvo = dow === 1 ? segundaDa(somaDias(data, -1)) : semanaAtual(data);

  const fechada = dados.semanas.itens.find((s) => s.id === alvo);
  const linhas = medidasDaSemana(dados.metas.itens, trimestreAtual(), fechada);
  const bateram = linhas.filter((l) => l.bateu).length;

  return (
    <>
      {ehJanela && !fechada ? (
        <Cartao>
          <TituloSecao acao={
            <Botao variante="primario" onClick={() => setAberta(true)}>Fechar</Botao>
          }>Fechar a semana</TituloSecao>
          <Legenda>
            Dez minutos: o placar do que você controla, os números que o app já juntou, e três
            perguntas. É a semana de {rotuloDaSemana(alvo)}.
          </Legenda>
        </Cartao>
      ) : (
        <button onClick={() => setAberta(true)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-borda px-4 py-3 text-left transition-colors hover:border-borda2">
          <span className="min-w-0">
            <span className="block text-[13px] text-suave">
              Semana de {rotuloDaSemana(alvo)}
              {fechada ? ' · fechada' : ''}
            </span>
            {linhas.length > 0 && (
              <span className="rotulo mt-1 block text-fraco">
                medidas de direção {bateram}/{linhas.length}
              </span>
            )}
          </span>
          {fechada
            ? <Pilula cor="#A0CA92">feita</Pilula>
            : <span className="rotulo shrink-0 text-fraco">abrir</span>}
        </button>
      )}

      <FolhaFecharSemana aberta={aberta} aoFechar={() => setAberta(false)}
        dados={dados} segunda={alvo} />
    </>
  );
}

/** O histórico, para a tela de Metas: o placar ao longo do trimestre. */
export function BlocoPlacarSemanal({ dados }: { dados: DadosApp }) {
  const segunda = semanaAtual();
  const semanas = dados.semanas.itens;
  const linhas = useMemo(
    () => medidasDaSemana(dados.metas.itens, trimestreAtual(), semanas.find((s) => s.id === segunda)),
    [dados.metas.itens, semanas, segunda],
  );

  if (!linhas.length) return null;

  return (
    <Cartao>
      <TituloSecao>Placar das medidas de direção</TituloSecao>
      <Legenda>
        Oito semanas. Resultado você não controla — medida de direção você controla, e é ela que
        move o resultado. Quadrado cheio é semana em que o alvo bateu.
      </Legenda>

      <div className="mt-4 space-y-4">
        {linhas.map((l) => {
          const hist = historicoDaMedida(l.medida.id, semanas, segunda);
          const seq = sequenciaDaMedida(hist, l.medida.alvoSemanal);
          return (
            <div key={l.medida.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-[13px]">{l.medida.texto}</span>
                <span className="tabular shrink-0 text-[12px] text-fraco">
                  {l.medida.alvoSemanal}×/semana{seq > 1 ? ' · ' + seq + ' seguidas' : ''}
                </span>
              </div>
              <div className="flex gap-1">
                {hist.map((h) => {
                  const bateu = h.feito >= l.medida.alvoSemanal;
                  const parcial = h.feito > 0 && !bateu;
                  return (
                    <span key={h.segunda} title={rotuloDaSemana(h.segunda) + ': ' + h.feito}
                      className="h-6 flex-1 rounded-[2px]"
                      style={{
                        background: bateu
                          ? 'var(--color-verde)'
                          : parcial ? 'var(--color-graphite)' : 'var(--color-superficie2)',
                      }} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Legenda>
          Quando o resultado não anda, a resposta quase nunca é aumentar a meta — é olhar qual
          medida parou de acontecer. Uma linha com buracos explica um trimestre inteiro.
        </Legenda>
      </div>
    </Cartao>
  );
}

