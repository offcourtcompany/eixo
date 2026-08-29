/**
 * "Quanto tem nisso?" — a consulta de alimentos.
 *
 * É consulta, não diário. Você busca, escolhe a porção, vê o número, e decide
 * se soma ao dia. Nada aqui cobra fechamento: o módulo continua medindo
 * proteína e adesão, e a caloria fica sendo o que ela deve ser — conhecimento
 * na hora de escolher, não uma planilha para alimentar todo dia.
 */
import { useMemo, useState } from 'react';
import { Search, Plus, Trash2, ChevronLeft } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Dia, AlimentoMeu } from '../tipos';
import { numero } from '../formato';
import { catalogo, buscar, calcular, porGrupo, type Achado } from '../logica/alimentos';
import {
  Botao, Campo, Entrada, Folha, Legenda, Aviso, Pilula, Metrica,
} from './ui';

export function ConsultaDeAlimento({
  aberta, aoFechar, dados, dia, data,
}: {
  aberta: boolean; aoFechar: () => void; dados: DadosApp; dia?: Dia; data: string;
}) {
  const [termo, setTermo] = useState('');
  const [escolhido, setEscolhido] = useState<Achado | null>(null);
  const [gramas, setGramas] = useState(100);
  const [somado, setSomado] = useState('');
  const [cadastrando, setCadastrando] = useState(false);

  const lista = useMemo(() => catalogo(dados.alimentos.itens), [dados.alimentos.itens]);
  const achados = useMemo(() => buscar(termo, lista), [termo, lista]);
  const grupos = useMemo(() => porGrupo(achados), [achados]);

  function abrir(a: Achado) {
    setEscolhido(a);
    setGramas(a.porcoes[0]?.g ?? 100);
    setSomado('');
  }

  function voltar() { setEscolhido(null); setSomado(''); }

  async function somarAoDia() {
    if (!escolhido) return;
    const p = calcular(escolhido, gramas);
    await dados.salvarDia({
      id: data,
      proteinaG: Math.max(0, Math.round((dia?.proteinaG || 0) + p.proteina)),
      caloriasKcal: Math.max(0, (dia?.caloriasKcal || 0) + p.kcal),
    });
    setSomado(`Somado: ${p.kcal} kcal e ${numero(p.proteina, 1)} g de proteína.`);
  }

  const conta = escolhido ? calcular(escolhido, gramas) : null;
  const unidade = escolhido?.liquido ? 'ml' : 'g';

  return (
    <Folha aberta={aberta} aoFechar={aoFechar}
      titulo={escolhido ? escolhido.nome : 'Quanto tem nisso?'}>
      {!escolhido ? (
        <div className="space-y-4">
          <Campo rotulo="Buscar alimento" dica="Pode digitar sem acento: “acai”, “feijao”, “pao”.">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fraco" />
              <Entrada autoFocus value={termo} onChange={(e) => setTermo(e.target.value)}
                placeholder="arroz, frango, cerveja…" className="!pl-9" />
            </div>
          </Campo>

          <div className="max-h-[46vh] space-y-4 overflow-y-auto">
            {!achados.length ? (
              <div className="rounded-xl border border-dashed border-borda2 px-4 py-6 text-center">
                <p className="text-[13px] text-suave">Nada encontrado para “{termo}”.</p>
                <div className="mt-3">
                  <Botao variante="secundario" onClick={() => setCadastrando(true)}>
                    <Plus size={15} />Cadastrar este alimento
                  </Botao>
                </div>
              </div>
            ) : grupos.map(([grupo, itens]) => (
              <div key={grupo}>
                <div className="rotulo mb-1.5 text-fraco">{grupo}</div>
                <div className="space-y-0.5">
                  {itens.map((a) => (
                    <button key={(a.meuId || '') + a.nome} onClick={() => abrir(a)}
                      className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-superficie2">
                      <span className="min-w-0 flex-1 truncate text-[13px]">{a.nome}</span>
                      <span className="tabular shrink-0 text-[12px] text-fraco">
                        {a.kcal} kcal{a.liquido ? '/100ml' : '/100g'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-borda2 pt-3">
            <button onClick={() => setCadastrando(true)}
              className="rotulo text-fraco transition-colors hover:text-suave">
              + cadastrar um alimento meu
            </button>
          </div>

          <Legenda>
            Os valores são referência por 100 {unidade}, e preparo muda tudo — o mesmo frango vai de
            165 a 240 kcal dependendo do óleo da frigideira. Erro de 10% a 20% aqui não atrapalha
            decisão nenhuma. Quando o rótulo do produto disser outra coisa, o rótulo ganha: cadastre
            o seu.
          </Legenda>
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={voltar}
            className="flex items-center gap-1 text-[12px] text-fraco transition-colors hover:text-suave">
            <ChevronLeft size={14} />voltar para a busca
          </button>

          <div>
            <div className="rotulo mb-2 text-fraco">Porção</div>
            <div className="flex flex-wrap gap-1.5">
              {escolhido.porcoes.map((p) => (
                <button key={p.nome} onClick={() => setGramas(p.g)}
                  className={'rounded-sm border px-2.5 py-1.5 text-[12px] transition-colors '
                    + (gramas === p.g ? 'border-creme text-creme' : 'border-borda2 text-fraco hover:text-suave')}>
                  {p.nome}
                </button>
              ))}
            </div>
          </div>

          <Campo rotulo={`Quantidade (${unidade})`}>
            <Entrada type="number" inputMode="numeric" value={String(gramas)}
              onChange={(e) => setGramas(Math.max(0, Number(e.target.value) || 0))} />
          </Campo>

          {conta && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Metrica rotulo="Calorias" valor={numero(conta.kcal) + ' kcal'} tamanho="medio" />
                <Metrica rotulo="Proteína" valor={numero(conta.proteina, 1) + ' g'}
                  cor="text-verde" tamanho="medio" />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-suave">
                <span>Carboidrato <span className="tabular text-creme">{numero(conta.carbo, 1)} g</span></span>
                <span>Gordura <span className="tabular text-creme">{numero(conta.gordura, 1)} g</span></span>
              </div>
            </>
          )}

          {somado && <Aviso tom="bom">{somado}</Aviso>}

          <div className="flex gap-2 pt-1">
            <Botao variante="primario" className="flex-1" onClick={() => void somarAoDia()}>
              <Plus size={15} />Somar ao dia
            </Botao>
            <Botao variante="secundario" onClick={voltar}>Só consultar</Botao>
          </div>

          <Legenda>
            Somar é opcional. O app não cobra o fechamento do dia em calorias — quem manda no
            acompanhamento continua sendo a proteína, a adesão e a média de peso.
          </Legenda>
        </div>
      )}

      <FormularioAlimentoMeu aberta={cadastrando} aoFechar={() => setCadastrando(false)}
        dados={dados} nomeInicial={termo} />
    </Folha>
  );
}

/** Cadastro do alimento que a tabela não tem, ou que o rótulo desmente. */
function FormularioAlimentoMeu({
  aberta, aoFechar, dados, nomeInicial,
}: { aberta: boolean; aoFechar: () => void; dados: DadosApp; nomeInicial: string }) {
  const [nome, setNome] = useState('');
  const [kcal, setKcal] = useState('');
  const [proteina, setProteina] = useState('');
  const [carbo, setCarbo] = useState('');
  const [gordura, setGordura] = useState('');
  const [porcaoNome, setPorcaoNome] = useState('');
  const [porcaoG, setPorcaoG] = useState('');
  const [chave, setChave] = useState('');

  if (aberta && chave !== 'aberto') {
    setChave('aberto');
    setNome(nomeInicial);
    setKcal(''); setProteina(''); setCarbo(''); setGordura('');
    setPorcaoNome(''); setPorcaoG('');
  }
  if (!aberta && chave) setChave('');

  async function gravar() {
    const item: Omit<AlimentoMeu, 'id'> = {
      nome: nome.trim(),
      kcal: Number(kcal) || 0,
      proteina: Number(proteina) || 0,
      carbo: Number(carbo) || 0,
      gordura: Number(gordura) || 0,
      porcaoNome: porcaoNome.trim() || undefined,
      porcaoG: Number(porcaoG) || undefined,
      criadoEm: new Date().toISOString(),
    };
    await dados.alimentos.salvar(item);
    aoFechar();
  }

  const meus = dados.alimentos.itens;

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Cadastrar alimento">
      <div className="space-y-4">
        <Aviso tom="info">
          Copie do rótulo a coluna de <b>100 g</b> (ou 100 ml). Se o rótulo só trouxer a porção — “30
          g” —, multiplique para chegar em 100: o valor de 30 g vezes 3,33.
        </Aviso>

        <Campo rotulo="Nome">
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Marmita do Zé — frango com arroz" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Calorias por 100 g">
            <Entrada type="number" inputMode="decimal" value={kcal}
              onChange={(e) => setKcal(e.target.value)} placeholder="165" />
          </Campo>
          <Campo rotulo="Proteína por 100 g">
            <Entrada type="number" inputMode="decimal" step="0.1" value={proteina}
              onChange={(e) => setProteina(e.target.value)} placeholder="31" />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Carboidrato por 100 g">
            <Entrada type="number" inputMode="decimal" step="0.1" value={carbo}
              onChange={(e) => setCarbo(e.target.value)} placeholder="0" />
          </Campo>
          <Campo rotulo="Gordura por 100 g">
            <Entrada type="number" inputMode="decimal" step="0.1" value={gordura}
              onChange={(e) => setGordura(e.target.value)} placeholder="3.6" />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Medida caseira" dica="Opcional, mas é o que faz você não pesar depois.">
            <Entrada value={porcaoNome} onChange={(e) => setPorcaoNome(e.target.value)}
              placeholder="1 marmita" />
          </Campo>
          <Campo rotulo="Quantos gramas ela tem">
            <Entrada type="number" inputMode="numeric" value={porcaoG}
              onChange={(e) => setPorcaoG(e.target.value)} placeholder="450" />
          </Campo>
        </div>

        <Botao variante="primario" className="w-full" onClick={() => void gravar()}
          disabled={!nome.trim() || !kcal}>Salvar alimento</Botao>

        {meus.length > 0 && (
          <div className="border-t border-borda2 pt-3">
            <div className="rotulo mb-2 text-fraco">Meus alimentos · {meus.length}</div>
            <div className="space-y-0.5">
              {meus.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-sm px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-suave">{m.nome}</span>
                  <Pilula>{m.kcal} kcal</Pilula>
                  <button onClick={() => void dados.alimentos.remover(m.id)} aria-label="Remover"
                    className="shrink-0 text-fraco transition-colors hover:text-perigo">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Folha>
  );
}
