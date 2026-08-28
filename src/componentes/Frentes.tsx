/**
 * O seletor de frente, compartilhado.
 *
 * Mora aqui porque é usado nos dois lados da mesma conta: na Agenda, para dizer
 * de quem é o compromisso; em Finanças, para dizer de quem é o dinheiro. É essa
 * repetição da mesma etiqueta que permite cruzar tempo com margem depois.
 */
import type { Frente } from '../tipos';
import { Campo } from './ui';

export function EscolhaDeFrente({
  frentes, valor, aoMudar, rotulo = 'Frente', dica,
}: {
  frentes: Frente[];
  valor?: string;
  aoMudar: (id?: string) => void;
  rotulo?: string;
  dica?: string;
}) {
  if (!frentes.length) return null;
  return (
    <Campo rotulo={rotulo} dica={dica}>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => aoMudar(undefined)}
          className={'rounded-sm border px-2.5 py-1.5 text-[12px] transition-colors '
            + (!valor ? 'border-creme text-creme' : 'border-borda2 text-fraco hover:text-suave')}>
          nenhuma
        </button>
        {frentes.map((f) => (
          <button key={f.id} onClick={() => aoMudar(f.id)}
            className={'flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12px] transition-colors '
              + (valor === f.id ? 'text-creme' : 'border-borda2 text-fraco hover:text-suave')}
            style={valor === f.id ? { borderColor: f.cor } : undefined}>
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: f.cor }} />{f.nome}
          </button>
        ))}
      </div>
    </Campo>
  );
}
