/**
 * Nutrição — o plano que sobrevive ao mês dois.
 *
 * A tela é desenhada em cima de três decisões explicadas em logica/nutricao.ts:
 * conta-se proteína e adesão, não caloria; a leitura de peso é a média de sete
 * dias, nunca o número do dia; e o ajuste vem do ritmo observado, não da
 * equação. O que aparece aqui é consequência disso.
 *
 * O gesto principal é um toque por refeição. Marcar a refeição já soma a
 * proteína dela — digitar grama por grama é o atrito que faz largar.
 */
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, Trash2, Scale, Droplets, Wine, Utensils, Search } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Dia, Refeicao, NivelAtividade } from '../tipos';
import { hoje, numero, dataCurta } from '../formato';
import {
  calcularAlvos, seriePeso, tendencia, vereditoSemanal, adesaoDoDia, adesaoRecente, FATORES,
  serieCintura, tendenciaCintura, sonoRecente, metaDeLiquido,
} from '../logica/nutricao';
import { REFEICOES_SUGERIDAS } from '../dados/sementes';
import { ConsultaDeAlimento } from '../componentes/Alimentos';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, AreaTexto, Selecao,
  Folha, Vazio, Barra, Legenda, Aviso, Pilula,
} from '../componentes/ui';

export default function Nutricao({ dados }: { dados: DadosApp }) {
  const data = hoje();
  const dia = dados.porData.get(data) as Dia | undefined;
  const refeicoes = [...dados.refeicoes.itens].sort((a, b) => a.ordem - b.ordem);

  const serie = useMemo(() => seriePeso(dados.porData, 90, data), [dados.porData, data]);
  const pesoAtual = useMemo(
    () => [...serie].reverse().find((p) => p.media !== undefined)?.media
      ?? [...serie].reverse().find((p) => p.peso !== undefined)?.peso,
    [serie],
  );
  const alvos = useMemo(() => calcularAlvos(dados.perfil, pesoAtual), [dados.perfil, pesoAtual]);

  return (
    <div className="space-y-6">
      <PainelDoDia dados={dados} dia={dia} data={data} refeicoes={refeicoes} alvos={alvos} />
      <BlocoPeso dados={dados} serie={serie} data={data} />
      <BlocoAlvos alvos={alvos} perfil={dados.perfil} pesoAtual={pesoAtual} />
      <BlocoDiaDeJogo destacado={Boolean(dia?.diaDeJogo)} />
      <BlocoPrato />
      <BlocoRefeicoes dados={dados} refeicoes={refeicoes} />
      <BlocoPlano dados={dados} />
    </div>
  );
}

// ─────────────────────────── o dia ───────────────────────────

function PainelDoDia({
  dados, dia, data, refeicoes, alvos,
}: {
  dados: DadosApp; dia?: Dia; data: string; refeicoes: Refeicao[];
  alvos: ReturnType<typeof calcularAlvos>;
}) {
  const [consultando, setConsultando] = useState(false);
  const ativas = refeicoes.filter((r) => r.ativa);
  const adesao = adesaoDoDia(refeicoes, dia);
  const proteina = dia?.proteinaG || 0;
  const alvoProteina = alvos.proteinaAlvo || ativas.reduce((s, r) => s + r.proteinaG, 0);

  /**
   * Marcar a refeição soma a proteína dela; desmarcar devolve. É o que permite
   * acompanhar proteína com um toque em vez de pesar comida.
   */
  async function alternar(r: Refeicao) {
    const marcadas = { ...(dia?.refeicoes || {}) };
    const estava = Boolean(marcadas[r.id]);
    marcadas[r.id] = !estava;
    const nova = Math.max(0, proteina + (estava ? -r.proteinaG : r.proteinaG));
    await dados.salvarDia({ id: data, refeicoes: marcadas, proteinaG: nova });
  }

  async function ajustarProteina(delta: number) {
    await dados.salvarDia({ id: data, proteinaG: Math.max(0, proteina + delta) });
  }

  async function ajustarAgua(delta: number) {
    await dados.salvarDia({ id: data, aguaMl: Math.max(0, (dia?.aguaMl || 0) + delta) });
  }

  const agua = dia?.aguaMl || 0;
  // Três horas é a duração típica de uma noite de quadra; num torneio o próprio
  // protocolo manda beber por hora, então a meta serve de piso e não de teto.
  const metaAgua = metaDeLiquido(alvos.pesoUsado, dia?.diaDeJogo ? 3 : 0);

  if (!ativas.length) {
    return (
      <Cartao>
        <TituloSecao acao={
          <Botao variante="fantasma" onClick={() => setConsultando(true)}>
            <Search size={15} />Consultar
          </Botao>
        }>Hoje</TituloSecao>
        <ConsultaDeAlimento aberta={consultando} aoFechar={() => setConsultando(false)}
          dados={dados} dia={dia} data={data} />
        <Vazio titulo="Nenhum plano de refeições ainda">
          Monte o plano lá embaixo — ou comece pelo modelo pronto, que já vem ancorado no seu dia
          real: acordar tarde, comer na arena, trabalhar de madrugada.
        </Vazio>
      </Cartao>
    );
  }

  return (
    <Cartao>
      <TituloSecao acao={
        <div className="flex items-center gap-2">
          <Botao variante="fantasma" onClick={() => setConsultando(true)}>
            <Search size={15} />Consultar
          </Botao>
          <span className="tabular text-sm text-suave">{adesao.feitas}/{adesao.total}</span>
        </div>
      }>Hoje</TituloSecao>

      {/* A proteína é o número do módulo — vem antes da lista. */}
      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="rotulo text-fraco">Proteína</span>
          <span className="tabular text-sm">
            <span className={proteina >= alvoProteina ? 'text-verde' : 'text-creme'}>{proteina}</span>
            <span className="text-fraco"> / {alvoProteina} g</span>
          </span>
        </div>
        <Barra valor={alvoProteina ? proteina / alvoProteina : 0}
          cor={proteina >= alvoProteina ? 'var(--color-verde)' : 'var(--color-creme)'} />
        {alvos.proteinaPiso > 0 && proteina < alvos.proteinaPiso && (
          <div className="mt-2">
            <Legenda>
              Piso do dia: {alvos.proteinaPiso} g. Abaixo disso, em déficit, o corpo tira do músculo —
              que é justamente o que você não quer perder.
            </Legenda>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {ativas.map((r) => {
          const feita = Boolean(dia?.refeicoes?.[r.id]);
          return (
            <button key={r.id} onClick={() => void alternar(r)}
              className={'flex w-full items-start gap-3 rounded-sm px-2 py-2.5 text-left transition-colors '
                + (feita ? 'opacity-60' : 'hover:bg-superficie2')}>
              <span className={'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] '
                + (feita ? 'border-verde bg-verde text-fundo' : 'border-borda2')}>
                {feita ? '✓' : ''}
              </span>
              <span className="min-w-0 flex-1">
                <span className={'block truncate text-sm ' + (feita ? 'line-through' : '')}>{r.nome}</span>
                <span className="mt-0.5 block truncate text-[11px] text-fraco">{r.ancora}</span>
                {!feita && r.piso && (
                  <span className="mt-0.5 block truncate text-[11px] text-fraco">piso: {r.piso}</span>
                )}
              </span>
              <span className="tabular shrink-0 text-[12px] text-fraco">{r.proteinaG} g</span>
            </button>
          );
        })}
      </div>

      {/* Ajuste fino: o que você comeu fora do plano também conta. */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-borda2 pt-3">
        <span className="rotulo mr-1 text-fraco">Comi algo a mais</span>
        {[10, 20, 30].map((g) => (
          <button key={g} onClick={() => void ajustarProteina(g)}
            className="rounded-sm border border-borda2 px-2.5 py-1.5 text-[12px] text-suave transition-colors hover:text-creme">
            +{g} g
          </button>
        ))}
        <button onClick={() => void ajustarProteina(-10)}
          className="rounded-sm px-2 py-1.5 text-[12px] text-fraco transition-colors hover:text-suave">
          −10 g
        </button>
      </div>

      {/* Contador de água sem meta não serve para nada — era o estado anterior.
          A meta cresce no dia de jogo porque em Salvador a perda por suor em
          esporte de raquete passa fácil de um litro por hora. */}
      <div className="mt-4 border-t border-borda2 pt-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="rotulo flex items-center gap-1.5 text-fraco">
            <Droplets size={12} />Água{dia?.diaDeJogo ? ' · dia de jogo' : ''}
          </span>
          <span className="tabular text-sm">
            <span className={agua >= metaAgua ? 'text-verde' : 'text-creme'}>
              {(agua / 1000).toFixed(1)}
            </span>
            <span className="text-fraco"> / {(metaAgua / 1000).toFixed(1)} L</span>
          </span>
        </div>
        <Barra valor={metaAgua ? agua / metaAgua : 0}
          cor={agua >= metaAgua ? 'var(--color-verde)' : 'var(--color-creme)'} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {[500, 250].map((ml) => (
            <button key={ml} onClick={() => void ajustarAgua(ml)}
              className="rounded-sm border border-borda2 px-2.5 py-1.5 text-[12px] text-suave transition-colors hover:text-creme">
              +{ml} ml
            </button>
          ))}
          <button onClick={() => void ajustarAgua(-250)}
            className="rounded-sm px-2 py-1.5 text-[12px] text-fraco transition-colors hover:text-suave">
            −250
          </button>
          <button onClick={() => void dados.salvarDia({ id: data, diaDeJogo: !dia?.diaDeJogo })}
            className={'ml-auto rounded-sm border px-2.5 py-1.5 text-[12px] transition-colors '
              + (dia?.diaDeJogo
                ? 'border-ouro text-ouro'
                : 'border-borda2 text-fraco hover:text-suave')}>
            {dia?.diaDeJogo ? 'é dia de jogo' : 'hoje tem jogo'}
          </button>
        </div>
      </div>

      {/* Álcool não está aqui para julgar. Está porque muda o resultado e some
          do relato depois: registrar tira a surpresa da semana que não andou. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rotulo mr-1 flex items-center gap-1.5 text-fraco"><Wine size={12} />Álcool</span>
        <span className="tabular text-[13px] text-suave">{dia?.alcoolDoses || 0} dose(s)</span>
        <button onClick={() => void dados.salvarDia({ id: data, alcoolDoses: (dia?.alcoolDoses || 0) + 1 })}
          className="rounded-sm border border-borda2 px-2.5 py-1.5 text-[12px] text-suave transition-colors hover:text-creme">
          +1
        </button>
        {(dia?.alcoolDoses || 0) > 0 && (
          <button onClick={() => void dados.salvarDia({ id: data, alcoolDoses: Math.max(0, (dia?.alcoolDoses || 0) - 1) })}
            className="rounded-sm px-2 py-1.5 text-[12px] text-fraco transition-colors hover:text-suave">
            −1
          </button>
        )}
      </div>

      {/* Calorias aparecem só depois de você ter somado alguma — é consulta,
          não diário, e mostrar '0 kcal' viraria cobrança de fechamento. */}
      {(dia?.caloriasKcal || 0) > 0 && (
        <div className="mt-3 flex flex-wrap items-baseline gap-2 border-t border-borda2 pt-3">
          <span className="rotulo text-fraco">Calorias somadas hoje</span>
          <span className="tabular text-[13px] text-creme">{dia?.caloriasKcal} kcal</span>
          {alvos.calorias > 0 && (
            <span className="text-[12px] text-fraco">
              de {numero(alvos.calorias)} kcal do alvo — parcial, só do que você consultou
            </span>
          )}
          <button onClick={() => void dados.salvarDia({ id: data, caloriasKcal: 0 })}
            className="rounded-sm px-2 py-1 text-[11px] text-fraco transition-colors hover:text-suave">
            zerar
          </button>
        </div>
      )}

      <ConsultaDeAlimento aberta={consultando} aoFechar={() => setConsultando(false)}
        dados={dados} dia={dia} data={data} />
    </Cartao>
  );
}

// ─────────────────────────── peso ───────────────────────────

function BlocoPeso({
  dados, serie, data,
}: { dados: DadosApp; serie: ReturnType<typeof seriePeso>; data: string }) {
  const [valor, setValor] = useState('');
  const [cintura, setCintura] = useState('');
  const t = useMemo(() => tendencia(serie), [serie]);

  // A cintura entra no veredito com poder de veto: sem ela, ganho de músculo em
  // iniciante seria lido como fracasso e viraria sugestão de cortar comida.
  const serieC = useMemo(() => serieCintura(dados.porData, 90, data), [dados.porData, data]);
  const tc = useMemo(() => tendenciaCintura(serieC.slice(-8)), [serieC]);
  const sono = useMemo(() => sonoRecente(dados.porData, 14, data), [dados.porData, data]);

  const alvoRitmo = dados.perfil.ritmoSemanal
    ?? (t.mediaAtual ? -(t.mediaAtual * 0.006) : -0.5);
  const veredito = vereditoSemanal(t, alvoRitmo, tc);

  const grafico = serie.slice(-60).map((p) => ({
    data: dataCurta(p.data),
    Pesagem: p.peso,
    Média: p.media,
  }));
  const temDado = grafico.some((g) => g.Pesagem !== undefined);
  const pesoDeHoje = dados.porData.get(data)?.peso;

  async function registrar() {
    const peso = Number(valor.replace(',', '.'));
    const cm = Number(cintura.replace(',', '.'));
    if (!peso && !cm) return;
    await dados.salvarDia({
      id: data,
      ...(peso ? { peso } : {}),
      ...(cm ? { cinturaCm: cm } : {}),
    });
    setValor('');
    setCintura('');
  }

  return (
    <Cartao>
      <TituloSecao>Como o corpo está respondendo</TituloSecao>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[8rem] flex-1">
          <Campo rotulo="Pesagem de hoje (kg)"
            dica="Ao acordar, depois do banheiro, antes de comer e beber. Sempre igual.">
            <Entrada type="number" inputMode="decimal" step="0.1" value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={pesoDeHoje ? String(pesoDeHoje) : '96,0'} />
          </Campo>
        </div>
        <div className="min-w-[8rem] flex-1">
          <Campo rotulo="Cintura (cm)"
            dica="Uma vez por semana, na altura do umbigo, sem prender a barriga.">
            <Entrada type="number" inputMode="decimal" step="0.5" value={cintura}
              onChange={(e) => setCintura(e.target.value)}
              placeholder={tc.atual ? String(tc.atual) : '98'} />
          </Campo>
        </div>
        <Botao variante="secundario" onClick={() => void registrar()}
          disabled={!valor && !cintura}>
          <Scale size={16} />Registrar
        </Botao>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metrica rotulo="Média 7 dias" tamanho="medio"
          valor={t.mediaAtual !== null ? numero(t.mediaAtual, 1) + ' kg' : '—'}
          detalhe="a leitura oficial" />
        <Metrica rotulo="Ritmo" tamanho="medio"
          valor={t.ritmo !== null ? (t.ritmo > 0 ? '+' : '') + numero(t.ritmo, 2) + ' kg' : '—'}
          cor={t.ritmo === null ? 'text-fraco' : t.ritmo <= 0 ? 'text-verde' : 'text-ouro'}
          detalhe="por semana" />
        <Metrica rotulo="Combinado" tamanho="medio"
          valor={numero(alvoRitmo, 2) + ' kg'} cor="text-suave" detalhe="por semana" />
      </div>

      {/* O gráfico mostra os dois: os pontos soltos e a linha que importa. Ver a
          nuvem de pontos ao redor da média é o que ensina a não surtar com o dia. */}
      {temDado ? (
        <div className="-ml-2 mt-5 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={grafico} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
              <XAxis dataKey="data" tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false}
                tickLine={false} interval="preserveStartEnd" minTickGap={40} />
              <YAxis tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false}
                domain={['dataMin - 1', 'dataMax + 1']} width={38} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#101010', border: '1px solid #3D3A39', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#EEEEEE' }}
                formatter={(v, n) => [numero(Number(v), 1) + ' kg', String(n)]} />
              {dados.perfil.pesoAlvo && (
                <ReferenceLine y={dados.perfil.pesoAlvo} stroke="#A0CA92" strokeDasharray="4 4"
                  label={{ value: 'alvo', fill: '#A0CA92', fontSize: 10, position: 'insideTopRight' }} />
              )}
              <Line type="monotone" dataKey="Pesagem" stroke="#4D4947" strokeWidth={1}
                dot={{ r: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="Média" stroke="#EE6018" strokeWidth={2}
                dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4">
          <Vazio titulo="Nenhuma pesagem ainda">
            O peso de um dia só não diz nada — você oscila mais de um quilo entre sábado e domingo
            só por água, sal e intestino. Pese quatro ou mais vezes por semana e o app usa a média,
            que é a única leitura que permite concluir alguma coisa.
          </Vazio>
        </div>
      )}

      {/* Cintura e sono ficam no mesmo cartão do peso porque são a mesma
          pergunta: o corpo está respondendo? Sono entra aqui e não só no painel
          de humor porque é ele que regula fome e recuperação — para quem
          trabalha de madrugada, é a variável que mais mexe no resto. */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-borda2 pt-4">
        <Metrica rotulo="Cintura" tamanho="medio"
          valor={tc.atual !== null ? numero(tc.atual, 1) + ' cm' : '—'}
          detalhe={tc.medidas ? tc.medidas + ' medida(s)' : 'nunca medida'} />
        <Metrica rotulo="Cintura por semana" tamanho="medio"
          valor={tc.ritmo !== null ? (tc.ritmo > 0 ? '+' : '') + numero(tc.ritmo, 2) + ' cm' : '—'}
          cor={tc.ritmo === null ? 'text-fraco' : tc.ritmo <= 0 ? 'text-verde' : 'text-ouro'}
          detalhe={tc.medidas < 2 ? 'precisa de duas medidas' : 'nas últimas semanas'} />
        <Metrica rotulo="Sono" tamanho="medio"
          valor={sono.media !== null ? numero(sono.media, 1) + ' h' : '—'}
          cor={sono.media === null ? 'text-fraco' : sono.media >= 7 ? 'text-verde' : 'text-ouro'}
          detalhe={sono.noites ? 'média de ' + sono.noites + ' noite(s)' : 'registre no painel de Hoje'} />
      </div>

      {tc.medidas < 2 && (
        <div className="mt-4">
          <Aviso tom="info">
            Meça a cintura uma vez por semana. Você começou a treinar força agora — nas primeiras
            semanas o peso trava enquanto a gordura sai, porque músculo entra no lugar. Sem a fita
            métrica, isso pareceria fracasso, e a resposta errada seria cortar comida.
          </Aviso>
        </div>
      )}

      {sono.media !== null && sono.media < 6.5 && (
        <div className="mt-3">
          <Aviso>
            Média de {numero(sono.media, 1)} h de sono. Abaixo de 7 h a fome sobe, a saciedade cai e
            a recuperação do treino piora — é o fator que mais atrapalha um plano alimentar, e
            nenhum ajuste de comida compensa. Se a semana desandar, olhe aqui antes do prato.
          </Aviso>
        </div>
      )}

      <div className="mt-5 border-t border-borda2 pt-4">
        <div className="rotulo mb-2 text-fraco">Veredito da semana</div>
        {veredito.tipo === 'sem-dado' ? (
          <Legenda>{veredito.texto}</Legenda>
        ) : (
          <>
            <p className="text-[14px] leading-relaxed text-creme">{veredito.texto}</p>
            <div className="mt-2"><Legenda>{veredito.sugestao}</Legenda></div>
          </>
        )}
      </div>
    </Cartao>
  );
}

// ─────────────────────────── alvos ───────────────────────────

function BlocoAlvos({
  alvos, perfil, pesoAtual,
}: { alvos: ReturnType<typeof calcularAlvos>; perfil: DadosApp['perfil']; pesoAtual?: number }) {
  if (alvos.faltando.length) {
    return (
      <Cartao>
        <TituloSecao>Os seus alvos</TituloSecao>
        <Aviso tom="info">
          Falta {alvos.faltando.join(', ')} para calcular. Preencha ali embaixo, em "O seu plano" —
          sem esses dados eu poderia chutar um número redondo, mas número redondo em nutrição é
          exatamente o que faz o plano não bater com a realidade.
        </Aviso>
      </Cartao>
    );
  }

  return (
    <Cartao>
      <TituloSecao>Os seus alvos</TituloSecao>

      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo="Calorias" valor={numero(alvos.calorias)} tamanho="medio" detalhe="por dia" />
        <Metrica rotulo="Proteína" valor={alvos.proteinaAlvo + ' g'} cor="text-verde" tamanho="medio"
          detalhe={'piso ' + alvos.proteinaPiso + ' g'} />
        <Metrica rotulo="Gasto estimado" valor={numero(alvos.gasto)} tamanho="medio" cor="text-suave"
          detalhe={'basal ' + numero(alvos.tmb)} />
      </div>

      {alvos.freado && (
        <div className="mt-4">
          <Aviso>
            O ritmo pedido exigiria comer abaixo do seu metabolismo basal, então o alvo foi travado
            em {numero(alvos.calorias)} kcal. Déficit maior que isso não acelera nada de útil:
            derruba treino, sono e humor, custa músculo, e termina em recaída.
          </Aviso>
        </div>
      )}

      <div className="mt-4 border-t border-borda2 pt-4">
        <div className="rotulo mb-2 text-fraco">Onde o resto cai</div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-suave">
          <span>Gordura mínima <span className="tabular text-creme">{alvos.gorduraMin} g</span></span>
          <span>Carboidrato aprox. <span className="tabular text-creme">{alvos.carboAprox} g</span></span>
        </div>
        <div className="mt-3">
          <Legenda>
            Só a proteína é para acompanhar todo dia. Gordura tem mínimo porque abaixo dele começa a
            atrapalhar hormônio e absorção de vitamina; carboidrato é o que sobra, e é o que segura o
            seu jogo — cortar carboidrato de quem joga quatro vezes por semana é cortar o combustível
            do que te dá dinheiro.
          </Legenda>
        </div>
      </div>

      {alvos.semanasAteAlvo && pesoAtual && perfil.pesoAlvo && (
        <div className="mt-4 border-t border-borda2 pt-4">
          <Legenda>
            No ritmo combinado, são cerca de <span className="tabular text-creme">{alvos.semanasAteAlvo} semanas</span>{' '}
            de {numero(pesoAtual, 1)} kg até {numero(perfil.pesoAlvo, 1)} kg. Isso não é lento: é o
            ritmo em que se perde gordura mantendo músculo, e é o único que não termina com o peso
            de volta.
          </Legenda>
        </div>
      )}

      <div className="mt-4">
        <Legenda>
          Estes números são estimativa calculada a partir do que você informou, para dimensionar o
          prato — não são prescrição. Toda equação de gasto erra de 10% a 15% para o indivíduo, e é
          por isso que o veredito da semana vale mais que a conta: depois de duas semanas, quem manda
          é o seu resultado. Se houver condição de saúde, medicação ou histórico alimentar que peça
          cuidado, isso aqui não substitui acompanhamento profissional.
        </Legenda>
      </div>
    </Cartao>
  );
}

/** O método do prato — porções pela mão, para não depender de balança. */
function BlocoPrato() {
  const linhas = [
    ['Proteína', '2 palmas da sua mão', 'Carne, frango, peixe, ovos, atum'],
    ['Carboidrato', '1 a 2 punhos fechados', 'Arroz, macarrão, pão, batata, tapioca, fruta'],
    ['Vegetais', '2 mãos em concha', 'Salada e legumes, à vontade mesmo'],
    ['Gordura', '1 polegar', 'Azeite, castanhas, queijo, abacate'],
  ];

  return (
    <Cartao tom="calmo">
      <TituloSecao>O prato, sem balança</TituloSecao>
      <Legenda>
        Pesar comida funciona por três semanas e depois vira motivo para desistir. A mão viaja com
        você, funciona em restaurante e na arena, e erra pouco o bastante para o objetivo.
      </Legenda>

      <div className="mt-4 space-y-3">
        {linhas.map(([o, q, ex]) => (
          <div key={o} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="w-24 shrink-0 text-[13px] text-creme">{o}</span>
            <span className="tabular text-[13px] text-verde">{q}</span>
            <span className="w-full text-[12px] text-fraco sm:w-auto">{ex}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Legenda>
          Nos dias de jogo, some um punho de carboidrato na refeição anterior à quadra. Não é
          licença: é o que evita você chegar no fim do jogo sem gás e comer qualquer coisa depois.
        </Legenda>
      </div>
    </Cartao>
  );
}

// ─────────────────────── plano de refeições ───────────────────────

function BlocoRefeicoes({ dados, refeicoes }: { dados: DadosApp; refeicoes: Refeicao[] }) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Refeicao | null>(null);

  const recente = useMemo(
    () => adesaoRecente(refeicoes, dados.porData, 14),
    [refeicoes, dados.porData],
  );

  async function semear() {
    const agora = new Date().toISOString();
    for (const r of REFEICOES_SUGERIDAS) await dados.refeicoes.salvar({ ...r, criadoEm: agora });
  }

  function abrir(r: Refeicao | null) { setEditando(r); setAberta(true); }

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Refeição</Botao>
      }>O plano</TituloSecao>

      {!refeicoes.length ? (
        <div className="space-y-3">
          <Vazio titulo="Nenhuma refeição no plano">
            O modelo pronto já vem ancorado no seu dia de verdade: acordar tarde, comer antes de sair,
            comer em pé na arena, e ter um plano para a madrugada em vez de uma proibição.
          </Vazio>
          <Botao variante="secundario" className="w-full" onClick={() => void semear()}>
            <Utensils size={16} />Começar com o plano montado para o meu dia
          </Botao>
        </div>
      ) : (
        <>
          {recente.diasComRegistro > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Metrica rotulo="Adesão 14 dias" valor={Math.round(recente.adesao * 100) + '%'}
                tamanho="medio" cor={recente.adesao >= 0.8 ? 'text-verde' : 'text-creme'}
                detalhe={recente.diasComRegistro + ' dia(s) com registro'} />
              <Metrica rotulo="Proteína média" valor={recente.proteinaMedia + ' g'} tamanho="medio"
                detalhe={recente.diasComProteina + ' dia(s) contados'} />
            </div>
          )}

          <div className="space-y-1">
            {refeicoes.map((r) => (
              <button key={r.id} onClick={() => abrir(r)}
                className={'flex w-full items-start gap-3 rounded-sm px-2 py-2.5 text-left transition-colors hover:bg-superficie2 '
                  + (r.ativa ? '' : 'opacity-45')}>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm">{r.nome}</span>
                    {!r.ativa && <Pilula>pausada</Pilula>}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-fraco">{r.ancora}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-fraco">
                    {r.opcoes.length} opção(ões) · piso: {r.piso}
                  </span>
                </span>
                <span className="tabular shrink-0 text-[12px] text-verde">{r.proteinaG} g</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <Legenda>
              Adesão acima de 80% com o plano imperfeito vence adesão de 40% com o plano perfeito.
              Se uma refeição falha três semanas seguidas, o problema é ela — troque a âncora, baixe
              o piso, ou pause. Plano que não cabe no dia não é disciplina que falta.
            </Legenda>
          </div>
        </>
      )}

      <FormularioRefeicao aberta={aberta} aoFechar={() => setAberta(false)}
        refeicao={editando} dados={dados} />
    </Cartao>
  );
}

function FormularioRefeicao({
  aberta, aoFechar, refeicao, dados,
}: { aberta: boolean; aoFechar: () => void; refeicao: Refeicao | null; dados: DadosApp }) {
  const [nome, setNome] = useState('');
  const [ancora, setAncora] = useState('');
  const [proteina, setProteina] = useState('30');
  const [piso, setPiso] = useState('');
  const [opcoes, setOpcoes] = useState('');
  const [ativa, setAtiva] = useState(true);
  const [chave, setChave] = useState('');

  const idAtual = refeicao?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setNome(refeicao?.nome || '');
    setAncora(refeicao?.ancora || '');
    setProteina(String(refeicao?.proteinaG ?? 30));
    setPiso(refeicao?.piso || '');
    setOpcoes((refeicao?.opcoes || []).join('\n'));
    setAtiva(refeicao?.ativa ?? true);
  }
  if (!aberta && chave) setChave('');

  async function gravar() {
    await dados.refeicoes.salvar({
      id: refeicao?.id,
      nome: nome.trim() || 'Refeição',
      ancora: ancora.trim(),
      proteinaG: Number(proteina) || 0,
      piso: piso.trim(),
      opcoes: opcoes.split('\n').map((s) => s.trim()).filter(Boolean),
      ativa,
      ordem: refeicao?.ordem ?? dados.refeicoes.itens.length + 1,
      criadoEm: refeicao?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={refeicao ? 'Editar refeição' : 'Nova refeição'}>
      <div className="space-y-4">
        <Campo rotulo="Nome">
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Depois de jogar" />
        </Campo>

        <Campo rotulo="Âncora"
          dica="Um evento do seu dia, não um horário. Quem trabalha à noite nunca cumpre um plano que diz 19h.">
          <Entrada value={ancora} onChange={(e) => setAncora(e.target.value)}
            placeholder="Logo que sai da quadra" />
        </Campo>

        <Campo rotulo="Proteína (g)" dica="Some as refeições e o total deve bater com o seu alvo do dia.">
          <Entrada type="number" inputMode="numeric" value={proteina}
            onChange={(e) => setProteina(e.target.value)} />
        </Campo>

        <Campo rotulo="Piso" dica="A versão mínima que ainda conta como feita. Serve para o dia ruim.">
          <Entrada value={piso} onChange={(e) => setPiso(e.target.value)}
            placeholder="Leite com achocolatado" />
        </Campo>

        <Campo rotulo="Opções" dica="Uma por linha. Escolher de uma lista é mais fácil que decidir do zero.">
          <AreaTexto rows={4} value={opcoes} onChange={(e) => setOpcoes(e.target.value)}
            placeholder={'Arroz, feijão e frango\nMacarrão com carne moída'} />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!nome.trim()}>Salvar</Botao>
          {refeicao && (
            <>
              <Botao variante="secundario" onClick={() => setAtiva(!ativa)}>
                {ativa ? 'Pausar' : 'Reativar'}
              </Botao>
              <Botao variante="perigo"
                onClick={() => { void dados.refeicoes.remover(refeicao.id); aoFechar(); }}>
                <Trash2 size={15} />
              </Botao>
            </>
          )}
        </div>
      </div>
    </Folha>
  );
}

// ─────────────────────── configuração do plano ───────────────────────

function BlocoPlano({ dados }: { dados: DadosApp }) {
  const p = dados.perfil;
  const [salvo, setSalvo] = useState(false);

  async function gravar(campo: string, valor: string | number) {
    await dados.salvarPerfil({ [campo]: valor });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <Cartao>
      <TituloSecao>O seu plano</TituloSecao>
      <Legenda>
        Estes campos alimentam o cálculo de gasto e de proteína. O peso-alvo fica em Ajustes, junto
        com os outros números de referência.
      </Legenda>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Campo rotulo="Altura (cm)">
            <Entrada type="number" inputMode="numeric" defaultValue={p.alturaCm ?? ''}
              onBlur={(e) => void gravar('alturaCm', Number(e.target.value) || 0)} placeholder="178" />
          </Campo>
          <Campo rotulo="Idade">
            <Entrada type="number" inputMode="numeric" defaultValue={p.idade ?? ''}
              onBlur={(e) => void gravar('idade', Number(e.target.value) || 0)} placeholder="30" />
          </Campo>
          <Campo rotulo="Sexo biológico" dica="Muda a equação.">
            <Selecao defaultValue={p.sexo || ''} onChange={(e) => void gravar('sexo', e.target.value)}>
              <option value="">Escolher…</option>
              <option value="m">Masculino</option>
              <option value="f">Feminino</option>
            </Selecao>
          </Campo>
        </div>

        <Campo rotulo="Nível de atividade"
          dica="Conte o dia inteiro, não só o treino: ficar em pé na arena pesa mais que uma hora de academia.">
          <div className="space-y-1.5">
            {(Object.keys(FATORES) as NivelAtividade[]).map((n) => (
              <button key={n} onClick={() => void gravar('nivelAtividade', n)}
                className={'flex w-full items-start gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors '
                  + ((p.nivelAtividade || 'moderado') === n
                    ? 'border-creme text-creme' : 'border-borda2 text-fraco hover:text-suave')}>
                <span className="min-w-0">
                  <span className="block text-[13px]">{FATORES[n].nome}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug">{FATORES[n].descricao}</span>
                </span>
              </button>
            ))}
          </div>
        </Campo>

        <Campo rotulo="Ritmo alvo (kg por semana)"
          dica="Negativo para perder. Entre 0,4 e 0,8 kg é a faixa que preserva músculo; abaixo de 0,3 não aparece na balança e desanima.">
          <Entrada type="number" inputMode="decimal" step="0.1" defaultValue={p.ritmoSemanal ?? ''}
            onBlur={(e) => void gravar('ritmoSemanal', Number(e.target.value) || 0)} placeholder="-0,6" />
        </Campo>

        {salvo && <Aviso tom="bom">Salvo.</Aviso>}
      </div>
    </Cartao>
  );
}

/**
 * Dia de jogo e dia de torneio.
 *
 * Isto existia como buraco: o plano comum é desenhado para um dia comum, e um
 * torneio de onze horas na quadra é outro problema. É justamente o dia em que a
 * adesão vai a zero — sem cozinha por perto, em pé, gerindo e jogando — e é o
 * dia em que o desempenho mais importa, porque é ele que gera contato e receita.
 *
 * O protocolo é de leitura, não de registro: cobrar marcação num dia de torneio
 * seria inventar mais uma tarefa justamente quando não sobra mão.
 */
function BlocoDiaDeJogo({ destacado }: { destacado: boolean }) {
  const blocos: { quando: string; o: string; porque: string }[] = [
    {
      quando: '3 h antes',
      o: 'Refeição normal, com carboidrato reforçado e pouca gordura: arroz com frango e salada leve, ou macarrão com carne moída.',
      porque: 'Gordura e fibra em excesso atrasam o esvaziamento do estômago e viram peso na quadra.',
    },
    {
      quando: '1 h antes',
      o: 'Algo pequeno e fácil: uma banana, um pão com mel, meio isotônico.',
      porque: 'Topo o combustível sem pesar. Se você já comeu bem 3 h antes, isso é opcional.',
    },
    {
      quando: 'Durante, a cada 45 a 60 min',
      o: 'Carboidrato simples e líquido com sal: fruta, pão, isotônico, água de coco. 500 a 800 ml de líquido por hora.',
      porque: 'Em Salvador a perda por suor passa de 1 L por hora. Desidratação de 2% do peso já derruba coordenação — e coordenação é o seu jogo.',
    },
    {
      quando: 'Entre jogos, se der mais de 2 h',
      o: 'Refeição leve com proteína: sanduíche de frango, iogurte com fruta, tapioca com ovo.',
      porque: 'Segura a fome sem deixar você pesado para o próximo jogo.',
    },
    {
      quando: 'Até 1 h depois do último jogo',
      o: 'Proteína mais carboidrato juntos: leite com achocolatado e um sanduíche já resolve.',
      porque: 'É a janela em que a recuperação anda mais rápido — e é o que evita você chegar em casa faminto e comer qualquer coisa.',
    },
  ];

  const mochila = [
    '2 garrafas de água (1 L cada)', 'Isotônico ou sal de reidratação',
    'Banana e uma fruta seca', 'Sanduíche de frango ou atum',
    'Castanhas', 'Leite achocolatado de caixinha',
  ];

  return (
    <Cartao tom={destacado ? 'placar' : 'calmo'}>
      <TituloSecao acao={destacado ? <Pilula cor="#EE6018">hoje</Pilula> : undefined}>
        Dia de jogo e de torneio
      </TituloSecao>
      <Legenda>
        Um torneio de dois dias com onze horas de quadra não é um dia comum com esporte no meio. É o
        dia em que o plano normal não cabe — e o único em que comer errado custa desempenho na hora,
        não daqui a um mês.
      </Legenda>

      <div className="mt-4 space-y-3">
        {blocos.map((b) => (
          <div key={b.quando} className="border-t border-borda2 pt-3 first:border-0 first:pt-0">
            <div className="rotulo text-ouro">{b.quando}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-creme">{b.o}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-fraco">{b.porque}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-borda2 pt-3">
        <div className="rotulo mb-2 text-fraco">Na mochila, no dia anterior</div>
        <div className="flex flex-wrap gap-1.5">
          {mochila.map((i) => <Pilula key={i}>{i}</Pilula>)}
        </div>
        <div className="mt-3">
          <Legenda>
            Montar isso na véspera é o que decide. No dia, entre uma partida e a organização da
            chave, ninguém vai atrás de comida — come o que estiver na mão, e o que está na mão é
            o que a barraca vende.
          </Legenda>
        </div>
      </div>
    </Cartao>
  );
}
