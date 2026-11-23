import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://components.example.com',
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { target: 'es2022' },
  },
});
