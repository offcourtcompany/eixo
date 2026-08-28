import { Suspense, lazy, useState } from 'react';
import { modoLocal } from './firebase';
import { useUsuario, entrar, criarConta } from './store';
import { Botao, Campo, Entrada, Aviso } from './componentes/ui';

// O app logado (e o SDK do Firestore junto) só desce depois do login.
const AppAutenticado = lazy(() => import('./AppAutenticado'));

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-[26px] uppercase tracking-[0.32em] text-creme">EIXO</h1>
          <p className="rotulo mt-3 text-fraco">Finanças · Corpo · Mente · Ofício</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function TelaEntrada() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setOcupado(true);
    try {
      if (criando) await criarConta(email, senha);
      else await entrar(email, senha);
    } catch (ex) {
      const codigo = (ex as { code?: string }).code || '';
      setErro(
        codigo.includes('invalid-credential') || codigo.includes('wrong-password')
          ? 'E-mail ou senha não conferem.'
          : codigo.includes('email-already-in-use') ? 'Esse e-mail já tem conta — entre em vez de criar.'
          : codigo.includes('weak-password') ? 'A senha precisa de pelo menos 6 caracteres.'
          : codigo.includes('network') ? 'Sem conexão com o servidor.'
          : 'Não consegui entrar. Tente de novo.',
      );
    } finally { setOcupado(false); }
  }

  return (
    <Moldura>
      <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-borda bg-superficie p-5">
        <Campo rotulo="E-mail">
          <Entrada type="email" value={email} autoComplete="email" required
            onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Campo>
        <Campo rotulo="Senha">
          <Entrada type="password" value={senha} required minLength={6}
            autoComplete={criando ? 'new-password' : 'current-password'}
            onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" />
        </Campo>
        {erro && <Aviso>{erro}</Aviso>}
        <Botao tipo="submit" variante="primario" className="w-full" disabled={ocupado}>
          {ocupado ? 'Um instante…' : criando ? 'Criar conta' : 'Entrar'}
        </Botao>
        <button type="button" onClick={() => { setCriando(!criando); setErro(''); }}
          className="w-full text-center text-[13px] text-suave hover:text-creme">
          {criando ? 'Já tenho conta — entrar' : 'Primeira vez aqui? Criar conta'}
        </button>
      </form>
      <p className="mt-4 text-center text-[12px] leading-relaxed text-fraco">
        Seus dados ficam só na sua conta. Nada é importado de banco nenhum — tudo aqui você digita.
      </p>
    </Moldura>
  );
}

export default function App() {
  const { usuario, carregando } = useUsuario();

  // Sem Firebase configurado o app não pede login: ele guarda no navegador.
  // O passo a passo para ligar a nuvem mora em Ajustes, sem barrar o uso.
  if (modoLocal) return <Carregado uid="local" email="" />;
  if (carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="font-mono text-[13px] uppercase tracking-[0.22em] text-fraco">EIXO</div>
      </div>
    );
  }
  if (!usuario) return <TelaEntrada />;

  return <Carregado uid={usuario.uid} email={usuario.email || ''} />;
}

function Carregado({ uid, email }: { uid: string; email: string }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-dvh items-center justify-center text-sm text-fraco">Carregando…</div>
    }>
      <AppAutenticado uid={uid} email={email} />
    </Suspense>
  );
}
