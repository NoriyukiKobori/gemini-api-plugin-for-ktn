import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// ESモジュール環境で __dirname を定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProd = mode === 'pro';

  return {
    build: {
      outDir: path.resolve(__dirname, 'dist/config'),
      sourcemap: isProd ? false : 'inline',
      rollupOptions: {
        input: {
          config: path.resolve(__dirname, 'src/config/config.ts')
        },
        output: {
          entryFileNames: 'config.js',
          assetFileNames: '[name].[ext]'
        }
      }
    }
  };
});
