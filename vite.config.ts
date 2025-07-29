    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import tailwindcss from '@tailwindcss/vite'; // Import the new Vite plugin

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [
        react(),
        tailwindcss(), // Use the Tailwind CSS Vite plugin
      ],
      css: {
        // PostCSS configuration might not even be needed here if only Tailwind is used
        // but we'll keep it minimal just in case.
        postcss: './postcss.config.js',
      },
      server: {
        host: true,
        port: 5173,
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
      },
    });
    