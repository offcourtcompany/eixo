/**
 * A ideia do dia, e a leitura de um material inteiro por ideias.
 *
 * O cartão principal mostra **uma** ideia. Não três, não a lista — uma, com o
 * mecanismo em cima e a aplicação embaixo, e dois botões: entendi, ou virar
 * afazer. Mostrar mais de uma por vez transformaria isto em outra lista para
 * rolar, e lista para rolar é exatamente o que já não funcionava.
 *
 * O botão de virar afazer é o fecho do circuito e a razão de o módulo existir:
 * ideia que não vira ação é conversa de mesa. A aplicação já vem escrita com o
 * seu contexto, então o afazer nasce pronto em vez de nascer como intenção.
 */
import { useMemo, useState } from 'react';
import { Lightbulb, Check, ListPlus, ChevronRight } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Ideia, Estudo } from '../tipos';
import { numero } from '../formato';
import { estadoDasIdeias, ideiasDoEstudo, recadoDasIdeias } from '../logica/ideias';
import { Cartao, Botao, Folha, Barra, Legenda, Aviso, Pilula } from './ui';

export function BlocoIdeiaDoDia({ dados }: { dados: DadosApp }) {
  const estudos = dados.estudos.itens;
  const ideias = dados.ideias.itens;
  const estado = useMemo(() => estadoDasIdeias(ideias, estudos), [ideias, estudos]);

  if (!estado.total) return null;

  const ideia = estado.proxima;
  const doEstudo = ideia ? estudos.find((e) => e.id === ideia.estudoId) : null;

  return (
    <Cartao tom={ideia ? 'destaque' : 'placar'}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={'titulo text-[19px] ' + (ideia ? 'text-fundo' : '')}>
          {ideia ? 'A ideia de hoje' : 'Estante estudada'}
        </h2>
        <span className={'tabular text-[13px] ' + (ideia ? 'text-fundo/60' : 'text-fraco')}>
          {numero(estado.estudadas)} / {numero(estado.total)}
        </span>
      </div>

      {ideia ? (
        <>
          <div className="mt-1 text-[12px] text-fundo/60">
            {doEstudo?.titulo}{doEstudo?.autor ? ' · ' + doEstudo.autor : ''}
          </div>

          <h3 className="titulo mt-4 text-[22px] leading-tight text-fundo">{ideia.titulo}</h3>

          <p className="mt-3 text-[14px] leading-relaxed text-fundo/80">{ideia.conteudo}</p>

          <div className="mt-4 border-t border-fundo/15 pt-4">
            <div className="rotulo text-fundo/50">Onde isso encosta em você</div>
            <p className="mt-2 text-[14px] leading-relaxed text-fundo">{ideia.aplicacao}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => void dados.ideias.salvar({ id: ideia.id, estudada: true })}
              className="inline-flex items-center gap-2 rounded-sm bg-fundo px-3.5 py-2.5 text-sm text-osso transition-colors hover:bg-fundo/85">
              <Check size={15} />Entendi
            </button>
            <button
              onClick={() => void virarAfazer(dados, ideia)}
              className="inline-flex items-center gap-2 rounded-sm border border-fundo/25 px-3.5 py-2.5 text-sm text-fundo transition-colors hover:border-fundo/60">
              <ListPlus size={15} />Virar afazer
            </button>
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-fundo/55">
            {recadoDasIdeias(estado)}
          </p>
        </>
      ) : (
        <div className="mt-3">
          <Legenda>{recadoDasIdeias(estado)}</Legenda>
        </div>
      )}
    </Cartao>
  );
}

/**
 * A aplicação vira afazer com o texto que já estava escrito.
 *
 * Sem prazo de propósito: pôr data automática numa intenção que você ainda não
 * decidiu quando fazer é a forma mais rápida de criar um atrasado falso. Ele
 * nasce na lista sem prazo, e é você que marca o dia.
 */
async function virarAfazer(dados: DadosApp, ideia: Ideia) {
  await dados.tarefas.salvar({
    titulo: 'Aplicar: ' + ideia.titulo,
    nota: ideia.aplicacao,
    peso: 'normal',
    feita: false,
    criadoEm: new Date().toISOString(),
  });
  await dados.ideias.salvar({ id: ideia.id, estudada: true });
}

/** O progresso de ideias de um material, para a linha da estante. */
export function ProgressoDeIdeias({
  dados, estudo, aoAbrir,
}: { dados: DadosApp; estudo: Estudo; aoAbrir: () => void }) {
  const r = useMemo(() => ideiasDoEstudo(dados.ideias.itens, estudo.id), [dados.ideias.itens, estudo.id]);
  if (!r.total) return null;

  return (
    <button onClick={aoAbrir}
      className="mt-2 flex w-full items-center gap-2.5 rounded-sm px-1 py-1 text-left transition-colors hover:bg-superficie2">
      <Lightbulb size={13} className="shrink-0 text-fraco" />
      <span className="text-[12px] text-fraco">
        {r.estudadas} de {r.total} ideias
      </span>
      <span className="min-w-0 flex-1">
        <Barra valor={r.progresso} cor={r.progresso >= 1 ? 'var(--color-verde)' : 'var(--color-suave)'} />
      </span>
      <ChevronRight size={14} className="shrink-0 text-fraco" />
    </button>
  );
}

/**
 * O material inteiro, ideia por ideia.
 *
 * Aqui a lista aparece — mas só quando você pediu por ela, escolhendo um livro
 * específico. É a diferença entre uma biblioteca que empurra e uma que
 * responde.
 */
export function FolhaDoMaterial({
  aberta, aoFechar, estudo, dados,
}: { aberta: boolean; aoFechar: () => void; estudo: Estudo | null; dados: DadosApp }) {
  const [abertaIdeia, setAbertaIdeia] = useState<string | null>(null);
  const r = useMemo(
    () => (estudo ? ideiasDoEstudo(dados.ideias.itens, estudo.id) : null),
    [dados.ideias.itens, estudo],
  );

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={estudo?.titulo || 'Material'}>
      {!r || !r.total ? (
        <Legenda>Este material ainda não tem ideias escritas.</Legenda>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="rotulo text-fraco">Ideias estudadas</span>
              <span className="tabular text-sm">{r.estudadas} de {r.total}</span>
            </div>
            <Barra valor={r.progresso}
              cor={r.progresso >= 1 ? 'var(--color-verde)' : 'var(--color-creme)'} />
          </div>

          {estudo?.porque && (
            <Aviso tom="info"><b>Por que este:</b> {estudo.porque}</Aviso>
          )}

          <div className="space-y-2">
            {r.itens.map((i) => (
              <div key={i.id} className="rounded-sm border border-borda2">
                <button onClick={() => setAbertaIdeia(abertaIdeia === i.id ? null : i.id)}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-superficie2">
                  <span className="min-w-0 flex-1">
                    <span className={'block text-[13px] leading-snug ' + (i.estudada ? 'text-fraco' : 'text-creme')}>
                      {i.titulo}
                    </span>
                  </span>
                  {i.estudada && <Pilula cor="#A0CA92">estudada</Pilula>}
                </button>

                {abertaIdeia === i.id && (
                  <div className="space-y-3 border-t border-borda2 px-3 py-3">
                    <p className="text-[13px] leading-relaxed text-suave">{i.conteudo}</p>
                    <div>
                      <div className="rotulo mb-1.5 text-fraco">Onde isso encosta em você</div>
                      <p className="text-[13px] leading-relaxed text-creme">{i.aplicacao}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Botao onClick={() => void dados.ideias.salvar({ id: i.id, estudada: !i.estudada })}>
                        <Check size={15} />{i.estudada ? 'Desmarcar' : 'Entendi'}
                      </Botao>
                      <Botao variante="fantasma" onClick={() => void virarAfazer(dados, i)}>
                        <ListPlus size={15} />Virar afazer
                      </Botao>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Legenda>
            O que está escrito aqui é resumo autoral com o seu contexto, não o texto dos autores —
            e resumo não substitui o livro: quem lê ganha os exemplos, as nuances e os
            contra-argumentos que não cabem em quatro parágrafos. O que isto resolve é o problema
            real de não ler nenhum.
          </Legenda>
        </div>
      )}
    </Folha>
  );
}
