// Configuração mínima e deliberada: só as regras que pegam erro de verdade
// neste projeto. O `npm run lint` existia no package.json sem este arquivo e
// falhava — script quebrado é pior que script ausente.
import js from '@eslint/js';
import ts from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // A ordem dos ganchos e as dependências dos efeitos são exatamente o tipo
      // de erro que compila, roda e só quebra em produção.
      'react-hooks/exhaustive-deps': 'warn',
      // Diagnóstico do React Compiler, que este projeto não usa: dizem que a
      // otimização automática não pôde ser aplicada, não que há erro. Ficam
      // como aviso para não afogar o que é defeito de verdade.
      'react-hooks/preserve-manual-memoization': 'warn',
      // Variável ignorada de propósito é escrita com _ na frente.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
  },
);
