import { useMemo, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Lancamento, Divida, AcaoEstrutural } from '../tipos';
import {
  moeda, moedaCurta, porcento, hoje, mesAtual, mesRelativo, rotuloMes, dataCurta, anualizar,
} from '../formato';
import { resumoDoMes, serieDeMeses, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../logica/financas';
import { comparar, jurosMensaisDe, saldoTotal } from '../logica/dividas';
import { ACOES_SUGERIDAS } from '../dados/sementes';
import { BlocoFixos, AConfirmar } from '../componentes/Fixos';
import { EscolhaDeFrente } from '../componentes/Frentes';
import { BlocoPorFrente, BlocoModelos } from '../componentes/PorFrente';
import { BlocoPatrimonio } from '../componentes/Patrimonio';
import { BlocoCaixa } from '../componentes/Caixa';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, Selecao, AreaTexto,
  Folha, Vazio, Barra, Aviso, Legenda, Pilula,
} from '../componentes/ui';

export default function Financeiro({ dados }: { dados: DadosApp }) {
  const [mes, setMes] = useState(mesAtual());
  const lancamentos = dados.lancamentos.itens;

  const resumo = useMemo(() => resumoDoMes(lancamentos, mes), [lancamentos, mes]);
  const serie = useMemo(() => serieDeMeses(lancamentos, mes, 6), [lancamentos, mes]);
  const pisoFixo = dados.perfil.custoFixoMensal ?? resumo.saidasFixas;

  return (
    <div className="space-y-6">
      <NavegadorDeMes mes={mes} aoMudar={setMes} />
      <PainelDoMes resumo={resumo} pisoFixo={pisoFixo} />
      {/* A projeção vem antes do histórico de propósito: o mês fechado explica
          o passado, e a decisão que você toma ao abrir esta tela é sobre o que
          vem. */}
      <BlocoCaixa dados={dados} />
      <GraficoDeMeses serie={serie} pisoFixo={pisoFixo} />
      <BlocoModelos dados={dados} mes={mes} />
      <BlocoPorFrente dados={dados} mes={mes} />
      <BlocoDividas dados={dados} sobra={resumo.sobra} />
      <BlocoPatrimonio dados={dados} />
      <BlocoFixos dados={dados} />
      <BlocoAcoes dados={dados} />
      <BlocoLancamentos dados={dados} resumo={resumo} mes={mes} />
    </div>
  );
}

// ───────────────────────────── mês ─────────────────────────────

function NavegadorDeMes({ mes, aoMudar }: { mes: string; aoMudar: (m: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-borda bg-superficie px-2 py-2">
      <button onClick={() => aoMudar(mesRelativo(mes, -1))}
        className="rounded-lg p-2 text-suave hover:bg-superficie2 hover:text-creme"><ChevronLeft size={18} /></button>
      <div className="text-center">
        <div className="titulo text-base">{rotuloMes(mes)}</div>
        {mes !== mesAtual() && (
          <button onClick={() => aoMudar(mesAtual())} className="text-[11px] text-brasa">voltar para o mês atual</button>
        )}
      </div>
      <button onClick={() => aoMudar(mesRelativo(mes, 1))} disabled={mes >= mesAtual()}
        className="rounded-lg p-2 text-suave hover:bg-superficie2 hover:text-creme disabled:opacity-25">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function PainelDoMes({ resumo, pisoFixo }: { resumo: ReturnType<typeof resumoDoMes>; pisoFixo: number }) {
  const coberto = pisoFixo > 0 ? resumo.previsivel / pisoFixo : 0;
  const falta = Math.max(0, pisoFixo - resumo.previsivel);

  return (
    <Cartao>
      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo="Entrou" valor={moedaCurta(resumo.entradas)} cor="text-verde" tamanho="medio" />
        <Metrica rotulo="Saiu" valor={moedaCurta(resumo.saidas)} cor="text-brasa" tamanho="medio" />
        <Metrica rotulo="Sobra" valor={moedaCurta(resumo.sobra)}
          cor={resumo.sobra >= 0 ? 'text-creme' : 'text-perigo'} tamanho="medio" />
      </div>

      {/* A conta que decide o mês seguinte: receita com que dá pra contar
          contra o piso de custo fixo. Evento avulso não entra nessa conta. */}
      <div className="mt-5 border-t border-borda2 pt-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="rotulo text-fraco">
            Receita previsível × custo fixo
          </span>
          <span className="tabular text-sm">{porcento(coberto)}</span>
        </div>
        <Barra valor={coberto} cor={coberto >= 1 ? 'var(--color-verde)' : 'var(--color-ouro)'} />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-suave">
          <span>Previsível <span className="tabular text-creme">{moeda(resumo.previsivel)}</span></span>
          <span>Piso fixo <span className="tabular text-creme">{moeda(pisoFixo)}</span></span>
          <span>Avulso <span className="tabular text-fraco">{moeda(resumo.porOrigem.avulsa)}</span></span>
        </div>
        <div className="mt-3">
          {/* Com piso zero não há nada coberto — há dado faltando. Dizer
              "está coberto" numa tela vazia é elogio falso, e elogio falso é
              o jeito mais rápido de o painel perder credibilidade. */}
          {pisoFixo <= 0 ? (
            <Legenda>
              Cadastre o custo fixo em Ajustes, ou os seus fixos do mês aqui embaixo, para esta linha
              dizer alguma coisa. Ela é a conta que decide o mês seguinte.
            </Legenda>
          ) : falta > 0 ? (
            <Legenda>
              Faltam <span className="tabular text-ouro">{moeda(falta)}</span> por mês de receita
              recorrente para o mês se sustentar sem depender de evento avulso. Enquanto isso não fechar,
              todo mês recomeça do zero.
            </Legenda>
          ) : (
            <Legenda>
              O custo fixo está coberto por receita previsível. Tudo que entrar de avulso daqui é avanço,
              não sobrevivência — é dinheiro que pode ir para dívida ou reserva.
            </Legenda>
          )}
        </div>
      </div>
    </Cartao>
  );
}

function GraficoDeMeses({ serie, pisoFixo }: { serie: ReturnType<typeof serieDeMeses>; pisoFixo: number }) {
  const dados = serie.map((m) => ({
    mes: rotuloMes(m.mes).slice(0, 3),
    Previsível: Math.round(m.previsivel),
    Avulso: Math.round(m.porOrigem.avulsa),
    Saídas: Math.round(m.saidas),
  }));
  const temDado = dados.some((d) => d.Previsível || d.Avulso || d.Saídas);

  return (
    <Cartao>
      <TituloSecao>Seis meses</TituloSecao>
      {!temDado ? (
        <Vazio titulo="Sem lançamentos ainda">
          Assim que você registrar alguns meses, este gráfico mostra se a base recorrente está subindo
          ou se cada mês depende de um evento novo.
        </Vazio>
      ) : (
        <div className="-ml-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <XAxis dataKey="mes" tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? (v / 1000) + 'k' : String(v))} width={38} />
              <Tooltip
                contentStyle={{ background: '#101010', border: '1px solid #3D3A39', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#EEEEEE' }}
                formatter={(v, n) => [moeda(Number(v)), String(n)]} />
              {pisoFixo > 0 && (
                <ReferenceLine y={pisoFixo} stroke="#EE6018" strokeDasharray="4 4"
                  label={{ value: 'piso fixo', fill: '#EE6018', fontSize: 10, position: 'insideTopRight' }} />
              )}
              <Bar dataKey="Previsível" stackId="e" fill="#A0CA92" />
              <Bar dataKey="Avulso" stackId="e" fill="#4D4947" radius={[0, 0, 0, 0]} />
              <Line type="monotone" dataKey="Saídas" stroke="#B8B3B0" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-suave">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-verde" />Receita previsível</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: '#4D4947' }} />Avulso</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-suave" />Saídas</span>
      </div>
    </Cartao>
  );
}

// ─────────────────────────── dívidas ───────────────────────────

function BlocoDividas({ dados, sobra }: { dados: DadosApp; sobra: number }) {
  const dividas = dados.dividas.itens;
  const ativas = dividas.filter((d) => d.ativa);
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Divida | null>(null);
  const minimos = ativas.reduce((s, d) => s + d.parcelaMinima, 0);
  const [aporte, setAporte] = useState<number | null>(null);
  const aporteUsado = aporte ?? minimos + Math.max(0, sobra);

  const total = saldoTotal(dividas);
  const juros = jurosMensaisDe(dividas);
  const { neve, aval, custoDoConforto, mesesAMais } = useMemo(
    () => comparar(dividas, aporteUsado), [dividas, aporteUsado]);

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={() => { setEditando(null); setAberta(true); }}>
          <Plus size={15} />Dívida
        </Botao>
      }>Dívidas</TituloSecao>

      {!ativas.length ? (
        <Vazio titulo="Nenhuma dívida cadastrada">
          Cadastre saldo, taxa mensal e parcela mínima de cada uma. O simulador mostra em quantos meses
          cada estratégia zera e quanto de juros cada caminho custa.
        </Vazio>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Metrica rotulo="Saldo total" valor={moedaCurta(total)} cor="text-perigo" tamanho="medio" />
            <Metrica rotulo="Juros por mês" valor={moedaCurta(juros)} cor="text-perigo" tamanho="medio" />
            <Metrica rotulo="Taxa efetiva" tamanho="medio"
              valor={porcento(total ? anualizar(juros / total) : 0)} detalhe="ao ano" cor="text-perigo" />
          </div>

          <div className="mt-4 space-y-2">
            {ativas.map((d) => (
              <button key={d.id} onClick={() => { setEditando(d); setAberta(true); }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-borda bg-superficie2 px-3.5 py-3 text-left">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.nome}</div>
                  <div className="text-[11px] text-suave">
                    {porcento(d.taxaMensal, 2)} a.m. · mínima {moeda(d.parcelaMinima)}
                  </div>
                </div>
                <div className="tabular shrink-0 text-right">
                  <div className="text-sm">{moeda(d.saldo)}</div>
                  <div className="text-[11px] text-perigo">+{moedaCurta(d.saldo * d.taxaMensal)}/mês</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-borda2 pt-4">
            <Campo rotulo="Quanto consigo pôr por mês nas dívidas"
              dica={'Mínimas somadas: ' + moeda(minimos) + '. Tudo acima disso é o que realmente encurta a dívida.'}>
              <Entrada type="number" inputMode="decimal" value={aporteUsado}
                onChange={(e) => setAporte(Number(e.target.value) || 0)} />
            </Campo>

            {!neve.viavel ? (
              <div className="mt-3">
                <Aviso>
                  <b>Esse valor não quita — só segura.</b> Os juros deste mês somam {moeda(juros)}.
                  Pagando {moeda(aporteUsado)}, o saldo cresce todo mês e não existe data de quitação.
                  Faltam pelo menos <b>{moeda(neve.faltaPorMes)}/mês</b> só para parar de piorar.
                  É por isso que a saída aqui não é gastar menos: é renegociar a taxa.
                </Aviso>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <PlanoDeQuitacao titulo="Bola de neve" subtitulo="menor saldo primeiro" sim={neve} destaque={false} />
                  <PlanoDeQuitacao titulo="Avalanche" subtitulo="maior taxa primeiro" sim={aval} destaque />
                </div>
                {custoDoConforto > 1 ? (
                  <Legenda>
                    A bola de neve custa <span className="text-ouro">{moeda(custoDoConforto)}</span> a
                    mais em juros{mesesAMais > 0 ? ' e ' + mesesAMais + (mesesAMais === 1 ? ' mês' : ' meses') + ' a mais' : ''}.
                    Ela existe porque entrega vitória rápida — o que quebra na prática é o comportamento, não a conta.
                    Se essa diferença parece pequena diante de ver uma dívida sumir, vá de bola de neve sem culpa.
                    Se parece cara, vá de avalanche.
                  </Legenda>
                ) : (
                  <Legenda>
                    As duas estratégias custam praticamente o mesmo aqui. Escolha a bola de neve: neste caso
                    a vitória rápida sai de graça.
                  </Legenda>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <FormularioDivida aberta={aberta} aoFechar={() => setAberta(false)} divida={editando} dados={dados} />
    </Cartao>
  );
}

function PlanoDeQuitacao({
  titulo, subtitulo, sim, destaque,
}: { titulo: string; subtitulo: string; sim: ReturnType<typeof comparar>['neve']; destaque: boolean }) {
  const anos = Math.floor(sim.meses / 12);
  const meses = sim.meses % 12;
  return (
    <div className={'rounded-xl border p-3.5 ' + (destaque ? 'border-verde/40' : 'border-borda bg-superficie2')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{titulo}</span>
        {destaque && <Pilula cor="#A0CA92">mais barata</Pilula>}
      </div>
      <div className="text-[11px] text-fraco">{subtitulo}</div>
      <div className="tabular mt-2.5 titulo text-2xl">
        {anos > 0 ? anos + 'a ' + meses + 'm' : sim.meses + (sim.meses === 1 ? ' mês' : ' meses')}
      </div>
      <div className="mt-1 text-[12px] text-suave">{moeda(sim.jurosTotais)} de juros no caminho todo</div>
      {sim.ordem.length > 1 && (
        <div className="mt-2 text-[11px] leading-relaxed text-fraco">Ordem de ataque: {sim.ordem.join(' → ')}</div>
      )}
    </div>
  );
}

function FormularioDivida({
  aberta, aoFechar, divida, dados,
}: { aberta: boolean; aoFechar: () => void; divida: Divida | null; dados: DadosApp }) {
  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState('');
  const [taxa, setTaxa] = useState('');
  const [minima, setMinima] = useState('');
  const [chave, setChave] = useState('');

  // Reidrata os campos quando a folha abre com outra dívida (ou nenhuma).
  const idAtual = divida?.id || 'nova';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setNome(divida?.nome || '');
    setSaldo(divida ? String(divida.saldo) : '');
    setTaxa(divida ? String(divida.taxaMensal * 100) : '');
    setMinima(divida ? String(divida.parcelaMinima) : '');
  }
  if (!aberta && chave) setChave('');

  async function gravar() {
    await dados.dividas.salvar({
      id: divida?.id,
      nome: nome.trim() || 'Dívida',
      saldo: Number(saldo) || 0,
      taxaMensal: (Number(taxa) || 0) / 100,
      parcelaMinima: Number(minima) || 0,
      ativa: true,
      criadoEm: divida?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={divida ? 'Editar dívida' : 'Nova dívida'}>
      <div className="space-y-4">
        <Campo rotulo="Nome">
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Rotativo do cartão" />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Saldo devedor">
            <Entrada type="number" inputMode="decimal" value={saldo}
              onChange={(e) => setSaldo(e.target.value)} placeholder="13000" />
          </Campo>
          <Campo rotulo="Taxa % ao mês" dica="Rotativo costuma ficar entre 12% e 16%.">
            <Entrada type="number" inputMode="decimal" step="0.01" value={taxa}
              onChange={(e) => setTaxa(e.target.value)} placeholder="15" />
          </Campo>
        </div>
        <Campo rotulo="Parcela mínima" dica="O quanto você precisa pagar todo mês para não entrar em atraso.">
          <Entrada type="number" inputMode="decimal" value={minima}
            onChange={(e) => setMinima(e.target.value)} placeholder="0" />
        </Campo>
        {Number(taxa) > 0 && (
          <Aviso tom="info">
            {porcento(Number(taxa) / 100, 2)} ao mês é <b>{porcento(anualizar(Number(taxa) / 100))} ao ano</b>.
            Guarde esse número: é ele que decide se vale a pena qualquer outra aplicação antes de quitar isto.
          </Aviso>
        )}
        <div className="flex gap-2 pt-1">
          <Botao variante="primario" onClick={() => void gravar()} className="flex-1">Salvar</Botao>
          {divida && (
            <Botao variante="perigo" onClick={() => { void dados.dividas.remover(divida.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>
      </div>
    </Folha>
  );
}

// ────────────────────── ações estruturais ──────────────────────

const ROTULO_STATUS: Record<AcaoEstrutural['status'], string> = {
  aberta: 'Aberta', andamento: 'Em andamento', feita: 'Feita', descartada: 'Descartada',
};

function BlocoAcoes({ dados }: { dados: DadosApp }) {
  const acoes = dados.acoes.itens;
  const [expandida, setExpandida] = useState<string | null>(null);
  const pendentes = acoes.filter((a) => a.status === 'aberta' || a.status === 'andamento');
  const ganhoPendente = pendentes.reduce((s, a) => s + a.impactoMensal, 0);
  const ganhoFeito = acoes.filter((a) => a.status === 'feita').reduce((s, a) => s + a.impactoMensal, 0);

  async function semear() {
    for (const a of ACOES_SUGERIDAS) await dados.acoes.salvar(a);
  }

  return (
    <Cartao>
      <TituloSecao>Ações estruturais</TituloSecao>
      <Legenda>
        Cortar cafezinho não vence juro de dois dígitos ao mês. O que muda o seu mês é trocar contrato —
        e isso é um número finito de ligações, não um esforço diário.
      </Legenda>

      {!acoes.length ? (
        <div className="mt-4 space-y-3">
          <Vazio titulo="Nenhuma ação cadastrada">
            Posso começar com quatro alavancas que quase sempre existem: seguro, consórcio, renegociação
            da dívida e auditoria de CNPJs no seu CPF. Tudo editável depois.
          </Vazio>
          <Botao variante="secundario" onClick={() => void semear()} className="w-full">
            Começar com as quatro sugeridas
          </Botao>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metrica rotulo="Sobra a destravar" valor={moedaCurta(ganhoPendente)} cor="text-ouro" tamanho="medio"
              detalhe={pendentes.length + ' em aberto'} />
            <Metrica rotulo="Já destravado" valor={moedaCurta(ganhoFeito)} cor="text-verde" tamanho="medio"
              detalhe="por mês" />
          </div>
          <div className="mt-4 space-y-2">
            {acoes.map((a) => (
              <div key={a.id} className={'rounded-xl border px-3.5 py-3 transition '
                + (a.status === 'feita' ? 'border-verde/30' : 'border-borda bg-superficie2')}>
                <button onClick={() => setExpandida(expandida === a.id ? null : a.id)}
                  className="flex w-full items-start justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <div className={'text-sm font-medium ' + (a.status === 'feita' ? 'text-suave line-through' : '')}>
                      {a.titulo}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Pilula cor={a.status === 'feita' ? '#A0CA92' : a.status === 'andamento' ? '#EE6018' : undefined}>
                        {ROTULO_STATUS[a.status]}
                      </Pilula>
                      {a.impactoMensal > 0 && (
                        <span className="tabular text-[11px] text-ouro">+{moeda(a.impactoMensal)}/mês</span>
                      )}
                    </div>
                  </div>
                </button>
                {expandida === a.id && (
                  <div className="surge mt-3 space-y-3 border-t border-borda2 pt-3">
                    <p className="text-[13px] leading-relaxed text-suave">{a.detalhe}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(['aberta', 'andamento', 'feita', 'descartada'] as const).map((s) => (
                        <button key={s} onClick={() => void dados.acoes.salvar({ id: a.id, status: s })}
                          className={'rounded-lg px-2.5 py-1 text-[11px] transition '
                            + (a.status === s ? 'bg-brasa text-fundo font-medium' : 'bg-superficie text-suave hover:text-creme')}>
                          {ROTULO_STATUS[s]}
                        </button>
                      ))}
                      <button onClick={() => void dados.acoes.remover(a.id)}
                        className="ml-auto rounded-lg px-2 py-1 text-[11px] text-fraco hover:text-perigo">
                        remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Cartao>
  );
}

// ───────────────────────── lançamentos ─────────────────────────

function BlocoLancamentos({
  dados, resumo, mes,
}: { dados: DadosApp; resumo: ReturnType<typeof resumoDoMes>; mes: string }) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);

  function abrir(l: Lancamento | null) { setEditando(l); setAberta(true); }

  return (
    <Cartao>
      <TituloSecao acao={<Botao variante="primario" onClick={() => abrir(null)}><Plus size={15} />Lançar</Botao>}>
        Lançamentos
      </TituloSecao>

      <AConfirmar dados={dados} mes={mes} />

      {!resumo.lancamentos.length ? (
        <Vazio titulo={'Nada lançado em ' + rotuloMes(mes).toLowerCase()}>
          O hábito que sustenta este módulo inteiro é um só: lançar um gasto por dia, antes de dormir.
          O piso é <b>um</b> lançamento — não a planilha perfeita.
        </Vazio>
      ) : (
        <div className="space-y-1">
          {resumo.lancamentos.map((l) => (
            <button key={l.id} onClick={() => abrir(l)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-superficie2">
              <span className="w-11 shrink-0 text-[11px] text-fraco">{dataCurta(l.data)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{l.descricao || l.categoria}</span>
                <span className="block truncate text-[11px] text-fraco">
                  {l.categoria}
                  {l.tipo === 'entrada' && l.origem ? ' · ' + l.origem : ''}
                  {l.tipo === 'saida' && l.fixo ? ' · fixo' : ''}
                  {l.aConfirmar ? ' · a confirmar' : ''}
                </span>
              </span>
              {l.aConfirmar && <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-ouro" />}
              <span className={'tabular shrink-0 text-sm font-medium ' + (l.tipo === 'entrada' ? 'text-verde' : 'text-creme')}>
                {l.tipo === 'entrada' ? '+' : '−'}{moeda(l.valor)}
              </span>
            </button>
          ))}
        </div>
      )}

      {resumo.porCategoria.length > 0 && (
        <div className="mt-5 border-t border-borda2 pt-4">
          <div className="mb-3 rotulo text-fraco">Para onde foi</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={resumo.porCategoria.slice(0, 6)} layout="vertical"
                margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="categoria" width={104} axisLine={false} tickLine={false}
                  tick={{ fill: '#B8B3B0', fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#ffffff08' }}
                  contentStyle={{ background: '#101010', border: '1px solid #3D3A39', borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [moeda(Number(v)), 'gasto']} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={14}>
                  {resumo.porCategoria.slice(0, 6).map((c, i) => (
                    <Cell key={c.categoria} fill={i === 0 ? '#EE6018' : '#4D4947'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <FormularioLancamento aberta={aberta} aoFechar={() => setAberta(false)}
        lancamento={editando} dados={dados} mes={mes} />
    </Cartao>
  );
}

function FormularioLancamento({
  aberta, aoFechar, lancamento, dados, mes,
}: { aberta: boolean; aoFechar: () => void; lancamento: Lancamento | null; dados: DadosApp; mes: string }) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(hoje());
  const [origem, setOrigem] = useState<'fixa' | 'recorrente' | 'avulsa'>('avulsa');
  const [fixo, setFixo] = useState(false);
  const [frenteId, setFrenteId] = useState<string | undefined>();
  const [chave, setChave] = useState('');

  const idAtual = lancamento?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setTipo(lancamento?.tipo || 'saida');
    setValor(lancamento ? String(lancamento.valor) : '');
    setCategoria(lancamento?.categoria || '');
    setDescricao(lancamento?.descricao || '');
    setData(lancamento?.data || (mes === mesAtual() ? hoje() : mes + '-01'));
    setOrigem(lancamento?.origem || 'avulsa');
    setFixo(Boolean(lancamento?.fixo));
    setFrenteId(lancamento?.frenteId);
  }
  if (!aberta && chave) setChave('');

  const categorias = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  async function gravar() {
    const base = {
      id: lancamento?.id,
      data, tipo,
      valor: Math.abs(Number(valor) || 0),
      categoria: categoria || categorias[0],
      descricao: descricao.trim(),
      frenteId,
      criadoEm: lancamento?.criadoEm || new Date().toISOString(),
    };
    await dados.lancamentos.salvar(
      tipo === 'entrada'
        ? { ...base, origem, fixo: false }
        : { ...base, fixo, origem: 'avulsa' as const },
    );
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={lancamento ? 'Editar lançamento' : 'Novo lançamento'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-superficie2 p-1">
          {(['saida', 'entrada'] as const).map((t) => (
            <button key={t} onClick={() => setTipo(t)}
              className={'rounded-lg py-2 text-sm font-medium transition '
                + (tipo === t ? 'bg-brasa text-fundo' : 'text-suave')}>
              {t === 'entrada' ? 'Entrou' : 'Saiu'}
            </button>
          ))}
        </div>

        <Campo rotulo="Valor">
          <Entrada type="number" inputMode="decimal" step="0.01" autoFocus value={valor}
            onChange={(e) => setValor(e.target.value)} placeholder="0,00"
            className="tabular titulo !text-2xl" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Categoria">
            <Selecao value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Escolher…</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Data">
            <Entrada type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
        </div>

        {tipo === 'entrada' ? (
          <Campo rotulo="De onde veio"
            dica="Fixa e recorrente contam como receita previsível. Avulsa é o evento que não se repete sozinho.">
            <div className="grid grid-cols-3 gap-2">
              {([['fixa', 'Fixa'], ['recorrente', 'Recorrente'], ['avulsa', 'Avulsa']] as const).map(([id, nome]) => (
                <button key={id} onClick={() => setOrigem(id)}
                  className={'rounded-xl border px-2 py-2 text-[12px] font-medium transition '
                    + (origem === id ? 'border-verde text-verde' : 'border-borda bg-superficie2 text-suave')}>
                  {nome}
                </button>
              ))}
            </div>
          </Campo>
        ) : (
          <button onClick={() => setFixo(!fixo)}
            className={'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition '
              + (fixo ? 'border-ouro/50' : 'border-borda bg-superficie2')}>
            <span className={'flex h-5 w-5 items-center justify-center rounded-md border '
              + (fixo ? 'border-ouro bg-ouro text-fundo' : 'border-borda2')}>{fixo ? '✓' : ''}</span>
            <span>
              <span className="block text-sm">Custo fixo</span>
              <span className="block text-[11px] text-fraco">Se repete todo mês, com ou sem evento</span>
            </span>
          </button>
        )}

        {/* A mesma etiqueta que a Agenda usa. É este campo que transforma uma
            lista de lançamentos em resposta para "quanto o Boulevard Open deu
            de margem" e "quanto a Epic paga por hora". */}
        <EscolhaDeFrente frentes={dados.frentes.itens.filter((f) => f.ativo)}
          valor={frenteId} aoMudar={setFrenteId}
          dica="De qual frente é este dinheiro. Sem isso ele entra no bolo geral e some da conta por projeto." />

        <Campo rotulo="Descrição (opcional)">
          <AreaTexto rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)}
            placeholder="Rei da Praia — inscrições da semana" />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" onClick={() => void gravar()} className="flex-1" disabled={!Number(valor)}>
            Salvar
          </Botao>
          {lancamento && (
            <Botao variante="perigo" onClick={() => { void dados.lancamentos.remover(lancamento.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>
      </div>
    </Folha>
  );
}
