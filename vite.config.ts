import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      /**
       * Duas entradas de propósito: o app em / e a **demonstração navegável**
       * em /preview.html, com dados fictícios.
       *
       * A bancada nasceu como ferramenta de desenvolvimento e virou vitrine:
       * dá para mostrar o sistema inteiro funcionando, no celular de quem
       * estiver na frente, sem conta e sem expor dado real. Para alguém que
       * vende sistema no meio esportivo, isso é ativo, não sobra de obra.
       *
       * O custo é honesto e pequeno: o código de dados falsos vai junto no
       * pacote, uns 8 kB.
       */
      input: { index: 'index.html', preview: 'preview.html' },
      output: {
        /**
         * Recharts e companhia moram num chunk só, de propósito.
         *
         * Repartir o recharts entre chunks faz o rolldown gerar, no embrulho
         * CommonJS do es-toolkit, uma variável que lê a si mesma:
         *
         *     var require_get = require_get();   // undefined, por içamento
         *
         * Isso derrubou TODA tela com gráfico do app da Offcourt em 08/08/2026,
         * e só em produção. scripts/check-bundle.mjs falha o build se voltar.
         */
        manualChunks(id: string) {
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/es-toolkit') ||
              id.includes('node_modules/victory-vendor') ||
              id.includes('node_modules/d3-')) return 'graficos';
        },
      },
    },
  },
})
