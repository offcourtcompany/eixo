/**
 * Dívida e reserva ao longo do tempo.
 *
 * `Divida.saldo` é um número que você sobrescreve — ele diz onde você está e
 * apaga por onde passou. Num alvo de um a dois anos, ver a linha cair é o que
 * sustenta o hábito de abrir o app, então aqui cada ponto vira um documento com
 * data e fica.
 *
 * O registro é manual e de uma tela só, mas já vem preenchido com o saldo que o
 * app calculou: você confere e confirma, em vez de digitar de novo o que ele já
 * sabe. O campo de nota existe para o ponto ter causa — "seguro trocado",
 * "cota vendida" — e é isso que transforma a curva em prova de que trocar
 * contrato funciona melhor do que apertar gasto.
 */
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Marco } from '../tipos';
import { moeda, moedaCurta, hoje, dataCurta } from '../formato';
import { saldoTotal } from '../logica/dividas';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, AreaTexto, Folha, Vazio, Barra, Legenda, Aviso,
} from './ui';

export function BlocoPatrimonio({ dados }: { dados: DadosApp }) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Marco | null>(null);

  const marcos = dados.marcos.itens;
  const ultimo = marcos.length ? marcos[marcos.length - 1] : null;

  const dividaAgora = saldoTotal(dados.dividas.itens.filter((d) => d.ativa));
  const reservaAgora = ultimo?.reserva ?? 0;

  const custoFixo = dados.perfil.custoFixoMensal || 0;
  const alvoMeses = dados.perfil.reservaAlvoMeses || 0;
  const reservaAlvo = custoFixo * alvoMeses;

  const serie = useMemo(
    () => marcos.map((m) => ({
      data: dataCurta(m.id),
      Dívida: Math.round(m.dividaTotal),
      Reserva: Math.round(m.reserva),
      nota: m.nota,
    })),
    [marcos],
  );

  // Quanto a dívida andou desde o primeiro ponto — o número que responde
  // "está funcionando?" sem precisar interpretar gráfico.
  const primeiro = marcos[0];
  const variacao = primeiro && ultimo && marcos.length > 1
    ? ultimo.dividaTotal - primeiro.dividaTotal
    : null;

  function abrir(m: Marco | null) { setEditando(m); setAberta(true); }

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Ponto</Botao>
      }>Dívida e reserva</TituloSecao>

      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo="Dívida hoje" valor={moedaCurta(dividaAgora)}
          cor={dividaAgora > 0 ? 'text-perigo' : 'text-verde'} tamanho="medio"
          detalhe="soma das dívidas ativas" />
        <Metrica rotulo="Reserva" valor={moedaCurta(reservaAgora)}
          cor={reservaAgora > 0 ? 'text-verde' : 'text-fraco'} tamanho="medio"
          detalhe={ultimo ? 'no ponto de ' + dataCurta(ultimo.id) : 'nunca registrada'} />
        <Metrica rotulo="Na curva" tamanho="medio"
          valor={variacao === null ? '—' : (variacao > 0 ? '+' : '') + moedaCurta(variacao)}
          cor={variacao === null ? 'text-fraco' : variacao <= 0 ? 'text-verde' : 'text-perigo'}
          detalhe={variacao === null ? 'precisa de dois pontos' : 'de ' + dataCurta(primeiro.id) + ' até o último ponto'} />
      </div>

      {/* Dois números de dívida no mesmo cartão confundem: um é o saldo que o
          app calcula agora, o outro é o último ponto da curva. Quando eles se
          afastam, o certo não é escolher um — é dizer que a curva envelheceu. */}
      {ultimo && Math.abs(ultimo.dividaTotal - dividaAgora) > 1 && (
        <div className="mt-4">
          <Aviso tom="info">
            O último ponto da curva marca {moeda(ultimo.dividaTotal)} e o saldo somado hoje é{' '}
            {moeda(dividaAgora)}. A diferença é o que andou desde {dataCurta(ultimo.id)} —{' '}
            <b>registre um ponto novo</b> para a linha alcançar a realidade.
          </Aviso>
        </div>
      )}

      {/* A reserva-alvo sai de dois campos que você já preencheu em Ajustes:
          custo fixo × meses de colchão. Sem os dois, não há alvo a mostrar. */}
      {reservaAlvo > 0 && (
        <div className="mt-5 border-t border-borda2 pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="rotulo text-fraco">Reserva × alvo de {alvoMeses} {alvoMeses === 1 ? 'mês' : 'meses'}</span>
            <span className="tabular text-sm">{moeda(reservaAgora)} / {moeda(reservaAlvo)}</span>
          </div>
          <Barra valor={reservaAlvo ? reservaAgora / reservaAlvo : 0}
            cor={reservaAgora >= reservaAlvo ? 'var(--color-verde)' : 'var(--color-creme)'} />
        </div>
      )}

      {serie.length < 2 ? (
        <div className="mt-4">
          <Vazio titulo={serie.length ? 'Um ponto registrado' : 'Nenhum ponto ainda'}>
            Registre o saldo uma vez por mês — o app já preenche com o que ele calculou, você só
            confere. Com dois pontos a curva aparece; com seis, ela vira a prova de que trocar
            contrato derruba dívida mais rápido do que apertar gasto.
          </Vazio>
        </div>
      ) : (
        <div className="-ml-2 mt-5 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
              <XAxis dataKey="data" tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8380', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? (v / 1000) + 'k' : String(v))} width={38} />
              <Tooltip
                contentStyle={{ background: '#101010', border: '1px solid #3D3A39', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#EEEEEE' }}
                formatter={(v, n) => [moeda(Number(v)), String(n)]} />
              {reservaAlvo > 0 && (
                <ReferenceLine y={reservaAlvo} stroke="#A0CA92" strokeDasharray="4 4"
                  label={{ value: 'reserva alvo', fill: '#A0CA92', fontSize: 10, position: 'insideTopRight' }} />
              )}
              <Line type="monotone" dataKey="Dívida" stroke="#EE6018" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Reserva" stroke="#A0CA92" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {marcos.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-borda2 pt-3">
          {[...marcos].reverse().slice(0, 6).map((m) => (
            <button key={m.id} onClick={() => abrir(m)}
              className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-superficie2">
              <span className="tabular w-16 shrink-0 text-[12px] text-fraco">{dataCurta(m.id)}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-suave">
                {m.nota || 'sem nota'}
              </span>
              <span className="tabular shrink-0 text-[13px] text-perigo">{moedaCurta(m.dividaTotal)}</span>
            </button>
          ))}
        </div>
      )}

      <FormularioMarco aberta={aberta} aoFechar={() => setAberta(false)} marco={editando}
        dados={dados} dividaCalculada={dividaAgora} reservaAnterior={reservaAgora} />
    </Cartao>
  );
}

function FormularioMarco({
  aberta, aoFechar, marco, dados, dividaCalculada, reservaAnterior,
}: {
  aberta: boolean; aoFechar: () => void; marco: Marco | null;
  dados: DadosApp; dividaCalculada: number; reservaAnterior: number;
}) {
  const [data, setData] = useState(hoje());
  const [divida, setDivida] = useState('');
  const [reserva, setReserva] = useState('');
  const [nota, setNota] = useState('');
  const [chave, setChave] = useState('');

  const idAtual = marco?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setData(marco?.id || hoje());
    // Já vem preenchido com o que o app sabe: conferir é menos trabalho que
    // digitar, e o número conferido é mais confiável que o número lembrado.
    setDivida(String(marco?.dividaTotal ?? Math.round(dividaCalculada)));
    setReserva(String(marco?.reserva ?? Math.round(reservaAnterior)));
    setNota(marco?.nota || '');
  }
  if (!aberta && chave) setChave('');

  async function gravar() {
    await dados.marcos.salvar({
      id: data,
      dividaTotal: Number(divida) || 0,
      reserva: Number(reserva) || 0,
      nota: nota.trim() || undefined,
      criadoEm: marco?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={marco ? 'Editar ponto' : 'Registrar o ponto de hoje'}>
      <div className="space-y-4">
        <Campo rotulo="Data" dica="Um ponto por dia. Registrar de novo no mesmo dia corrige o anterior.">
          <Entrada type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Dívida total (R$)" dica="Já vem com a soma das dívidas ativas.">
            <Entrada type="number" inputMode="decimal" step="0.01" value={divida}
              onChange={(e) => setDivida(e.target.value)} />
          </Campo>
          <Campo rotulo="Reserva (R$)" dica="O que existe guardado hoje.">
            <Entrada type="number" inputMode="decimal" step="0.01" value={reserva}
              onChange={(e) => setReserva(e.target.value)} />
          </Campo>
        </div>

        <Campo rotulo="O que mudou"
          dica="De preferência o nome da mudança de contrato — é o que dá causa ao degrau da curva.">
          <AreaTexto rows={2} value={nota} onChange={(e) => setNota(e.target.value)}
            placeholder="Seguro trocado por temporário" />
        </Campo>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}>Salvar</Botao>
          {marco && (
            <Botao variante="perigo" onClick={() => { void dados.marcos.remover(marco.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>

        <Legenda>
          Uma vez por mês basta. O que importa não é a frequência — é ter pontos suficientes para a
          linha mostrar direção quando você duvidar de que está andando.
        </Legenda>
      </div>
    </Folha>
  );
}
