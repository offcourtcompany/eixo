/**
 * Carga total: academia mais quadra.
 *
 * O cartão tem uma tese e a defende com um gráfico só: **as duas coisas são o
 * mesmo esforço.** Por isso as barras são empilhadas, e não lado a lado —
 * lado a lado convida a comparar academia com quadra, quando a pergunta certa
 * é quanto o dia inteiro pesou.
 *
 * O registro da quadra fica aqui, colado na leitura que ele alimenta, e leva
 * dois toques: minutos e um esforço de 1 a 10. Qualquer coisa mais elaborada
 * que isso não é preenchida depois de um jogo à noite.
 */
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DadosApp } from '../dadosApp';
import { hoje, somaDias, dataCurta, numero, porcento } from '../formato';
import { serieDeCarga, lerCarga, recadoDaCarga } from '../logica/carga';
import { sonoRecente } from '../logica/nutricao';
import { Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, Folha, Aviso, Legenda } from './ui';

const ESFORCOS = [
  { v: 3, rotulo: 'leve', dica: 'bate-bola, conversa fácil' },
  { v: 5, rotulo: 'moderado', dica: 'jogo normal, suando' },
  { v: 7, rotulo: 'forte', dica: 'jogo duro, ofegante' },
  { v: 9, rotulo: 'máximo', dica: 'torneio, final apertada' },
];

export function BlocoCarga({ dados }: { dados: DadosApp }) {
  const [aberta, setAberta] = useState(false);

  const treinos = dados.treinos.itens;
  const dias = dados.dias;

  const leitura = useMemo(() => lerCarga(treinos, dias), [treinos, dias]);
  const serie = useMemo(
    () => serieDeCarga(treinos, dias, hoje(), 28).map((d) => ({
      data: dataCurta(d.data),
      Academia: d.academia,
      Quadra: d.quadra,
    })),
    [treinos, dias],
  );

  const sono = useMemo(() => sonoRecente(dados.porData), [dados.porData]);
  const recado = recadoDaCarga(leitura, sono.media ?? undefined);

  const corDaZona = {
    parado: 'text-fraco', leve: 'text-verde', ok: 'text-verde',
    alta: 'text-creme', pico: 'text-perigo',
  }[leitura.zona];

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={() => setAberta(true)}>Registrar quadra</Botao>
      }>Carga total</TituloSecao>

      <Legenda>
        Musculação e quadra na mesma régua: minutos vezes esforço. O corpo não separa as duas, e a
        conta de quem joga costuma ser a que falta.
      </Legenda>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metrica rotulo="Semana" valor={numero(leitura.totalSemana)} tamanho="medio"
          detalhe={numero(leitura.academiaSemana) + ' academia · ' + numero(leitura.quadraSemana) + ' quadra'} />
        <Metrica rotulo="Semana × mês" tamanho="medio" cor={corDaZona}
          valor={leitura.cronica > 0 ? porcento(leitura.razao) : '—'}
          detalhe={leitura.confiavel ? leitura.zona : 'ainda medindo'} />
        <Metrica rotulo="Sessões" valor={numero(leitura.sessoesSemana)} tamanho="medio"
          detalhe={numero(leitura.diasParados) + ' dias parados'} />
      </div>

      <div className="-ml-2 mt-5 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <XAxis dataKey="data" tick={{ fill: '#8A8380', fontSize: 10 }} axisLine={false} tickLine={false}
              interval="preserveStartEnd" minTickGap={20} />
            <YAxis tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false}
              width={34} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#ffffff10' }}
              contentStyle={{ background: '#101010', border: '1px solid #3D3A39', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#EEEEEE' }} />
            {leitura.cronica > 0 && (
              <ReferenceLine y={Math.round(leitura.cronica)} stroke="#8A8380" strokeDasharray="3 4"
                label={{ value: 'média do mês', fill: '#8A8380', fontSize: 10, position: 'insideTopRight' }} />
            )}
            <Bar dataKey="Academia" stackId="c" fill="#EE6018" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Quadra" stackId="c" fill="#A0CA92" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <Aviso tom={recado.tom}>
          <b>{recado.titulo}.</b> {recado.texto}
        </Aviso>
      </div>

      {leitura.temEstimativa && (
        <div className="mt-3">
          <Legenda>
            Algum dia de jogo desta semana entrou como estimativa de 90 minutos a esforço 6, porque
            só o dia foi marcado. Registrar os minutos troca o chute pelo que aconteceu.
          </Legenda>
        </div>
      )}

      <FolhaDaQuadra aberta={aberta} aoFechar={() => setAberta(false)} dados={dados} />
    </Cartao>
  );
}

function FolhaDaQuadra({
  aberta, aoFechar, dados,
}: { aberta: boolean; aoFechar: () => void; dados: DadosApp }) {
  const [data, setData] = useState(hoje());
  const [minutos, setMinutos] = useState('');
  const [esforco, setEsforco] = useState(6);
  const [chave, setChave] = useState('');

  const dia = dados.porData.get(data);

  // Ao abrir, e a cada troca de data, o formulário mostra o que já existe
  // naquele dia em vez de um campo vazio que apagaria o registro anterior.
  const marca = aberta ? data : '';
  if (chave !== marca) {
    setChave(marca);
    if (aberta) {
      setMinutos(dia?.quadraMin ? String(dia.quadraMin) : '');
      setEsforco(dia?.quadraEsforco || 6);
    }
  }

  async function gravar() {
    // Zero é gravado como zero, e não como campo ausente: a gravação do dia
    // mescla, então `undefined` deixaria o registro velho de pé e tiraria de
    // você a única forma de corrigir um minuto digitado errado.
    const n = Number(minutos) || 0;
    await dados.salvarDia({
      id: data,
      quadraMin: n,
      quadraEsforco: esforco,
      diaDeJogo: n > 0 ? true : dia?.diaDeJogo,
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Quadra">
      <div className="space-y-4">
        <Campo rotulo="Dia">
          <Entrada type="date" value={data} max={hoje()} min={somaDias(hoje(), -30)}
            onChange={(e) => setData(e.target.value)} />
        </Campo>

        <Campo rotulo="Minutos em quadra"
          dica="O tempo jogando, não o tempo na arena. Aquecimento e conversa entre games não contam.">
          <Entrada type="number" inputMode="numeric" value={minutos}
            onChange={(e) => setMinutos(e.target.value)} placeholder="90" />
        </Campo>

        <Campo rotulo="Como foi o esforço">
          <div className="grid grid-cols-2 gap-2">
            {ESFORCOS.map((e) => (
              <button key={e.v} onClick={() => setEsforco(e.v)}
                className={'rounded-sm border px-3 py-2.5 text-left transition-colors '
                  + (esforco === e.v ? 'border-creme text-creme' : 'border-borda2 text-suave hover:border-borda')}>
                <div className="text-[13px]">{e.rotulo}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-fraco">{e.dica}</div>
              </button>
            ))}
          </div>
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}>Salvar</Botao>
        </div>

        <Legenda>
          Esforço percebido é medida de verdade, não aproximação de pobre — ela acompanha frequência
          cardíaca de perto o bastante para o que serve aqui, e não depende de relógio nenhum.
        </Legenda>
      </div>
    </Folha>
  );
}
