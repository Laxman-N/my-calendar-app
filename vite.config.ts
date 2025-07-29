    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [react()],
      css: {
        // Explicitly tell Vite to use PostCSS
        postcss: './postcss.config.js',
      },
      server: {
        host: true, // This makes the server accessible externally (e.g., on a local network)
        port: 5173, // You can specify a port, or let Vite pick one
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
      },
    });
    