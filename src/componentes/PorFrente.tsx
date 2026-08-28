/**
 * Rentabilidade por frente — o cruzamento que o app não fazia.
 *
 * De um lado a Agenda já sabia quantas horas por semana cada frente ocupa; do
 * outro, Finanças já sabia quanto entrou e saiu. Faltava a etiqueta comum. Com
 * ela, três perguntas passam a ter resposta em número: qual frente devolve
 * dinheiro pelo tempo que come, quanto cada torneio deu de margem, e quanto a
 * arena paga por hora de fato.
 */
import { useMemo, useState } from 'react';
import type { DadosApp } from '../dadosApp';
import { moeda, moedaCurta, porcento, mesRelativo, rotuloMes } from '../formato';
import { resultadoPorFrente, receitaPorModelo } from '../logica/frentes';
import { Cartao, TituloSecao, Legenda, Vazio, Barra, Metrica, Aviso } from './ui';

const JANELAS = [
  { meses: 1, nome: 'mês' },
  { meses: 3, nome: '3 meses' },
  { meses: 6, nome: '6 meses' },
] as const;

export function BlocoPorFrente({ dados, mes }: { dados: DadosApp; mes: string }) {
  const [janela, setJanela] = useState(3);

  const meses = useMemo(
    () => Array.from({ length: janela }, (_, i) => mesRelativo(mes, -(janela - 1 - i))),
    [mes, janela],
  );

  const linhas = useMemo(
    () => resultadoPorFrente(dados.lancamentos.itens, dados.frentes.itens, dados.rotinas.itens, meses),
    [dados.lancamentos.itens, dados.frentes.itens, dados.rotinas.itens, meses],
  );

  const comMovimento = linhas.filter((l) => l.lancamentos > 0 || l.minutosSemana > 0);

  // Fatia das saídas que ficou sem dono. É o que decide se a tabela pode ser
  // lida como margem ou só como ordem de grandeza.
  const saidasTotais = linhas.reduce((soma, l) => soma + l.saidas, 0);
  const semFrente = linhas.find((l) => l.frente === null);
  const saidaSolta = saidasTotais > 0 ? (semFrente?.saidas || 0) / saidasTotais : 0;
  const maiorMargem = Math.max(1, ...comMovimento.map((l) => Math.abs(l.margem)));

  if (!dados.frentes.itens.length) {
    return (
      <Cartao>
        <TituloSecao>Por frente</TituloSecao>
        <Vazio titulo="Nenhuma frente cadastrada">
          Cadastre as suas frentes na Agenda e marque cada lançamento com uma delas. A partir daí
          esta tabela responde qual projeto devolve dinheiro pelo tempo que consome — que é a conta
          que decide a sua agenda do mês seguinte.
        </Vazio>
      </Cartao>
    );
  }

  return (
    <Cartao>
      <TituloSecao acao={
        <div className="flex gap-1">
          {JANELAS.map((j) => (
            <button key={j.meses} onClick={() => setJanela(j.meses)}
              className={'rounded-sm px-2 py-1 text-[11px] transition-colors '
                + (janela === j.meses ? 'bg-superficie2 text-creme' : 'text-fraco hover:text-suave')}>
              {j.nome}
            </button>
          ))}
        </div>
      }>Por frente</TituloSecao>

      <Legenda>
        {janela === 1 ? rotuloMes(mes) : `${rotuloMes(meses[0])} a ${rotuloMes(mes)}`}. As horas vêm
        das rotinas cadastradas na Agenda — é estimativa de ocupação, não cronômetro.
      </Legenda>

      {!comMovimento.length ? (
        <div className="mt-4">
          <Vazio titulo="Nada lançado com frente ainda">
            Ao lançar dinheiro, escolha a frente. Bastam algumas semanas para a tabela mostrar onde o
            seu tempo está sendo bem pago e onde não está.
          </Vazio>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse">
            <thead>
              <tr>
                {['Frente', 'Entrou', 'Saiu', 'Margem', 'h/sem', 'R$/h'].map((h, i) => (
                  <th key={h} className={'rotulo border-b border-borda2 pb-2 font-normal text-fraco '
                    + (i === 0 ? 'text-left' : 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comMovimento.map((l) => {
                const chave = l.frente?.id || 'sem-frente';
                const cor = l.frente?.cor || 'var(--color-graphite)';
                return (
                  <tr key={chave} className="border-b border-borda">
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2">
                        <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cor }} />
                        <span className="truncate text-[13px]">{l.frente?.nome || 'sem frente'}</span>
                      </span>
                      <span className="mt-1.5 block">
                        <Barra valor={Math.abs(l.margem) / maiorMargem}
                          cor={l.margem >= 0 ? 'var(--color-verde)' : 'var(--color-perigo)'} />
                      </span>
                    </td>
                    <td className="tabular py-2.5 pl-2 text-right text-[13px] text-suave">{moedaCurta(l.entradas)}</td>
                    <td className="tabular py-2.5 pl-2 text-right text-[13px] text-suave">{moedaCurta(l.saidas)}</td>
                    <td className={'tabular py-2.5 pl-2 text-right text-[13px] '
                      + (l.margem >= 0 ? 'text-creme' : 'text-perigo')}>{moedaCurta(l.margem)}</td>
                    <td className="tabular py-2.5 pl-2 text-right text-[13px] text-fraco">
                      {l.minutosSemana ? (l.minutosSemana / 60).toFixed(0) : '—'}
                    </td>
                    <td className={'tabular py-2.5 pl-2 text-right text-[13px] '
                      + (l.porHora === null ? 'text-fraco' : l.porHora >= 0 ? 'text-verde' : 'text-perigo')}>
                      {l.porHora === null ? '—' : moedaCurta(l.porHora)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Saída sem frente infla a margem de todo mundo: as entradas ficam
          etiquetadas e os custos caem no bolo geral. Melhor dizer que a leitura
          está torta do que deixar a tabela parecer boa notícia. */}
      {saidaSolta > 0.2 && (
        <div className="mt-4">
          <Aviso>
            {porcento(saidaSolta)} das saídas do período não têm frente marcada. Enquanto isso, as
            margens acima estão <b>infladas</b> — os custos estão sobrando no bolo geral em vez de
            descontar de quem os gerou.
          </Aviso>
        </div>
      )}

      <div className="mt-4">
        <Legenda>
          Frente com muitas horas e R$/h baixo é a que está comendo a sua semana sem devolver. Ela
          não precisa ser abandonada — mas precisa ser renegociada, empacotada ou passada adiante de
          olhos abertos, e não por hábito.
        </Legenda>
      </div>
    </Cartao>
  );
}

/**
 * Contratado × próprio.
 *
 * Os dois modelos se comportam de formas opostas: contratado tem receita
 * garantida e risco do contratante; próprio tem upside alto com o capital e a
 * ocupação por sua conta. Com dívida e sem colchão, o primeiro ganha do
 * segundo — e este bloco existe para essa proporção sair da intuição.
 */
export function BlocoModelos({ dados, mes }: { dados: DadosApp; mes: string }) {
  const r = useMemo(
    () => receitaPorModelo(dados.lancamentos.itens, dados.frentes.itens, mes),
    [dados.lancamentos.itens, dados.frentes.itens, mes],
  );

  if (!r.total) return null;

  const fatia = (v: number) => (r.total ? v / r.total : 0);

  return (
    <Cartao>
      <TituloSecao>Contratado × próprio</TituloSecao>

      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo="Contratado" valor={moedaCurta(r.contratado)} cor="text-verde" tamanho="medio"
          detalhe="risco do contratante" />
        <Metrica rotulo="Próprio" valor={moedaCurta(r.proprio)} cor="text-ouro" tamanho="medio"
          detalhe="risco seu" />
        <Metrica rotulo="Sem etiqueta" valor={moedaCurta(r.semEtiqueta)} tamanho="medio"
          cor="text-fraco" detalhe={r.semEtiqueta ? 'marque a frente' : 'tudo etiquetado'} />
      </div>

      {/* Uma barra só, repartida — a proporção é a informação, não os valores. */}
      <div className="mt-4 flex h-1 w-full overflow-hidden bg-superficie2">
        <div style={{ width: `${fatia(r.contratado) * 100}%`, background: 'var(--color-verde)' }} />
        <div style={{ width: `${fatia(r.proprio) * 100}%`, background: 'var(--color-ouro)' }} />
        <div style={{ width: `${fatia(r.semEtiqueta) * 100}%`, background: 'var(--color-graphite)' }} />
      </div>

      <div className="mt-4">
        <Legenda>
          {r.contratado >= r.proprio
            ? 'A maior parte do mês veio de execução contratada — receita garantida, capital de outro em risco. Enquanto a dívida existir e não houver reserva, é essa a proporção que interessa manter.'
            : 'A maior parte do mês veio de evento próprio: upside maior, mas o capital e o risco de ocupação foram seus. Faz sentido quando existe colchão; com dívida ativa, cada edição é uma aposta com dinheiro que não sobra.'}
          {r.semEtiqueta > 0 && ` Ainda há ${moeda(r.semEtiqueta)} sem frente marcada, então esta leitura está incompleta.`}
        </Legenda>
      </div>
    </Cartao>
  );
}
