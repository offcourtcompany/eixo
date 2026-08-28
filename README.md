# EIXO

Sistema pessoal de acompanhamento — **Finanças, Corpo, Mente, Ofício**.

Tudo é digitado à mão. Não há Open Finance, integração bancária, importação de
extrato nem leitura de e-mail. O app não conversa com nenhuma IA por conta
própria: ele monta um briefing que você copia e cola numa conversa com o Claude.

**Lote 1:** Finanças · Hábitos · Metas · Treino, mais o painel de Hoje e o
gerador de briefing.
**Agenda (adiantada do lote 2):** eventos, rotinas e afazeres por frente de
trabalho — o emprego fixo, cada torneio, cada projeto.
**Falta do lote 2:** Nutrição · Estudo.
**Lote 3:** Consultor · Psicólogo · Oportunidades.

---

## 1. Rodar na sua máquina

```bash
npm install
```

```bash
npm run dev
```

Duas páginas sobem:

- `http://localhost:5173` — o app de verdade. Sem Firebase configurado ele entra em **modo local** (seção 1.1) em vez de barrar a entrada.
- `http://localhost:5173/preview.html` — **bancada de prévia**: as telas rodando
  com dados falsos, sem Firebase e sem login. Serve para ver e mexer no visual
  antes de qualquer configuração, e para conferir uma mudança sem sujar seus
  dados reais. Não entra no build de produção.

## 1.1 Modo local — usar antes de existir nuvem

Enquanto `src/firebase.ts` estiver com os valores de exemplo, o app **não pede
login**: ele abre direto e grava tudo no `localStorage` deste navegador. É o
modo de rodar hoje, sem depender de configuração nenhuma.

O que muda em relação à nuvem:

| | Modo local | Com Firebase |
|---|---|---|
| Login | não tem | e-mail e senha |
| Onde mora o dado | só neste navegador | na sua conta, em qualquer aparelho |
| Celular e PC juntos | não | sim |
| Cópia de segurança | o JSON que você baixar | a nuvem, mais o JSON |

Três coisas para saber:

1. **Limpar os dados do site apaga tudo**, sem lixeira. Por isso, em Ajustes ›
   Seus dados, baixe o JSON de vez em quando — uma vez por semana resolve.
2. **O celular não vê nada.** Modo local é por navegador; o telefone teria a
   própria base vazia.
3. **A migração já está pronta.** Baixe o JSON aqui, configure o Firebase, crie a
   conta e use *Restaurar de um JSON* na mesma tela. Os ids são preservados,
   então restaurar duas vezes atualiza em vez de duplicar.

A etiqueta `local` ao lado da marca, no topo, existe para você nunca confundir os
dois estados. Ela some sozinha quando a nuvem entra.

Uma nota técnica: em modo local o SDK do Firebase continua no pacote (~240 kB
comprimidos) sem ser usado. Não atrapalha em `localhost`; se um dia o modo local
for publicado na web, vale separar os dois caminhos em módulos distintos.

## 2. Configurar o Firebase (uma vez só, ~10 minutos)

1. Em <https://console.firebase.google.com>, **crie um projeto** (sugestão de
   nome: `eixo-rodrigo`). Pode desativar o Google Analytics — não é usado.
2. **Authentication › Método de login › E-mail/senha › Ativar.** Só isso; não
   precisa de Google, telefone nem nada mais.
3. **Firestore Database › Criar banco de dados.** Escolha a região
   `southamerica-east1` (São Paulo) e o modo de produção — as regras entram no
   passo seguinte.
4. **Firestore Database › Regras.** Apague o que estiver lá, cole o conteúdo
   inteiro de [`firestore.rules`](firestore.rules) e clique em **Publicar**.
   Essas regras liberam apenas os documentos do próprio usuário logado; sem
   elas, o banco fica aberto ou fechado demais.
5. **Configurações do projeto (engrenagem) › Seus apps › ícone `</>` (Web).**
   Registre um app (apelido `eixo`, sem hospedagem) e copie o objeto
   `firebaseConfig`.
6. Cole os seis valores em [`src/firebase.ts`](src/firebase.ts), no lugar dos
   `COLE_AQUI_…`. Salve e recarregue a página.
7. Na tela de login, clique em **Criar conta** e cadastre seu e-mail e senha.
   Essa conta é a dona de todos os dados.

> Esses valores não são segredo. A config web do Firebase é pública por design —
> quem protege os dados são as regras do passo 4. Por isso eles ficam no código,
> e o deploy não depende de painel de variáveis de ambiente.

## 3. Publicar na Vercel

```bash
npx vercel --prod
```

Ou pelo painel: **Add New › Project › importar o repositório**. A Vercel
reconhece Vite sozinha (build `npm run build`, saída `dist`). O
[`vercel.json`](vercel.json) já cuida do roteamento.

Depois de publicar, **abra o link no celular e adicione à tela de início**
(Safari: Compartilhar › Adicionar à Tela de Início; Chrome: menu › Instalar
aplicativo). Ele abre em tela cheia, como app.

Falta um passo no console: **Authentication › Configurações › Domínios
autorizados › Adicionar domínio**, com o domínio `.vercel.app` que a Vercel te
deu. Sem isso o login funciona no `localhost` e falha em produção.

## 4. Como o app se comporta sem sinal

O Firestore roda com cache local persistente. Registrar uma série na academia ou
um gasto no restaurante funciona offline: a escrita entra na fila do aparelho e
sobe sozinha quando a conexão volta. Isso é deliberado — um registro que falha
por causa de rede é um hábito que não se forma.

## 4.1 O que entra sozinho

Uma automação, e só uma: **os fixos do mês**. Você cadastra uma vez cada
compromisso que se repete — seguro, consórcio, filha, o fixo da arena — em
**Finanças › Fixos do mês**, e a partir daí ele aparece lançado sozinho todo
mês, marcado como *a confirmar*.

Três garantias no desenho (`src/logica/recorrentes.ts`):

- **Não duplica.** O id do lançamento é derivado do fixo e do mês, então gerar
  duas vezes escreve por cima do mesmo documento.
- **Não ressuscita o que você apagou.** Cada fixo guarda até que mês já gerou.
- **Não inventa passado.** Volta no máximo um mês. Mês que você não acompanhou
  continua vazio — é a verdade, e a verdade é o ponto do app.

O valor sugerido é o que você cadastrou; confirmar é onde você corrige o mês em
que ele veio diferente. **Nada é importado de fora** — a automação só evita
pedir de novo o que você já disse uma vez.

## 4.2 Sistema visual

Direção **Instrumento**, vinda da referência Factory (sala de guerra de
terminal). Três regras mandam em tudo:

**1. Cromo é monocromático.** Fundo obsidiana `#101010`, tinta osso `#EEEEEE`,
cinzas quentes no meio. Botão, aba, cartão e borda são neutros — sempre. Cor tem
um trabalho só, que é dizer estado de dado: **laranja de sinal** (`#EE6018`)
avisa, marca atraso e prejuízo; **verde de métrica** (`#A0CA92`) confirma. Cor
nunca entra em fundo de botão nem em superfície de cartão.

**2. Profundidade é contraste, não sombra.** Não há `box-shadow` nem
`backdrop-filter` em lugar nenhum do app. O cartão escuro é implicado por um fio
de 1px (`#1D1A18`); separador interno usa o traço de cinza (`#3D3A39`), que é
mais claro de propósito, porque separador precisa ser visto. E existe **um único
cartão claro** (`<Cartao tom="destaque">`), no topo da tela de Hoje: é o
movimento-assinatura da referência e só funciona enquanto for raro.

**3. Duas vozes, uma família.** **Geist** carrega todo o texto, em **peso 400**
do começo ao fim — a autoridade vem do tamanho e do espaçamento negativo, nunca
do negrito. **Geist Mono** em maiúscula carrega rótulo, etiqueta, unidade e a
marca EIXO. Quando aparece mono, você está olhando para instrumento, não para
página. Raio: 3px em botão e campo, 10px em cartão.

### Onde eu me afastei da referência, e por quê

A referência descreve um **site**; isto é um app de dado denso usado no celular.
Quatro desvios, todos deliberados:

- **Rótulo a 11px**, não 12 — a tela tem muito mais rótulos que uma landing.
- **Respiro de 24px entre cartões**, não os 96px de seção do original.
- **Paleta categórica derivada** (`CORES_FRENTE`, cores dos eixos): tons e
  sombras dos dois acentos mais os neutros quentes, nenhuma matiz nova.
  Distinguir cinco frentes num calendário é necessidade funcional, não
  decoração — mas o cromo continua monocromático.
- **Verde e laranja preenchem indicadores de estado pequenos** (a marca de
  hábito feito, o ponto de "a confirmar"), o que é a mesma ideia do Status Pulse
  da referência em tamanho maior.

Os tokens vivem todos em `src/index.css`, inclusive a escala de raio do
Tailwind. Mudar o desenho inteiro é mexer num arquivo só.

**Armadilha de cascata, anotada porque custou caro:** os resets de elemento
(`input, select, textarea, button { font: inherit }`) precisam ficar dentro de
`@layer base`. Fora de camada, CSS sem `@layer` ganha de **toda** utilidade do
Tailwind — foi assim que o `font: inherit` de `button` engoliu o
`font-mono text-[13px]` da marca e devolveu Geist 16px sem erro nenhum.

## 4.3 Rentabilidade por frente

O mesmo cadastro de **frente** da Agenda vale para o dinheiro: cada lançamento
pode apontar para uma. É esse campo em comum que permite cruzar as duas metades
que o app já tinha separadas — quantas horas por semana a frente ocupa (rotinas
da Agenda) e quanto ela entrou e saiu (Finanças).

De onde saem os números da tabela **Por frente**:

- **Margem** = entradas − saídas do período, só dos lançamentos daquela frente.
- **h/sem** = soma das rotinas ativas da frente. É estimativa de ocupação, não
  cronômetro — a tela diz isso.
- **R$/h** = margem ÷ (horas por semana × semanas do período, contadas a 4,345
  semanas por mês). Frente sem rotina cadastrada mostra "—" em vez de inventar.

Uma armadilha que a tela avisa em vez de esconder: se mais de 20% das saídas do
período estiverem **sem frente**, as margens ficam infladas — as receitas foram
etiquetadas e os custos caíram no bolo geral. Aparece um alerta dizendo isso.

O corte **contratado × próprio** vem de um campo na própria frente. Contratado é
receita garantida por contrato, com o risco de bilheteria do contratante;
próprio é upside maior com o capital e a ocupação por sua conta.

## 4.4 Qualidade

```bash
npm test
```

22 testes cobrindo o que dá conselho errado em silêncio: o simulador de dívida
(inclusive o caso em que o aporte não cobre nem o juro), a idempotência da
geração dos fixos, a matemática de datas da agenda e a margem por frente. O
`check-bundle` pega bundle quebrado; ele nunca pegaria conta errada.

```bash
npm run lint
```

ESLint com as regras de hooks. As regras de pureza e de `setState` em efeito
ficam como **erro** — foi assim que apareceu um `Date.now()` rodando durante o
render. Os diagnósticos do React Compiler ficam como aviso: eles dizem que a
otimização automática não pôde ser aplicada, não que existe defeito.

## 5. Estrutura

```
src/
  firebase.ts       conexão e config (o arquivo que você edita no passo 6)
  db.ts             Firestore com cache offline; tudo sob usuarios/{uid}
  store.ts          autenticação e coleções sincronizadas
  dadosApp.ts       ponto único de carga; as telas recebem `dados` inteiro
  tipos.ts          modelo de dados e os quatro eixos
  formato.ts        moeda, datas, trimestre — sempre em fuso local
  logica/
    agenda.ts       dia, grade do mês, atrasados, horas por frente
    frentes.ts      margem e R$/hora por frente; contratado × próprio
    logica.test.ts  os testes da matemática que dá conselho
    dividas.ts      simulação bola de neve × avalanche
    financas.ts     fechamento do mês, receita previsível × custo fixo
    habitos.ts      sequência, constância e a regra das duas faltas
    recorrentes.ts  geração dos fixos do mês (idempotente, não ressuscita)
    treino.ts       1RM estimado, volume, sugestão de carga
  dados/
    programas.ts    programa de força A/B
    sementes.ts     sugestões iniciais (só entram se você clicar)
  componentes/
    ui.tsx          primitivas visuais (três registros de superfície)
    Fixos.tsx       cadastro dos fixos e faixa de confirmação
    Frentes.tsx     o seletor de frente, usado por Agenda e Finanças
    PorFrente.tsx   tabela de rentabilidade e o corte contratado × próprio
    Patrimonio.tsx  curva de dívida e reserva ao longo do tempo
  telas/            Hoje, Agenda, Financeiro, Habitos, Metas, Treino, Briefing, Ajustes
  preview.tsx       bancada de prévia (desenvolvimento)
```

## 6. Sobre o build

```bash
npm run build
```

O build roda `scripts/check-bundle.mjs` no fim e **falha** se o empacotador
gerar uma variável autorreferente (`var x = x()`) — o defeito que derrubou toda
tela com gráfico do app da Offcourt em 08/08/2026, passando por build e testes
sem ser notado. O recharts fica num chunk só por causa disso; ver o comentário
em [`vite.config.ts`](vite.config.ts).

Build verde não prova app no ar. Depois de qualquer mudança que apareça na tela,
abra a bancada de prévia e olhe.

## 7. Seus dados

Ficam sob a sua conta no Firestore, em `usuarios/{seu-uid}`. As regras não
permitem que nenhum outro usuário leia. Em **Ajustes › Baixar tudo em JSON** você
leva uma cópia completa embora a qualquer momento.
