import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

let appBuildId = process.env.VITE_APP_BUILD_ID || '';
try {
  const versionFile = path.resolve(__dirname, 'public', 'version.json');
  if (fs.existsSync(versionFile)) {
    const vData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    if (vData && vData.version) {
      appBuildId = vData.version;
    }
  }
} catch (e) {}
if (!appBuildId) {
  appBuildId = `v${Date.now()}`;
}

export default defineConfig(() => {
  return {
    define: {
      '__APP_BUILD_ID__': JSON.stringify(appBuildId),
      'process.env.VITE_APP_BUILD_ID': JSON.stringify(appBuildId),
      'process.env': {},
      global: 'window',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      reportCompressedSize: false,
      chunkSizeWarningLimit: 3000,
      target: 'es2022',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('motion')) return 'vendor-react';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
              if (id.includes('jspdf') || id.includes('pdfmake') || id.includes('xlsx') || id.includes('mammoth') || id.includes('html2canvas') || id.includes('pdfjs-dist') || id.includes('html-docx-js-typescript')) return 'vendor-docs';
              if (id.includes('@supabase') || id.includes('socket.io') || id.includes('@google/genai')) return 'vendor-services';
            }
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      watch: null,
    },
  };
});
