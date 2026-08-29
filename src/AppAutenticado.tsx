import { useEffect, useRef, useState } from 'react';
import {
  Sun, Wallet, CalendarDays, CircleCheck, Dumbbell, Target, Settings, LogOut, Apple, GraduationCap,
  Stethoscope,
} from 'lucide-react';
import { modoLocal } from './firebase';
import { useDadosApp } from './dadosApp';
import { sair } from './store';
import { gerar } from './logica/recorrentes';
import Hoje from './telas/Hoje';
import Agenda from './telas/Agenda';
import Nutricao from './telas/Nutricao';
import EstudoTela from './telas/Estudo';
import Consultor from './telas/Consultor';
import Financeiro from './telas/Financeiro';
import Habitos from './telas/Habitos';
import Treino from './telas/Treino';
import Metas from './telas/Metas';
import Ajustes from './telas/Ajustes';
import Briefing from './telas/Briefing';

const ABAS = [
  { id: 'hoje', nome: 'Hoje', icone: Sun },
  { id: 'agenda', nome: 'Agenda', icone: CalendarDays },
  { id: 'dinheiro', nome: 'Finanças', icone: Wallet },
  { id: 'habitos', nome: 'Hábitos', icone: CircleCheck },
  { id: 'nutricao', nome: 'Comida', icone: Apple },
  { id: 'treino', nome: 'Treino', icone: Dumbbell },
  { id: 'metas', nome: 'Metas', icone: Target },
  { id: 'estudo', nome: 'Estudo', icone: GraduationCap },
] as const;

type Aba = typeof ABAS[number]['id'] | 'ajustes' | 'briefing' | 'consultor';

export default function AppAutenticado({ uid, email }: { uid: string; email: string }) {
  const dados = useDadosApp(uid);
  const [aba, setAba] = useState<Aba>('hoje');

  // Os fixos do mês entram sozinhos, uma vez por carregamento — e só depois que
  // as duas coleções chegaram, porque antes disso não dá para saber o que já
  // existe. A geração é idempotente e guarda um marcador em cada fixo, então
  // lançamento que você apagou não volta no próximo refresh.
  const jaGerou = useRef(false);
  useEffect(() => {
    if (jaGerou.current || !dados.recorrentes.pronto || !dados.lancamentos.pronto) return;
    jaGerou.current = true;
    const { lancamentos, marcadores } = gerar(dados.recorrentes.itens);
    if (!lancamentos.length) return;
    void (async () => {
      for (const l of lancamentos) await dados.lancamentos.salvar(l);
      for (const m of marcadores) await dados.recorrentes.salvar(m);
    })();
  }, [dados]);

  const tela = {
    hoje: <Hoje dados={dados} irPara={setAba} />,
    agenda: <Agenda dados={dados} />,
    nutricao: <Nutricao dados={dados} />,
    dinheiro: <Financeiro dados={dados} />,
    habitos: <Habitos dados={dados} />,
    treino: <Treino dados={dados} />,
    metas: <Metas dados={dados} />,
    estudo: <EstudoTela dados={dados} />,
    ajustes: <Ajustes dados={dados} email={email} />,
    briefing: <Briefing dados={dados} />,
    consultor: <Consultor dados={dados} irPara={setAba} />,
  }[aba];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-borda2 bg-fundo">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button onClick={() => setAba('hoje')}
              className="font-mono text-[13px] uppercase tracking-[0.22em] text-creme">
              EIXO
            </button>
            {/* Estado do dado, dito uma vez e sem alarde: no modo local nada sai
                deste navegador. Leva para Ajustes, onde está o backup e o caminho
                para ligar a nuvem. */}
            {modoLocal && (
              <button onClick={() => setAba('ajustes')} title="Os dados estão só neste navegador"
                className="rotulo ml-3 rounded border border-borda px-1.5 py-1 text-fraco transition hover:border-borda2 hover:text-suave">
                local
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setAba('consultor')} title="Consultor"
              className={`rounded-lg p-2 transition hover:bg-superficie2 ${aba === 'consultor' || aba === 'briefing' ? 'text-brasa' : 'text-suave hover:text-creme'}`}>
              <Stethoscope size={18} />
            </button>
            <button onClick={() => setAba('ajustes')} title="Ajustes"
              className={`rounded-lg p-2 transition hover:bg-superficie2 ${aba === 'ajustes' ? 'text-brasa' : 'text-suave hover:text-creme'}`}>
              <Settings size={18} />
            </button>
            {!modoLocal && (
              <button onClick={() => void sair()} title="Sair"
                className="rounded-lg p-2 text-suave transition hover:bg-superficie2 hover:text-creme">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Barra de navegação: lateral no desktop, colada no polegar no celular. */}
      <div className="mx-auto flex max-w-3xl gap-6 px-4">
        <nav className="hidden w-40 shrink-0 pt-6 sm:block">
          <div className="sticky top-20 space-y-1">
            {ABAS.map(({ id, nome, icone: Icone }) => (
              <button key={id} onClick={() => setAba(id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition
                  ${aba === id ? 'bg-superficie2 font-medium text-creme' : 'text-suave hover:bg-superficie hover:text-creme'}`}>
                <Icone size={17} />{nome}
              </button>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1 pb-28 pt-5 sm:pb-12">{tela}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-borda2 bg-fundo sm:hidden">
        <div className="flex pb-[env(safe-area-inset-bottom)]">
          {ABAS.map(({ id, nome, icone: Icone }) => (
            <button key={id} onClick={() => setAba(id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] font-medium transition
                ${aba === id ? 'text-brasa' : 'text-fraco'}`}>
              <Icone size={19} strokeWidth={aba === id ? 2.4 : 1.8} />
              <span className="max-w-full truncate">{nome}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
