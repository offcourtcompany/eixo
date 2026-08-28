import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Três registros de superfície, na ordem em que a referência os usa:
 *
 * `placar` (padrão) — o cartão escuro. Não tem preenchimento: ele é
 * implicado por um fio de 1px sobre a obsidiana. É onde mora dado.
 *
 * `calmo` — carbono, um degrau acima do fundo. Áreas de humor e registro do
 * dia; o sistema baixa a voz onde mora sentimento.
 *
 * `destaque` — o cartão claro pousado no preto. É o movimento-assinatura da
 * referência e só funciona enquanto for raro: **um por tela, no máximo**.
 * Espalhar isso destrói o contraste que faz ele valer.
 */
export function Cartao({
  children, className = '', tom = 'placar',
}: { children: ReactNode; className?: string; tom?: 'placar' | 'calmo' | 'destaque' }) {
  const base = {
    placar: 'rounded-xl border border-borda bg-superficie p-5 sm:p-6',
    calmo: 'rounded-xl bg-repouso p-5 sm:p-6',
    destaque: 'rounded-xl bg-osso text-fundo p-5 sm:p-6',
  }[tom];
  return <section className={`${base} ${className}`}>{children}</section>;
}

export function TituloSecao({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="titulo text-[19px]">{children}</h2>
      {acao}
    </div>
  );
}

export function Legenda({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-fraco">{children}</p>;
}

/**
 * A célula de métrica da referência: rótulo mono em maiúscula por cima,
 * número grande em peso 400 com espaçamento negativo por baixo.
 */
export function Metrica({
  rotulo, valor, detalhe, cor = 'text-creme', tamanho = 'grande',
}: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; cor?: string; tamanho?: 'grande' | 'medio' }) {
  return (
    <div>
      <div className="rotulo text-fraco">{rotulo}</div>
      <div className={`tabular mt-2 ${cor} ${tamanho === 'grande' ? 'text-[32px] leading-none' : 'text-[22px] leading-none'}`}>
        {valor}
      </div>
      {detalhe && <div className="mt-2 text-[13px] text-fraco">{detalhe}</div>}
    </div>
  );
}

type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo';

/**
 * Nenhum botão é colorido. O primário é o neutro claro, o secundário é o
 * carbono — cor cromática aqui quebraria a regra da referência, onde laranja
 * e verde são voz de dado e nunca de cromo.
 */
const ESTILO: Record<VarianteBotao, string> = {
  primario: 'bg-giz text-fundo hover:bg-osso',
  secundario: 'bg-superficie2 text-creme hover:bg-borda2',
  fantasma: 'text-suave hover:bg-superficie2 hover:text-creme',
  perigo: 'border border-perigo/40 text-perigo hover:border-perigo',
};

export function Botao({
  children, onClick, variante = 'secundario', tipo = 'button', className = '', disabled,
}: {
  children: ReactNode; onClick?: () => void; variante?: VarianteBotao;
  tipo?: 'button' | 'submit'; className?: string; disabled?: boolean;
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-3.5 py-2.5 text-sm
        transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40
        ${ESTILO[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Campo({
  rotulo, dica, children,
}: { rotulo: string; dica?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="rotulo mb-2 block text-fraco">{rotulo}</span>
      {children}
      {dica && <span className="mt-1.5 block text-[12px] leading-snug text-fraco">{dica}</span>}
    </label>
  );
}

/* Campo: carbono com traço de cinza. O foco troca a cor da borda — sem brilho,
   sem anel difuso; a referência não admite profundidade falsa. */
const BASE_ENTRADA = `w-full rounded-sm border border-borda2 bg-superficie2 px-3 py-2.5 text-creme
  placeholder:text-fraco outline-none transition-colors duration-150 focus:border-creme`;

export function Entrada(p: React.InputHTMLAttributes<HTMLInputElement>) {
  const numerico = p.type === 'number' || p.inputMode === 'decimal' || p.inputMode === 'numeric';
  return <input {...p} className={`${BASE_ENTRADA} ${numerico ? 'tabular' : ''} ${p.className || ''}`} />;
}
export function AreaTexto(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={`${BASE_ENTRADA} resize-y ${p.className || ''}`} />;
}
export function Selecao(p: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={`${BASE_ENTRADA} appearance-none ${p.className || ''}`} />;
}

/**
 * Folha que sobe de baixo. No celular ela ocupa a largura toda e nasce perto do
 * polegar; no desktop vira um diálogo centrado. Um componente, dois contextos.
 */
export function Folha({
  aberta, aoFechar, titulo, children,
}: { aberta: boolean; aoFechar: () => void; titulo: string; children: ReactNode }) {
  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [aberta, aoFechar]);

  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Véu opaco, sem desfoque: profundidade aqui é contraste. */}
      <div className="absolute inset-0 bg-black/80" onClick={aoFechar} />
      <div className="surge relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-borda2 bg-fundo sm:rounded-xl">
        <header className="flex items-center justify-between border-b border-borda2 px-5 py-4">
          <h3 className="rotulo text-suave">{titulo}</h3>
          <button onClick={aoFechar} aria-label="Fechar"
            className="rounded-sm p-1.5 text-fraco transition-colors hover:bg-superficie2 hover:text-creme">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-borda2 px-5 py-9 text-center">
      <p className="titulo text-[15px] text-suave">{titulo}</p>
      {children && <div className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-fraco">{children}</div>}
    </div>
  );
}

/** Etiqueta mono. Cor só entra aqui quando ela identifica uma categoria de dado. */
export function Pilula({ children, cor }: { children: ReactNode; cor?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-1 font-mono text-[10px] uppercase leading-none tracking-[-0.02em]"
      style={cor
        ? { background: `${cor}1f`, color: cor }
        : { background: 'var(--color-superficie2)', color: 'var(--color-suave)' }}
    >
      {children}
    </span>
  );
}

/** Barra de medida: reta, sem canto arredondado — é instrumento, não pílula. */
export function Barra({ valor, cor = 'var(--color-creme)' }: { valor: number; cor?: string }) {
  const pct = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <div className="h-1 w-full overflow-hidden bg-superficie2">
      <div className="h-full transition-[width] duration-200" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

/**
 * Aviso. O tom `info` é neutro de propósito: a referência admite dois acentos
 * cromáticos e os dois já têm dono — laranja é sinal, verde é métrica.
 */
export function Aviso({ tom = 'alerta', children }: { tom?: 'alerta' | 'info' | 'bom'; children: ReactNode }) {
  const tons = {
    alerta: 'border-perigo/40 text-perigo',
    info: 'border-borda2 bg-superficie2 text-suave',
    bom: 'border-verde/40 text-verde',
  };
  return (
    <div className={`rounded-sm border px-3.5 py-3 text-[13px] leading-relaxed ${tons[tom]}`}>{children}</div>
  );
}
