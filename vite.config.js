import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { terser } from "rollup-plugin-terser";
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    vue(),
    terser({
      compress: {
        drop_console: true, // Drops all console statements
        drop_debugger: true
      },
      format: {
        comments: false, // Removes comments
      }
    })
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ]
  }
});
