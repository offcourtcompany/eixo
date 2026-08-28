import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
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
