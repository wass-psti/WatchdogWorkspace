import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@material/generated': path.resolve(process.cwd(), 'src/generated'),
      '@material/components': path.resolve(process.cwd(), 'src/components'),
      '@material/api': path.resolve(process.cwd(), 'src/api'),
      '@material/skills': path.resolve(process.cwd(), 'src/skills'),
      '@material/lib': path.resolve(process.cwd(), 'src/lib'),
      '@material/platform': path.resolve(process.cwd(), 'src/platform'),
      '@material/import-export': path.resolve(process.cwd(), 'src/import-export'),
    },
  },
});
