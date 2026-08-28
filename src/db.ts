/**
 * Firestore com cache local persistente.
 *
 * O cache persistente é o que faz o app funcionar dentro da academia e no
 * restaurante, onde o sinal cai: a escrita entra na fila local e sobe sozinha
 * quando a conexão volta. Sem isso o registro morre na primeira falha de rede —
 * e um registro que falha é um hábito que não se forma.
 *
 * O Firestore mora num arquivo separado do firebase.ts de propósito: a tela de
 * login não precisa baixar o SDK do banco junto.
 */
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  collection,
  doc,
  type Firestore,
} from 'firebase/firestore';
import { app } from './firebase';

let instancia: Firestore | null = null;

export function bd(): Firestore {
  if (!app) throw new Error('Firebase não configurado — veja o README.');
  if (!instancia) {
    instancia = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
    });
  }
  return instancia;
}

/** Tudo do usuário vive sob usuarios/{uid} — as regras só liberam o próprio uid. */
export const colecaoDo = (uid: string, nome: string) =>
  collection(bd(), 'usuarios', uid, nome);

export const docDo = (uid: string, nome: string, id: string) =>
  doc(bd(), 'usuarios', uid, nome, id);

export const docPerfil = (uid: string) => doc(bd(), 'usuarios', uid);
