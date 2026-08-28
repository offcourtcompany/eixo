import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { DadosApp } from '../dadosApp';
import type { Dia } from '../tipos';
import {
  hoje, somaDias, mesAtual, moeda, numero, porcento, rotuloMes, trimestreAtual,
  diasRestantesDoTrimestre, dataCurta, anualizar,
} from '../formato';
import { resumoDoMes, serieDeMeses } from '../logica/financas';
import { jurosMensaisDe, saldoTotal, comparar } from '../logica/dividas';
import { estadoDoHabito } from '../logica/habitos';
import { tonelagem } from '../logica/treino';
import {
  itensDoDia, separarAfazeres, diasDeAtraso, horasSemanaisPorFrente, dias as diasDaAgenda,
} from '../logica/agenda';
import { Cartao, TituloSecao, Botao, Legenda, AreaTexto, Aviso } from '../componentes/ui';

type Foco = 'geral' | 'dinheiro' | 'mente' | 'corpo';

const PERGUNTAS: Record<Foco, string> = {
  geral:
    'Olhe este retrato inteiro e me diga: qual é a ÚNICA coisa que, se eu resolver nas próximas duas '
    + 'semanas, faz o resto ficar mais fácil ou desnecessário? Seja direto sobre o que eu estou evitando.',
  dinheiro:
    'Analise o quadro financeiro. Quero saber: (1) a sobra é real ou está escondendo algo; (2) qual '
    + 'alavanca estrutural eu deveria puxar primeiro e por quê; (3) o que eu estou tratando como problema '
    + 'de organização e na verdade é problema de contrato ou de preço.',
  mente:
    'Olhe os registros de humor, energia e constância. Quero entender o padrão, não ser consolado: em que '
    + 'ordem as coisas desandam, o que costuma vir antes da queda, e qual ajuste pequeno de rotina teria '
    + 'o maior efeito. Se os dados não sustentam uma conclusão, diga isso em vez de inventar uma.',
  corpo:
    'Analise o treino e o peso. Quero saber se o volume e a progressão estão coerentes com o objetivo, '
    + 'onde está o risco de lesão dado que eu jogo muito esporte de raquete, e o que ajustar no programa.',
};

export default function Briefing({ dados }: { dados: DadosApp }) {
  const [foco, setFoco] = useState<Foco>('geral');
  const [copiado, setCopiado] = useState(false);

  const texto = useMemo(() => montarBriefing(dados, foco), [dados, foco]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard bloqueado (contexto não seguro, permissão negada): o textarea
      // abaixo continua sendo o caminho manual, então não vale travar a tela.
      setCopiado(false);
    }
  }

  return (
    <div className="space-y-6">
      <Cartao>
        <TituloSecao>Briefing para o Claude</TituloSecao>
        <Legenda>
          Este app não conversa com nenhuma IA por conta própria — ele monta o dossiê. Você copia,
          cola numa conversa comigo e recebe a leitura com todo o histórico que eu já tenho de você.
          Custo zero, nenhuma chave de API, e nada dos seus dados sai daqui sem você mandar.
        </Legenda>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {([
            ['geral', 'Geral'], ['dinheiro', 'Finanças'], ['mente', 'Mente'], ['corpo', 'Corpo'],
          ] as const).map(([id, nome]) => (
            <button key={id} onClick={() => setFoco(id)}
              className={'rounded-xl border px-2 py-2.5 text-[12px] font-medium transition '
                + (foco === id ? 'border-brasa text-brasa' : 'border-borda bg-superficie2 text-suave')}>
              {nome}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Botao variante="primario" className="w-full" onClick={() => void copiar()}>
            {copiado ? <><Check size={16} />Copiado</> : <><Copy size={16} />Copiar briefing</>}
          </Botao>
        </div>
      </Cartao>

      <Cartao>
        <TituloSecao>Prévia</TituloSecao>
        <AreaTexto readOnly value={texto} rows={22}
          className="!text-[12px] leading-relaxed" onFocus={(e) => e.currentTarget.select()} />
        <div className="mt-3">
          <Aviso tom="info">
            Se o botão de copiar não funcionar no seu navegador, toque no texto acima — ele seleciona tudo
            sozinho — e copie na mão.
          </Aviso>
        </div>
      </Cartao>
    </div>
  );
}

function montarBriefing(dados: DadosApp, foco: Foco): string {
  const data = hoje();
  const mes = mesAtual();
  const l: string[] = [];

  l.push('# Retrato pessoal — ' + data);
  l.push('');
  l.push('Este é um extrato automático do meu app de acompanhamento (EIXO). Tudo aqui foi digitado');
  l.push('por mim à mão; não há integração bancária nem importação automática.');
  l.push('');

  // ── Finanças
  const resumo = resumoDoMes(dados.lancamentos.itens, mes);
  const serie = serieDeMeses(dados.lancamentos.itens, mes, 6);
  const pisoFixo = dados.perfil.custoFixoMensal ?? resumo.saidasFixas;

  l.push('## Finanças — ' + rotuloMes(mes));
  l.push('- Entradas: ' + moeda(resumo.entradas) + ' (previsível ' + moeda(resumo.previsivel)
    + ', avulsa ' + moeda(resumo.porOrigem.avulsa) + ')');
  l.push('- Saídas: ' + moeda(resumo.saidas) + ' (fixas ' + moeda(resumo.saidasFixas)
    + ', variáveis ' + moeda(resumo.saidasVariaveis) + ')');
  l.push('- Sobra do mês: ' + moeda(resumo.sobra));
  l.push('- Piso de custo fixo: ' + moeda(pisoFixo)
    + ' — coberto por receita previsível em ' + porcento(pisoFixo ? resumo.previsivel / pisoFixo : 0));
  if (resumo.porCategoria.length) {
    l.push('- Maiores saídas: ' + resumo.porCategoria.slice(0, 5)
      .map((c) => c.categoria + ' ' + moeda(c.valor)).join(', '));
  }
  const historico = serie.filter((m) => m.entradas || m.saidas);
  if (historico.length > 1) {
    l.push('- Últimos meses (previsível / avulso / saídas):');
    for (const m of historico) {
      l.push('  - ' + m.mes + ': ' + moeda(m.previsivel) + ' / ' + moeda(m.porOrigem.avulsa)
        + ' / ' + moeda(m.saidas));
    }
  }
  l.push('');

  // ── Dívidas
  const dividas = dados.dividas.itens.filter((d) => d.ativa);
  if (dividas.length) {
    const total = saldoTotal(dividas);
    const juros = jurosMensaisDe(dividas);
    l.push('## Dívidas');
    l.push('- Saldo total: ' + moeda(total) + ' — juros de ' + moeda(juros)
      + '/mês (taxa efetiva ~' + porcento(total ? anualizar(juros / total) : 0) + ' a.a.)');
    for (const d of dividas) {
      l.push('  - ' + d.nome + ': ' + moeda(d.saldo) + ' a ' + porcento(d.taxaMensal, 2)
        + ' a.m., mínima ' + moeda(d.parcelaMinima));
    }
    const aporte = dividas.reduce((s, d) => s + d.parcelaMinima, 0) + Math.max(0, resumo.sobra);
    const { neve, aval } = comparar(dividas, aporte);
    if (!neve.viavel) {
      l.push('- Com ' + moeda(aporte) + '/mês NÃO existe data de quitação: o saldo cresce. Faltam '
        + moeda(neve.faltaPorMes) + '/mês só para estabilizar.');
    } else {
      l.push('- Com ' + moeda(aporte) + '/mês: bola de neve ' + neve.meses + ' meses ('
        + moeda(neve.jurosTotais) + ' de juros) · avalanche ' + aval.meses + ' meses ('
        + moeda(aval.jurosTotais) + ' de juros).');
    }
    l.push('');
  }

  // ── Ações estruturais
  const acoes = dados.acoes.itens.filter((a) => a.status !== 'descartada');
  if (acoes.length) {
    l.push('## Ações estruturais (mudanças de contrato, não de comportamento)');
    for (const a of acoes) {
      l.push('- [' + a.status + '] ' + a.titulo
        + (a.impactoMensal ? ' — impacto estimado ' + moeda(a.impactoMensal) + '/mês' : ''));
    }
    l.push('');
  }

  // ── Hábitos
  const ativos = dados.habitos.itens.filter((h) => h.ativo);
  if (ativos.length) {
    l.push('## Hábitos (últimos 30 dias)');
    for (const h of ativos) {
      const e = estadoDoHabito(h, dados.porData, data);
      l.push('- ' + h.nome + ': ' + e.ultimos30.feitos + '/' + e.ultimos30.alvos
        + ' (' + porcento(e.ultimos30.taxa) + '), sequência atual ' + e.sequencia
        + (e.emRisco ? ' — EM RISCO: falhou no último dia programado' : ''));
    }
    l.push('');
  }

  // ── Humor e energia
  const ultimos14 = Array.from({ length: 14 }, (_, i) => somaDias(data, -i))
    .map((d) => dados.porData.get(d) as Dia | undefined)
    .filter((d): d is Dia => Boolean(d && (d.humor || d.energia)));
  if (ultimos14.length) {
    const media = (campo: 'humor' | 'energia') => {
      const vs = ultimos14.map((d) => d[campo]).filter((v): v is number => typeof v === 'number');
      return vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : 0;
    };
    l.push('## Humor e energia (14 dias, escala 1–5)');
    l.push('- Humor médio: ' + numero(media('humor'), 1) + ' · Energia média: ' + numero(media('energia'), 1));
    l.push('- Registros dia a dia: ' + ultimos14.reverse()
      .map((d) => dataCurta(d.id) + ' h' + (d.humor ?? '-') + '/e' + (d.energia ?? '-')).join(', '));
    const notas = ultimos14.filter((d) => d.nota).slice(-5);
    if (notas.length) {
      l.push('- Anotações recentes:');
      for (const n of notas) l.push('  - ' + dataCurta(n.id) + ': ' + n.nota);
    }
    l.push('');
  }

  // ── Treino
  const treinos = dados.treinos.itens.filter((t) => t.data >= somaDias(data, -27));
  l.push('## Treino (28 dias)');
  if (!treinos.length) {
    l.push('- Nenhuma sessão registrada no período.');
  } else {
    l.push('- ' + treinos.length + ' sessões, ' + numero(treinos.reduce((s, t) => s + tonelagem(t), 0))
      + ' kg de tonelagem total.');
    for (const t of treinos.slice(0, 8)) {
      l.push('  - ' + t.data + ' (Treino ' + t.programa + '): '
        + t.exercicios.map((e) => e.nome + ' '
          + e.series.map((s) => s.carga + 'x' + s.reps).join('/')).join(' | '));
    }
  }
  const pesos = dados.dias.filter((d) => typeof d.peso === 'number').sort((a, b) => a.id.localeCompare(b.id));
  if (pesos.length) {
    const ult = pesos[pesos.length - 1];
    l.push('- Peso mais recente: ' + numero(ult.peso as number, 1) + ' kg ('
      + ult.id + ')' + (dados.perfil.pesoAlvo ? ', alvo ' + dados.perfil.pesoAlvo + ' kg' : ''));
  }
  l.push('');

  // ── Metas
  const trimestre = trimestreAtual();
  const metas = dados.metas.itens.filter((m) => m.status === 'ativa' && m.trimestre === trimestre);
  if (metas.length) {
    l.push('## Metas do trimestre ' + trimestre + ' (faltam ' + diasRestantesDoTrimestre() + ' dias)');
    for (const m of metas) {
      l.push('- ' + m.objetivo + (m.porque ? ' — porquê: ' + m.porque : ''));
      for (const kr of m.krs) {
        l.push('  - ' + kr.nome + ': ' + numero(kr.inicio) + ' → ' + numero(kr.atual)
          + ' (alvo ' + numero(kr.alvo) + ' ' + kr.unidade + ')');
      }
      if (m.medidasDirecao.length) {
        l.push('  - Medidas de direção: ' + m.medidasDirecao.join('; '));
      }
    }
    l.push('');
  }

  // ── Agenda: as frentes abertas, o que vem e o que ficou para trás.
  // Sem isto o consultor lê o dinheiro e os hábitos sem saber quantas coisas
  // estão disputando a mesma semana — e conselho que ignora a agenda é conselho
  // que assume tempo infinito.
  const frentes = dados.frentes.itens.filter((f) => f.ativo);
  const afazeres = separarAfazeres(dados.tarefas.itens);
  const fontes = {
    eventos: dados.eventos.itens, rotinas: dados.rotinas.itens, tarefas: dados.tarefas.itens,
  };
  const proximos = diasDaAgenda(hoje(), 14)
    .map((d) => ({ data: d, itens: itensDoDia(d, fontes).filter((i) => i.origem !== 'tarefa') }))
    .filter((d) => d.itens.length);

  if (frentes.length || proximos.length || afazeres.atrasadas.length) {
    l.push('## Agenda');
    if (frentes.length) {
      const horas = horasSemanaisPorFrente(dados.rotinas.itens);
      l.push('Frentes abertas: ' + frentes.map((f) => {
        const min = horas.get(f.id) || 0;
        return f.nome + ' (' + f.tipo + (min ? ', ' + (min / 60).toFixed(0) + 'h/sem de rotina' : '') + ')';
      }).join(' · '));
    }
    if (afazeres.atrasadas.length) {
      l.push('Atrasados (' + afazeres.atrasadas.length + '): ' + afazeres.atrasadas.slice(0, 8)
        .map((t) => t.titulo + ' [' + diasDeAtraso(t.prazo!) + 'd]').join('; '));
    }
    const chave = [...afazeres.atrasadas, ...afazeres.hoje, ...afazeres.proximas]
      .filter((t) => t.peso === 'chave');
    if (chave.length) {
      l.push('Afazeres marcados como chave: ' + chave.slice(0, 6).map((t) => t.titulo).join('; '));
    }
    if (proximos.length) {
      l.push('Próximos 14 dias:');
      for (const d of proximos.slice(0, 10)) {
        l.push('- ' + dataCurta(d.data) + ': ' + d.itens
          .map((i) => (i.hora ? i.hora + ' ' : '') + i.titulo).join(' · '));
      }
    }
    l.push('');
  }

  l.push('---');
  l.push('');
  l.push('## O que eu quero de você');
  l.push(PERGUNTAS[foco]);
  l.push('');
  l.push('Trate os números acima como fatos e me diga se algum deles não fecha. Se faltar informação para');
  l.push('concluir alguma coisa, pergunte em vez de supor.');

  return l.join('\n');
}
