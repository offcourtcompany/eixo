/**
 * Conexão com o Firebase.
 *
 * Os valores abaixo NÃO são segredo — a config web do Firebase é pública por
 * design. Quem protege os dados são as regras do Firestore (firestore.rules),
 * que só liberam o documento de quem está logado. Por isso ficam no código, e
 * não em variável de ambiente: assim o deploy na Vercel não depende de painel.
 *
 * Como preencher: Console do Firebase > Configurações do projeto > Seus apps >
 * app da Web > "Configuração do SDK". Cole os valores aqui. O passo a passo
 * completo está no README.md.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyCRnclXbK45STiwy14T7RKkKv_A3YYuAN0',
  authDomain: 'kkkk-b6cfb.firebaseapp.com',
  projectId: 'kkkk-b6cfb',
  storageBucket: 'kkkk-b6cfb.firebasestorage.app',
  messagingSenderId: '969497020555',
  appId: '1:969497020555:web:440f0869f7d3f0b95a6c8e',
};

/** Ainda com os valores de exemplo? A tela de configuração assume o comando. */
export const precisaConfigurar = firebaseConfig.apiKey.startsWith('COLE_AQUI');

export const app = precisaConfigurar ? null : initializeApp(firebaseConfig);
export const auth = app ? getAuth(app) : null;

/**
 * Sem config, o app não trava: entra em modo local e salva no próprio navegador
 * (ver localdb.ts). Registrar hoje vale mais do que esperar a nuvem — e o par
 * exportar/restaurar de Ajustes leva os dados para a conta quando ela existir.
 */
export const modoLocal = precisaConfigurar;
