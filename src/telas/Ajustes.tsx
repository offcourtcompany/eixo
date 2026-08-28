import { useRef, useState } from 'react';
import { Download, Upload, HardDrive, Cloud, Trash2 } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type {
  Perfil, Lancamento, Recorrente, Divida, AcaoEstrutural, Habito, Meta, Treino, Dia,
} from '../tipos';
import { hoje } from '../formato';
import { modoLocal } from '../firebase';
import { apagarTudoLocal } from '../localdb';
import { Cartao, TituloSecao, Botao, Campo, Entrada, Legenda, Aviso } from '../componentes/ui';

/** O formato do arquivo de exportação — e, do outro lado, o da restauração. */
interface Pacote {
  exportadoEm?: string;
  perfil?: Partial<Perfil>;
  lancamentos?: Lancamento[];
  recorrentes?: Recorrente[];
  dividas?: Divida[];
  acoes?: AcaoEstrutural[];
  habitos?: Habito[];
  metas?: Meta[];
  treinos?: Treino[];
  dias?: Dia[];
}

export default function Ajustes({ dados, email, previa }: { dados: DadosApp; email: string; previa?: boolean }) {
  const p = dados.perfil;
  const [salvo, setSalvo] = useState(false);

  async function gravar(campo: string, valor: string) {
    await dados.salvarPerfil({ [campo]: campo === 'nome' ? valor : Number(valor) || 0 });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <div className="space-y-6">
      <Cartao>
        <TituloSecao>Seus números de referência</TituloSecao>
        <Legenda>
          Estes valores alimentam os cálculos das outras telas — principalmente a linha de piso fixo
          no gráfico do mês e a comparação com a receita previsível.
        </Legenda>

        <div className="mt-4 space-y-4">
          <Campo rotulo="Nome">
            <Entrada defaultValue={p.nome || ''} onBlur={(e) => void gravar('nome', e.target.value)}
              placeholder="Como você quer ser chamado" />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Custo fixo mensal (R$)"
              dica="Tudo que sai todo mês com ou sem evento.">
              <Entrada type="number" inputMode="decimal" defaultValue={p.custoFixoMensal ?? ''}
                onBlur={(e) => void gravar('custoFixoMensal', e.target.value)} placeholder="0" />
            </Campo>
            <Campo rotulo="Renda fixa (R$)" dica="A parte que entra sem depender de evento.">
              <Entrada type="number" inputMode="decimal" defaultValue={p.rendaFixa ?? ''}
                onBlur={(e) => void gravar('rendaFixa', e.target.value)} placeholder="0" />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Peso alvo (kg)">
              <Entrada type="number" inputMode="decimal" step="0.1" defaultValue={p.pesoAlvo ?? ''}
                onBlur={(e) => void gravar('pesoAlvo', e.target.value)} placeholder="88" />
            </Campo>
            <Campo rotulo="Reserva alvo (meses)"
              dica="Quantos meses de custo fixo você quer ter guardado.">
              <Entrada type="number" inputMode="numeric" defaultValue={p.reservaAlvoMeses ?? ''}
                onBlur={(e) => void gravar('reservaAlvoMeses', e.target.value)} placeholder="3" />
            </Campo>
          </div>

          {salvo && <Aviso tom="bom">Salvo.</Aviso>}
        </div>
      </Cartao>

      <SeusDados dados={dados} email={email} previa={previa} />
      {modoLocal && <LigarSincronizacao />}

      <Cartao>
        <TituloSecao>O que ainda vem</TituloSecao>
        <Legenda>
          Este é o primeiro lote: Finanças, Hábitos/Metas e Treino. Os próximos são Nutrição, Agenda e
          Estudo; depois Consultor, Psicólogo e Oportunidades. Cada lote entra completo, não pela metade —
          módulo inacabado é o jeito mais rápido de abandonar o sistema inteiro.
        </Legenda>
      </Cartao>
    </div>
  );
}

/**
 * Backup e restauração.
 *
 * No modo local este cartão é a peça mais importante do app: o JSON é a única
 * cópia que existe. E é também a ponte — baixar aqui, entrar na conta do
 * Firebase, restaurar lá. Como os ids são preservados, restaurar duas vezes
 * escreve por cima em vez de duplicar.
 */
function SeusDados({ dados, email, previa }: { dados: DadosApp; email: string; previa?: boolean }) {
  const arquivo = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<{ tom: 'bom' | 'alerta'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);

  function exportar() {
    const pacote: Pacote = {
      exportadoEm: new Date().toISOString(),
      perfil: dados.perfil,
      lancamentos: dados.lancamentos.itens,
      recorrentes: dados.recorrentes.itens,
      dividas: dados.dividas.itens,
      acoes: dados.acoes.itens,
      habitos: dados.habitos.itens,
      metas: dados.metas.itens,
      treinos: dados.treinos.itens,
      dias: dados.dias,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(pacote, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eixo-' + hoje() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restaurar(f: File) {
    setOcupado(true);
    setAviso(null);
    try {
      const pacote = JSON.parse(await f.text()) as Pacote;
      let n = 0;
      // Explícito de propósito: cada coleção tem seu tipo, e escrever o laço à
      // mão é o que garante que um campo novo não entre sem tipo amanhã.
      for (const x of pacote.lancamentos ?? []) { await dados.lancamentos.salvar(x); n++; }
      for (const x of pacote.recorrentes ?? []) { await dados.recorrentes.salvar(x); n++; }
      for (const x of pacote.dividas ?? []) { await dados.dividas.salvar(x); n++; }
      for (const x of pacote.acoes ?? []) { await dados.acoes.salvar(x); n++; }
      for (const x of pacote.habitos ?? []) { await dados.habitos.salvar(x); n++; }
      for (const x of pacote.metas ?? []) { await dados.metas.salvar(x); n++; }
      for (const x of pacote.treinos ?? []) { await dados.treinos.salvar(x); n++; }
      for (const x of pacote.dias ?? []) { await dados.salvarDia(x); n++; }
      if (pacote.perfil) await dados.salvarPerfil(pacote.perfil);
      setAviso({ tom: 'bom', texto: `${n} registro(s) restaurados. Nada foi duplicado — o que já existia foi atualizado.` });
    } catch {
      setAviso({ tom: 'alerta', texto: 'Não consegui ler esse arquivo. Ele precisa ser um JSON exportado aqui mesmo.' });
    } finally {
      setOcupado(false);
      if (arquivo.current) arquivo.current.value = '';
    }
  }

  return (
    <Cartao>
      <TituloSecao>Seus dados</TituloSecao>

      {modoLocal ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 text-[13px] leading-relaxed text-suave">
            <HardDrive size={15} className="mt-0.5 shrink-0 text-fraco" />
            <p>
              Tudo o que você registra fica <span className="text-creme">só neste navegador</span>.
              Não passa por servidor nenhum, funciona sem internet, e não aparece no celular nem em
              outro computador. Limpar os dados do site apaga tudo, e não há lixeira.
            </p>
          </div>
          <Aviso tom="info">
            Enquanto estiver assim, baixe o JSON de vez em quando — uma vez por semana já resolve.
            É a sua única cópia de segurança.
          </Aviso>
        </div>
      ) : (
        <Legenda>
          Tudo fica sob a sua conta ({email}) e só você tem acesso — as regras do banco não liberam o
          documento de um usuário para nenhum outro. O app funciona sem sinal: o que você registra fica
          na fila do aparelho e sobe quando a conexão volta.
        </Legenda>
      )}

      {/* Na bancada de prévia os dados são falsos, mas o apagar mexeria nos de
          verdade — então o bloco inteiro sai de cena em vez de ficar armado. */}
      {previa ? (
        <div className="mt-4 rounded-lg border border-dashed border-borda px-4 py-3">
          <Legenda>Baixar, restaurar e apagar ficam de fora da prévia: aqui os dados são de mentira.</Legenda>
        </div>
      ) : (
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Botao variante="secundario" onClick={exportar}>
          <Download size={16} />Baixar tudo em JSON
        </Botao>
        <Botao variante="secundario" disabled={ocupado} onClick={() => arquivo.current?.click()}>
          <Upload size={16} />{ocupado ? 'Restaurando…' : 'Restaurar de um JSON'}
        </Botao>
        <input ref={arquivo} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void restaurar(f); }} />
      </div>
      )}

      {aviso && <div className="mt-3"><Aviso tom={aviso.tom}>{aviso.texto}</Aviso></div>}

      <div className="mt-3">
        <Legenda>
          O arquivo traz lançamentos, fixos, dívidas, hábitos, dias, treinos e metas. Serve de cópia de
          segurança, de mudança para a nuvem e também para levar os dados embora se um dia você quiser
          outro sistema.
        </Legenda>
      </div>

      {modoLocal && !previa && (
        <div className="mt-4 border-t border-borda2 pt-3">
          {confirmandoLimpeza ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex-1 text-[13px] text-perigo">
                Isso apaga tudo deste navegador, sem volta. Baixou o JSON antes?
              </span>
              <Botao variante="fantasma" onClick={() => setConfirmandoLimpeza(false)}>Cancelar</Botao>
              <Botao variante="perigo" onClick={() => { apagarTudoLocal(); setConfirmandoLimpeza(false); }}>
                Apagar mesmo
              </Botao>
            </div>
          ) : (
            <button onClick={() => setConfirmandoLimpeza(true)}
              className="inline-flex items-center gap-1.5 text-[12px] text-fraco transition hover:text-perigo">
              <Trash2 size={13} />Apagar tudo deste navegador
            </button>
          )}
        </div>
      )}
    </Cartao>
  );
}

/** O caminho para sair do modo local. Fica em Ajustes, não na porta de entrada. */
function LigarSincronizacao() {
  return (
    <Cartao>
      <TituloSecao>Ligar a sincronização</TituloSecao>
      <div className="flex items-start gap-2.5">
        <Cloud size={15} className="mt-0.5 shrink-0 text-fraco" />
        <Legenda>
          Uns dez minutos de configuração e o EIXO passa a abrir no celular com os mesmos dados. Faça
          quando quiser — o que você registrar até lá não se perde: baixe o JSON antes e restaure
          depois de entrar na conta.
        </Legenda>
      </div>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-suave">
        <li>Crie um projeto em <span className="text-creme">console.firebase.google.com</span>.</li>
        <li>Em <span className="text-creme">Authentication</span>, ative o provedor <span className="text-creme">E-mail/senha</span>.</li>
        <li>Em <span className="text-creme">Firestore Database</span>, crie o banco e publique o conteúdo de <span className="text-creme">firestore.rules</span>.</li>
        <li>Em <span className="text-creme">Configurações do projeto › Seus apps › Web</span>, copie a config do SDK.</li>
        <li>Cole os valores em <span className="text-creme">src/firebase.ts</span> e recarregue.</li>
      </ol>
      <p className="mt-3 text-[12px] text-fraco">O passo a passo com os detalhes está no README.md do projeto.</p>
    </Cartao>
  );
}
