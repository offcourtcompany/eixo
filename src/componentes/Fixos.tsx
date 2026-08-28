/**
 * Os compromissos que se repetem todo mês.
 *
 * Cadastrados uma vez, entram sozinhos (ver logica/recorrentes.ts) marcados
 * como "a confirmar" — porque o valor real quase nunca bate na vírgula, e
 * confirmar é onde você corrige. Isso não importa nada de fora: só para de
 * pedir de novo o que você já disse uma vez.
 */
import { useState } from 'react';
import { Plus, Trash2, Repeat, Check } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Recorrente } from '../tipos';
import { moeda, moedaCurta } from '../formato';
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../logica/financas';
import { aConfirmarNoMes } from '../logica/recorrentes';
import { FIXOS_SUGERIDOS } from '../dados/sementes';
import {
  Cartao, TituloSecao, Metrica, Botao, Campo, Entrada, Selecao,
  Folha, Vazio, Aviso, Legenda,
} from './ui';

export function BlocoFixos({ dados }: { dados: DadosApp }) {
  const fixos = [...dados.recorrentes.itens].sort((a, b) => a.nome.localeCompare(b.nome));
  const ativos = fixos.filter((f) => f.ativo);
  const pausados = fixos.filter((f) => !f.ativo);
  const [aberta, setAberta] = useState(false);
  const [editando, setEditando] = useState<Recorrente | null>(null);

  const saem = ativos.filter((f) => f.tipo === 'saida').reduce((s, f) => s + f.valor, 0);
  const entram = ativos.filter((f) => f.tipo === 'entrada').reduce((s, f) => s + f.valor, 0);

  function abrir(f: Recorrente | null) { setEditando(f); setAberta(true); }

  async function semear() {
    const agora = new Date().toISOString();
    for (const f of FIXOS_SUGERIDOS) await dados.recorrentes.salvar({ ...f, criadoEm: agora });
  }

  return (
    <Cartao>
      <TituloSecao acao={
        <Botao variante="fantasma" onClick={() => abrir(null)}><Plus size={15} />Fixo</Botao>
      }>Fixos do mês</TituloSecao>

      {!ativos.length ? (
        <div className="space-y-3">
          <Vazio titulo="Nenhum fixo cadastrado">
            Cadastre uma vez cada compromisso que se repete — seguro, consórcio, filha, o fixo da
            arena — e ele passa a entrar sozinho todo mês, esperando um toque de confirmação.
            São umas oito digitações a menos por mês, e o custo fixo para de ficar incompleto.
          </Vazio>
          <Botao variante="secundario" className="w-full" onClick={() => void semear()}>
            Começar com os quatro que eu já conheço
          </Botao>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Metrica rotulo="Entra fixo" valor={moedaCurta(entram)} cor="text-verde" tamanho="medio" />
            <Metrica rotulo="Sai fixo" valor={moedaCurta(saem)} tamanho="medio" />
            {/* O que sobra a descoberto depois do que já entra fixo. Quando a receita
                fixa cobre tudo, o número vira zero e o rótulo diz isso — número negativo
                aqui só faria você calcular de cabeça o que o app já sabe. */}
            <Metrica rotulo="A descoberto" tamanho="medio"
              valor={saem > entram ? moedaCurta(saem - entram) : 'coberto'}
              cor={saem > entram ? 'text-ouro' : 'text-verde'}
              detalhe={saem > entram ? 'todo mês, antes do variável' : 'a receita fixa já cobre o fixo'} />
          </div>

          <div className="mt-4 space-y-1">
            {ativos.map((f) => (
              <button key={f.id} onClick={() => abrir(f)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-superficie2">
                <Repeat size={14} className="shrink-0 text-fraco" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{f.nome}</span>
                  <span className="block truncate text-[11px] text-fraco">
                    todo dia {f.diaDoMes} · {f.categoria}
                  </span>
                </span>
                <span className={'tabular shrink-0 text-sm ' + (f.tipo === 'entrada' ? 'text-verde' : 'text-creme')}>
                  {f.tipo === 'entrada' ? '+' : '−'}{moeda(f.valor)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {pausados.length > 0 && (
        <div className="mt-4 border-t border-borda2 pt-3">
          <Legenda>Pausados: {pausados.map((f) => f.nome).join(', ')}.</Legenda>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pausados.map((f) => (
              <button key={f.id} onClick={() => abrir(f)}
                className="rounded px-2 py-1 text-[11px] text-suave hover:bg-superficie2 hover:text-creme">
                reativar {f.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <FormularioRecorrente aberta={aberta} aoFechar={() => setAberta(false)}
        recorrente={editando} dados={dados} />
    </Cartao>
  );
}

function FormularioRecorrente({
  aberta, aoFechar, recorrente, dados,
}: { aberta: boolean; aoFechar: () => void; recorrente: Recorrente | null; dados: DadosApp }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dia, setDia] = useState('5');
  const [origem, setOrigem] = useState<'fixa' | 'recorrente' | 'avulsa'>('fixa');
  const [chave, setChave] = useState('');

  const idAtual = recorrente?.id || 'novo';
  if (aberta && chave !== idAtual) {
    setChave(idAtual);
    setNome(recorrente?.nome || '');
    setTipo(recorrente?.tipo || 'saida');
    setValor(recorrente ? String(recorrente.valor) : '');
    setCategoria(recorrente?.categoria || '');
    setDia(String(recorrente?.diaDoMes ?? 5));
    setOrigem(recorrente?.origem || 'fixa');
  }
  if (!aberta && chave) setChave('');

  const categorias = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  async function gravar() {
    const base = {
      id: recorrente?.id,
      nome: nome.trim() || categoria || 'Fixo',
      tipo,
      valor: Math.abs(Number(valor) || 0),
      categoria: categoria || categorias[0],
      diaDoMes: Math.min(31, Math.max(1, Number(dia) || 1)),
      ativo: true,
      criadoEm: recorrente?.criadoEm || new Date().toISOString(),
    };
    await dados.recorrentes.salvar(
      tipo === 'entrada'
        ? { ...base, origem, fixo: false }
        : { ...base, fixo: true, origem: 'avulsa' as const },
    );
    aoFechar();
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={recorrente ? 'Editar fixo' : 'Novo fixo'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-superficie2 p-1">
          {(['saida', 'entrada'] as const).map((t) => (
            <button key={t} onClick={() => setTipo(t)}
              className={'rounded py-2 text-sm font-medium transition '
                + (tipo === t ? 'bg-creme text-fundo' : 'text-suave')}>
              {t === 'entrada' ? 'Entra todo mês' : 'Sai todo mês'}
            </button>
          ))}
        </div>

        <Campo rotulo="Nome">
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seguro de vida" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor de sempre" dica="O valor típico. Você ajusta no mês em que ele mudar.">
            <Entrada type="number" inputMode="decimal" step="0.01" value={valor}
              onChange={(e) => setValor(e.target.value)} placeholder="520" />
          </Campo>
          <Campo rotulo="Dia do mês" dica="Em fevereiro, dia 31 cai no último dia.">
            <Entrada type="number" inputMode="numeric" min="1" max="31" value={dia}
              onChange={(e) => setDia(e.target.value)} />
          </Campo>
        </div>

        <Campo rotulo="Categoria">
          <Selecao value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Escolher…</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </Selecao>
        </Campo>

        {tipo === 'entrada' && (
          <Campo rotulo="De onde vem" dica="Fixa e recorrente contam como receita previsível.">
            <div className="grid grid-cols-3 gap-2">
              {([['fixa', 'Fixa'], ['recorrente', 'Recorrente'], ['avulsa', 'Avulsa']] as const).map(([id, n]) => (
                <button key={id} onClick={() => setOrigem(id)}
                  className={'rounded-lg border px-2 py-2 text-[12px] font-medium transition '
                    + (origem === id ? 'border-verde text-verde' : 'border-borda bg-superficie2 text-suave')}>
                  {n}
                </button>
              ))}
            </div>
          </Campo>
        )}

        <Aviso tom="info">
          A partir do próximo carregamento este lançamento aparece sozinho todo mês, marcado para
          você confirmar. Apagar o lançamento de um mês específico não faz ele voltar.
        </Aviso>

        <div className="flex gap-2 pt-1">
          <Botao variante="primario" onClick={() => void gravar()} className="flex-1"
            disabled={!Number(valor)}>Salvar</Botao>
          {recorrente && (
            <>
              <Botao variante="secundario"
                onClick={() => { void dados.recorrentes.salvar({ id: recorrente.id, ativo: false }); aoFechar(); }}>
                Pausar
              </Botao>
              <Botao variante="perigo"
                onClick={() => { void dados.recorrentes.remover(recorrente.id); aoFechar(); }}>
                <Trash2 size={15} />
              </Botao>
            </>
          )}
        </div>
      </div>
    </Folha>
  );
}

/** Faixa de confirmação dos fixos que entraram sozinhos no mês em tela. */
export function AConfirmar({ dados, mes }: { dados: DadosApp; mes: string }) {
  const pendentes = aConfirmarNoMes(dados.lancamentos.itens, mes);
  if (!pendentes.length) return null;

  const total = pendentes.reduce((s, l) => s + (l.tipo === 'saida' ? l.valor : -l.valor), 0);

  async function confirmarTodos() {
    for (const l of pendentes) await dados.lancamentos.salvar({ id: l.id, aConfirmar: false });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-ouro/40 px-3.5 py-3">
      <Repeat size={15} className="shrink-0 text-ouro" />
      <span className="min-w-[12rem] flex-1 text-[13px] leading-relaxed text-ouro">
        <b>{pendentes.length} fixo(s) entraram sozinhos</b> neste mês, somando{' '}
        <span className="tabular">{moeda(Math.abs(total))}</span>. Confira os valores e confirme —
        ou toque em cada um para corrigir.
      </span>
      <Botao variante="secundario" onClick={() => void confirmarTodos()}>
        <Check size={15} />Confirmar todos
      </Botao>
    </div>
  );
}
