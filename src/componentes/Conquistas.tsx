/**
 * Conquistas — carro, entrada de apartamento, equipamento.
 *
 * Metas de trimestre respondem "o que eu faço"; conquistas respondem "para
 * quê". As duas precisam existir, e por isso ficam na mesma tela.
 *
 * Duas contas aqui não são decoração, e são as que quase ninguém faz:
 *
 * **Juntar enquanto se paga rotativo é aritmética negativa.** Guardar dinheiro
 * rendendo pouco enquanto uma dívida cobra 15% ao mês é perder a diferença
 * todo mês, com sorriso no rosto porque a barrinha anda. A tela diz isso.
 *
 * **Quase toda conquista aumenta o custo fixo depois de comprada.** Carro melhor
 * é seguro maior, IPVA maior, manutenção maior — um piso mensal mais alto para
 * sempre. Com receita ainda dependente de evento, isso é o oposto do objetivo,
 * e o app mostra o piso novo em vez de só comemorar.
 */
import { useMemo, useState } from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Conquista } from '../tipos';
import { moeda, moedaCurta, numero } from '../formato';
import { Cartao, TituloSecao, Botao, Campo, Entrada, AreaTexto, Selecao, Folha, Vazio, Barra, Legenda, Aviso, Pilula } from './ui';

export function BlocoConquistas({
  dados, sobraMensal, jurosMensais, pisoFixo, previsivel,
}: {
  dados: DadosApp; sobraMensal: number; jurosMensais: number;
  pisoFixo: number; previsivel: number;
}) {
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Conquista | null>(null);

  const ativas = dados.conquistas.itens
    .filter((c) => c.status === 'sonhando' || c.status === 'juntando')
    .sort((a, b) => a.ordem - b.ordem);
  const conquistadas = dados.conquistas.itens.filter((c) => c.status === 'conquistada');

  function abrir(c: Conquista | null) { setEditando(c); setAberta(true); }

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Conquista</Botao>
      }>Conquistas</TituloSecao>

      {!ativas.length && !conquistadas.length ? (
        <Vazio titulo="Nada na lista">
          Carro, entrada de apartamento, equipamento, viagem. Meta de trimestre diz o que fazer;
          conquista diz para quê — e as duas juntas evitam tanto o mês sem direção quanto o ano
          inteiro de sacrifício sem nada do outro lado.
        </Vazio>
      ) : (
        <div className="space-y-4">
          {ativas.map((c) => (
            <LinhaDeConquista key={c.id} c={c} sobraMensal={sobraMensal} jurosMensais={jurosMensais}
              pisoFixo={pisoFixo} previsivel={previsivel} aoAbrir={() => abrir(c)} />
          ))}

          {conquistadas.length > 0 && (
            <div className="border-t border-borda2 pt-3">
              <div className="rotulo mb-2 text-fraco">Conquistadas · {conquistadas.length}</div>
              <div className="flex flex-wrap gap-1.5">
                {conquistadas.map((c) => (
                  <button key={c.id} onClick={() => abrir(c)}>
                    <Pilula cor="#A0CA92">{c.nome}</Pilula>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <FormularioConquista aberta={aberta} aoFechar={() => setAberta(false)}
        conquista={editando} dados={dados} />
    </Cartao>
  );
}

function LinhaDeConquista({
  c, sobraMensal, jurosMensais, pisoFixo, previsivel, aoAbrir,
}: {
  c: Conquista; sobraMensal: number; jurosMensais: number;
  pisoFixo: number; previsivel: number; aoAbrir: () => void;
}) {
  const falta = Math.max(0, c.custo - c.guardado);
  const meses = sobraMensal > 0 ? Math.ceil(falta / sobraMensal) : null;
  const pisoDepois = pisoFixo + (c.custoMensalDepois || 0);
  const cobreDepois = previsivel >= pisoDepois;

  return (
    <div className="border-t border-borda2 pt-4 first:border-0 first:pt-0">
      <button onClick={aoAbrir} className="w-full text-left">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 flex-1 truncate text-sm">{c.nome}</span>
          <span className="tabular shrink-0 text-[13px] text-suave">
            {moedaCurta(c.guardado)} <span className="text-fraco">de {moedaCurta(c.custo)}</span>
          </span>
        </div>
        <div className="mt-2">
          <Barra valor={c.custo ? c.guardado / c.custo : 0}
            cor={c.guardado >= c.custo ? 'var(--color-verde)' : 'var(--color-creme)'} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-fraco">
          <span>Faltam <span className="tabular text-suave">{moeda(falta)}</span></span>
          {meses !== null && falta > 0 && (
            <span>No ritmo de hoje, <span className="tabular text-suave">{meses} mês(es)</span></span>
          )}
          {c.prazo && <span>Prazo {c.prazo.slice(8)}/{c.prazo.slice(5, 7)}/{c.prazo.slice(0, 4)}</span>}
        </div>
      </button>

      {/* As duas contas que mudam a decisão. */}
      {falta > 0 && jurosMensais > 0 && (
        <div className="mt-3">
          <Aviso>
            Você paga <b>{moeda(jurosMensais)}</b> de juros por mês. Cada real guardado aqui rende
            menos do que esse juro cobra — enquanto a dívida existir, quitar antes é matematicamente
            melhor do que juntar, mesmo que ande mais devagar no papel.
          </Aviso>
        </div>
      )}

      {(c.custoMensalDepois || 0) > 0 && (
        <div className="mt-3">
          <Aviso tom={cobreDepois ? 'info' : 'alerta'}>
            Depois de conquistada, ela <b>soma {moeda(c.custoMensalDepois!)} ao seu custo fixo</b> —
            o piso passa de {moeda(pisoFixo)} para {moeda(pisoDepois)}.{' '}
            {cobreDepois
              ? 'A sua receita previsível cobre esse piso novo.'
              : `A receita previsível de hoje (${moeda(previsivel)}) não cobre esse piso. Conquistar antes de resolver isso troca uma alegria por uma obrigação mensal maior.`}
          </Aviso>
        </div>
      )}

      {c.porque && (
        <p className="mt-2 text-[12px] leading-relaxed text-fraco">{c.porque}</p>
      )}
    </div>
  );
}

function FormularioConquista({
  aberta, aoFechar, conquista, dados,
}: { aberta: boolean; aoFechar: () => void; conquista: Conquista | null; dados: DadosApp }) {
  const [v, setV] = useState({
    nome: '', tipo: 'compra' as Conquista['tipo'], custo: '', guardado: '',
    prazo: '', porque: '', custoMensalDepois: '', status: 'sonhando' as Conquista['status'],
  });
  const [chave, setChave] = useState('');

  const idAtual = conquista?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setV({
      nome: conquista?.nome || '',
      tipo: conquista?.tipo || 'compra',
      custo: conquista ? String(conquista.custo) : '',
      guardado: conquista ? String(conquista.guardado) : '',
      prazo: conquista?.prazo || '',
      porque: conquista?.porque || '',
      custoMensalDepois: conquista?.custoMensalDepois ? String(conquista.custoMensalDepois) : '',
      status: conquista?.status || 'sonhando',
    });
  }
  if (!aberta && chave) setChave('');

  const guardar = useMemo(() => Number(v.guardado) || 0, [v.guardado]);
  const custo = useMemo(() => Number(v.custo) || 0, [v.custo]);

  async function gravar() {
    await dados.conquistas.salvar({
      id: conquista?.id,
      nome: v.nome.trim() || 'Conquista',
      tipo: v.tipo,
      custo,
      guardado: guardar,
      prazo: v.prazo || undefined,
      porque: v.porque.trim() || undefined,
      custoMensalDepois: Number(v.custoMensalDepois) || undefined,
      status: v.status,
      ordem: conquista?.ordem ?? dados.conquistas.itens.length + 1,
      criadoEm: conquista?.criadoEm || new Date().toISOString(),
    });
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar}
      titulo={conquista ? 'Editar conquista' : 'Nova conquista'}>
      <div className="space-y-4">
        <Campo rotulo="O que é">
          <Entrada value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })}
            placeholder="Entrada do apartamento" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Quanto custa (R$)">
            <Entrada type="number" inputMode="decimal" value={v.custo}
              onChange={(e) => setV({ ...v, custo: e.target.value })} placeholder="40000" />
          </Campo>
          <Campo rotulo="Quanto já tem (R$)">
            <Entrada type="number" inputMode="decimal" value={v.guardado}
              onChange={(e) => setV({ ...v, guardado: e.target.value })} placeholder="0" />
          </Campo>
        </div>

        {/* O campo que muda a decisão, e por isso vem com a explicação junto. */}
        <Campo rotulo="Quanto ela soma ao custo fixo depois (R$/mês)"
          dica="Seguro, IPVA, manutenção, condomínio, assinatura. Carro melhor é piso mensal mais alto para sempre — é aqui que a conquista cobra o preço de verdade.">
          <Entrada type="number" inputMode="decimal" value={v.custoMensalDepois}
            onChange={(e) => setV({ ...v, custoMensalDepois: e.target.value })} placeholder="0" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Prazo desejado">
            <Entrada type="date" value={v.prazo}
              onChange={(e) => setV({ ...v, prazo: e.target.value })} />
          </Campo>
          <Campo rotulo="Situação">
            <Selecao value={v.status}
              onChange={(e) => setV({ ...v, status: e.target.value as Conquista['status'] })}>
              <option value="sonhando">Só na lista</option>
              <option value="juntando">Juntando</option>
              <option value="conquistada">Conquistada</option>
              <option value="descartada">Descartada</option>
            </Selecao>
          </Campo>
        </div>

        <Campo rotulo="Por que ela importa"
          dica="Escrever isso é o que separa vontade de impulso. Daqui a um ano você relê e sabe se ainda vale.">
          <AreaTexto rows={2} value={v.porque}
            onChange={(e) => setV({ ...v, porque: e.target.value })} />
        </Campo>

        {custo > 0 && guardar >= custo && v.status !== 'conquistada' && (
          <Aviso tom="bom">
            <Trophy size={14} className="mr-1.5 inline" />
            Já tem o valor inteiro. Marque como conquistada quando acontecer.
          </Aviso>
        )}

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" className="flex-1" onClick={() => void gravar()}
            disabled={!v.nome.trim()}>Salvar</Botao>
          {conquista && (
            <Botao variante="perigo"
              onClick={() => { void dados.conquistas.remover(conquista.id); aoFechar(); }}>
              <Trash2 size={15} />
            </Botao>
          )}
        </div>

        <Legenda>
          O número que quase ninguém escreve é o de cima: quanto a conquista custa <b>por mês,
          depois</b>. É ele que decide se ela te aproxima ou te afasta de ter receita previsível
          maior que o piso — e {numero(0)} nesse campo costuma ser otimismo, não realidade.
        </Legenda>
      </div>
    </Folha>
  );
}
