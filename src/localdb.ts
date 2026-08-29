/**
 * Armazenamento local — o EIXO funcionando antes do Firebase existir.
 *
 * Enquanto não há projeto na nuvem, os dados moram no `localStorage` deste
 * navegador. A API é idêntica à do Firestore (`itens`, `pronto`, `salvar`,
 * `remover`), então nenhuma tela sabe em qual modo está rodando — no dia em que
 * a config for colada em firebase.ts, o app troca de motor sem que uma linha de
 * tela mude.
 *
 * O que isso NÃO é: um banco. Vale entender os três limites antes de confiar.
 *
 * 1. **Fica só aqui.** Outro navegador, outro computador e o celular não veem
 *    nada. Limpar dados do site apaga tudo, sem lixeira.
 * 2. **Sem histórico.** Não há versão anterior para restaurar — por isso a tela
 *    de Ajustes insiste no JSON, que é a única cópia de segurança que existe.
 * 3. **Cabe uns 5 MB.** Anos de registro pessoal cabem folgado, mas se um dia
 *    estourar, a gravação falha e o console avisa em vez de fingir que salvou.
 *
 * A saída daqui é o par exportar/restaurar de Ajustes: baixa o JSON no modo
 * local, entra na conta do Firebase, restaura. Os ids são preservados, então
 * restaurar duas vezes não duplica nada.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dia, Perfil } from './tipos';

type ComId = { id: string };

const PREFIXO = 'eixo/v1/';

/** Cache em memória: evita reserializar a lista inteira a cada render. */
const memoria = new Map<string, unknown>();
const ouvintes = new Map<string, Set<() => void>>();

function ler<T>(chave: string, vazio: T): T {
  if (memoria.has(chave)) return memoria.get(chave) as T;
  let valor = vazio;
  try {
    const cru = localStorage.getItem(PREFIXO + chave);
    if (cru) valor = JSON.parse(cru) as T;
  } catch {
    // Navegador em modo restrito, ou JSON corrompido. Segue com o vazio: melhor
    // uma tela em branco que uma tela quebrada.
  }
  memoria.set(chave, valor);
  return valor;
}

function gravar<T>(chave: string, valor: T) {
  memoria.set(chave, valor);
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch (e) {
    // Cota estourada ou storage bloqueado. Em memória o dado continua vivo até
    // fechar a aba, então dá tempo de exportar o JSON.
    console.error('EIXO: não consegui gravar em disco —', chave, e);
  }
  ouvintes.get(chave)?.forEach((f) => f());
}

function inscrever(chave: string, aoMudar: () => void) {
  const grupo = ouvintes.get(chave) ?? new Set<() => void>();
  ouvintes.set(chave, grupo);
  grupo.add(aoMudar);
  return () => { grupo.delete(aoMudar); };
}

// Duas abas abertas no mesmo navegador continuam falando a mesma língua.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key?.startsWith(PREFIXO)) return;
    const chave = e.key.slice(PREFIXO.length);
    memoria.delete(chave);
    ouvintes.get(chave)?.forEach((f) => f());
  });
}

const novoId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/-/g, '').slice(0, 20);

/** Mesma ordem do `orderBy` do Firestore; sem campo vai para o fim. */
function ordenar<T extends ComId>(itens: T[], campo: string, direcao: 'asc' | 'desc') {
  return [...itens].sort((a, b) => {
    const x = (a as Record<string, unknown>)[campo] as string | number | undefined;
    const y = (b as Record<string, unknown>)[campo] as string | number | undefined;
    if (x === y) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x > y ? -1 : 1) * (direcao === 'asc' ? -1 : 1);
  });
}

export function useColecaoLocal<T extends ComId>(
  _uid: string, nome: string, campoOrdem = 'criadoEm', direcao: 'asc' | 'desc' = 'desc',
) {
  const [versao, setVersao] = useState(0);
  useEffect(() => inscrever(nome, () => setVersao((v) => v + 1)), [nome]);

  // `versao` é a chave de invalidação: ler() consulta estado mutável de módulo,
  // que o linter não tem como enxergar.
  const itens = useMemo(
    () => ordenar(ler<T[]>(nome, []), campoOrdem, direcao),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nome, campoOrdem, direcao, versao],
  );

  /** Aceita item novo (sem id) ou remendo de um existente — igual ao setDoc com merge. */
  const salvar = useCallback(async (item: Partial<T> & { id?: string }) => {
    const lista = ler<T[]>(nome, []);
    const id = item.id || novoId();
    const posicao = lista.findIndex((x) => x.id === id);
    const atualizado = { ...(posicao >= 0 ? lista[posicao] : {}), ...item, id } as T;
    gravar(nome, posicao >= 0
      ? lista.map((x, i) => (i === posicao ? atualizado : x))
      : [...lista, atualizado]);
    return id;
  }, [nome]);

  const remover = useCallback(async (id: string) => {
    gravar(nome, ler<T[]>(nome, []).filter((x) => x.id !== id));
  }, [nome]);

  return { itens, pronto: true, salvar, remover };
}

export function useDiasLocal(uid: string) {
  const { itens, salvar } = useColecaoLocal<Dia>(uid, 'dias', 'id');
  const porData = useMemo(() => {
    const m = new Map<string, Dia>();
    for (const d of itens) m.set(d.id, d);
    return m;
  }, [itens]);
  return { dias: itens, porData, salvarDia: salvar };
}

export function usePerfilLocal(_uid: string) {
  const [versao, setVersao] = useState(0);
  useEffect(() => inscrever('perfil', () => setVersao((v) => v + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mesma razão do acima.
  const perfil = useMemo(() => ler<Perfil>('perfil', {}), [versao]);

  const salvarPerfil = useCallback(async (dados: Partial<Perfil>) => {
    gravar('perfil', { ...ler<Perfil>('perfil', {}), ...dados, atualizadoEm: new Date().toISOString() });
  }, []);

  return { perfil, salvarPerfil };
}

/** Apaga tudo que o modo local guardou. Só a tela de Ajustes chama, com aviso. */
export function apagarTudoLocal() {
  for (const chave of Object.keys(localStorage)) {
    if (chave.startsWith(PREFIXO)) localStorage.removeItem(chave);
  }
  memoria.clear();
  for (const grupo of ouvintes.values()) grupo.forEach((f) => f());
}
