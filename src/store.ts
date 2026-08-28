/**
 * Estado do app: autenticação + coleções sincronizadas com o Firestore.
 *
 * O volume aqui é pessoal (dezenas de lançamentos por mês, um treino por dia),
 * então cada coleção é carregada inteira por onSnapshot e filtrada em memória.
 * Trocar isso por consultas paginadas seria complexidade sem ganho.
 *
 * Enquanto o Firebase não estiver configurado, o mesmo trio de ganchos é
 * atendido pelo `localdb.ts`, que grava no navegador. A escolha acontece uma vez
 * só, aqui embaixo, e é constante durante toda a sessão — nenhuma tela precisa
 * saber de qual lado veio o dado.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, type User,
} from 'firebase/auth';
import {
  onSnapshot, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';
import { auth, modoLocal } from './firebase';
import { colecaoDo, docDo, docPerfil } from './db';
import { useColecaoLocal, useDiasLocal, usePerfilLocal } from './localdb';
import type { Dia, Perfil } from './tipos';

export function useUsuario() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(Boolean(auth));
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => { setUsuario(u); setCarregando(false); });
  }, []);
  return { usuario, carregando };
}

export async function entrar(email: string, senha: string) {
  if (!auth) throw new Error('Firebase não configurado');
  await signInWithEmailAndPassword(auth, email, senha);
}
export async function criarConta(email: string, senha: string) {
  if (!auth) throw new Error('Firebase não configurado');
  await createUserWithEmailAndPassword(auth, email, senha);
}
export async function sair() { if (auth) await signOut(auth); }

type ComId = { id: string };

/**
 * Uma coleção sob usuarios/{uid}/{nome}, sempre ordenada por `campoOrdem`.
 * `salvar` aceita item novo (sem id) ou existente — é o mesmo caminho, então
 * a tela não precisa saber se está criando ou editando.
 */
function useColecaoNuvem<T extends ComId>(
  uid: string, nome: string, campoOrdem = 'criadoEm', direcao: 'asc' | 'desc' = 'desc',
) {
  const [itens, setItens] = useState<T[]>([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const q = query(colecaoDo(uid, nome), orderBy(campoOrdem, direcao));
    return onSnapshot(q, (snap) => {
      setItens(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
      setPronto(true);
    }, () => setPronto(true));
  }, [uid, nome, campoOrdem, direcao]);

  const salvar = useCallback(async (item: Partial<T> & { id?: string }) => {
    const id = item.id || doc(colecaoDo(uid, nome)).id;
    const { id: _ignorado, ...dados } = item;
    void _ignorado;
    await setDoc(docDo(uid, nome, id), dados, { merge: true });
    return id;
  }, [uid, nome]);

  const remover = useCallback(async (id: string) => {
    await deleteDoc(docDo(uid, nome, id));
  }, [uid, nome]);

  return { itens, pronto, salvar, remover };
}

/** Os dias têm id fixo (YYYY-MM-DD), então ganham um acesso próprio por chave. */
function useDiasNuvem(uid: string) {
  const { itens, salvar } = useColecaoNuvem<Dia>(uid, 'dias', 'id');
  const porData = useMemo(() => {
    const m = new Map<string, Dia>();
    for (const d of itens) m.set(d.id, d);
    return m;
  }, [itens]);
  return { dias: itens, porData, salvarDia: salvar };
}

function usePerfilNuvem(uid: string) {
  const [perfil, setPerfil] = useState<Perfil>({});
  useEffect(() => onSnapshot(docPerfil(uid), (s) => setPerfil((s.data() as Perfil) || {})), [uid]);
  const salvarPerfil = useCallback(async (dados: Partial<Perfil>) => {
    await setDoc(docPerfil(uid), { ...dados, atualizadoEm: new Date().toISOString() }, { merge: true });
  }, [uid]);
  return { perfil, salvarPerfil };
}

/**
 * A troca de motor. `modoLocal` é constante durante a sessão inteira, então a
 * ordem dos ganchos nunca muda entre renders — a regra dos hooks continua de pé.
 */
export const useColecao = modoLocal ? useColecaoLocal : useColecaoNuvem;
export const useDias = modoLocal ? useDiasLocal : useDiasNuvem;
export const usePerfil = modoLocal ? usePerfilLocal : usePerfilNuvem;
