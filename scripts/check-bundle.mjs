/**
 * Trava contra o bug que derrubou o app em 08/08/2026.
 *
 * Ao repartir o recharts entre chunks, o rolldown gerava, no embrulho
 * CommonJS do es-toolkit, uma variável que lê a si mesma:
 *
 *     var require_get = require_get();   //  undefined, por içamento
 *
 * O resultado era "TypeError: t is not a function" em toda tela com gráfico,
 * só em produção — o build passava, os testes passavam, e a falha só aparecia
 * no navegador de quem tinha dado real para desenhar. Um erro assim não pode
 * depender de alguém reparar; por isso ele falha o build.
 *
 * A varredura é sobre o texto do bundle de propósito: o que importa é o que
 * chega ao navegador, não o que o código-fonte pretendia.
 *
 * Rodar depois do build:  node scripts/check-bundle.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'dist', 'assets');

// `var x = x()` / `let x = x()` — nome recebendo o retorno de si mesmo.
const AUTORREFERENCIA = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*\1\s*\(\)/g;

let arquivos;
try {
  arquivos = readdirSync(DIR).filter(f => f.endsWith('.js'));
} catch {
  console.error(`check-bundle: ${DIR} não existe — rode o build antes.`);
  process.exit(1);
}

const achados = [];
for (const arquivo of arquivos) {
  const texto = readFileSync(join(DIR, arquivo), 'utf8');
  for (const m of texto.matchAll(AUTORREFERENCIA)) {
    achados.push({ arquivo, trecho: m[0], nome: m[1] });
  }
}

if (achados.length) {
  console.error(`\ncheck-bundle: ${achados.length} variável(is) que leem a si mesmas no bundle.\n`);
  for (const a of achados) console.error(`  ${a.arquivo}: ${a.trecho}`);
  console.error(`
Isto quebra em produção com "X is not a function" assim que o módulo for
carregado. Causa conhecida: repartição de biblioteca CommonJS entre chunks.
Conserto: agrupar a biblioteca num chunk só em manualChunks (vite.config.ts).
`);
  process.exit(1);
}

console.log(`check-bundle: ${arquivos.length} chunks, nenhuma variável autorreferente.`);
