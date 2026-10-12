import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'clean-urls',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/justicaporacelbildes' || req.url === '/justicaporacelbildes/' ||
              req.url === '/justicaalcebiades' || req.url === '/justicaalcebiades/') {
            req.url = '/justicaporacelbildes.html';
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/justicaporacelbildes' || req.url === '/justicaporacelbildes/' ||
              req.url === '/justicaalcebiades' || req.url === '/justicaalcebiades/') {
            req.url = '/justicaporacelbildes.html';
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        galeria: resolve(__dirname, 'galeria.html'),
        doacoes: resolve(__dirname, 'doacoes.html'),
        campanha: resolve(__dirname, 'campanha.html'),
        justicaporacelbildes: resolve(__dirname, 'justicaporacelbildes.html')
      }
    }
  }
});
