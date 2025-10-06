import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { terser } from "rollup-plugin-terser";
import { fileURLToPath, URL } from 'url';

console.log('🔥 VITE CONFIG LOADED!');

const threeLocalPath = fileURLToPath(new URL('./src/three-local-v3', import.meta.url));
console.log('📍 Using local Three.js from:', threeLocalPath);

export default defineConfig({
  plugins: [
    vue(),
    terser({
      compress: {
        drop_console: false, // KEEP console for debugging!
        drop_debugger: false
      },
      format: {
        comments: false, // Removes comments
      }
    })
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Use local Three.js for everything
      { find: /^three$/, replacement: threeLocalPath + '/src/Three.js' },
      // Map addons to examples/jsm
      { find: /^three\/addons\//, replacement: threeLocalPath + '/examples/jsm/' },
      // Everything else from three/
      { find: /^three\//, replacement: threeLocalPath + '/' },
    ]
  }
});
