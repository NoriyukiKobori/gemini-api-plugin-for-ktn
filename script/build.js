// build.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESモジュール用 __dirname 定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), '..');

// コマンドライン引数
const args = process.argv.slice(2);
const env = args[0]; // dev / pro / svr

if (!['dev', 'pro', 'svr'].includes(env)) {
  console.error('Usage: node build-all.js [dev|pro|svr]');
  process.exit(1);
}

// ディレクトリ設定
const DIST_MAIN = path.resolve(__dirname, `dist/main`);
const DIST_CONFIG = path.resolve(__dirname, `dist/config`);
const SRC_CONFIG = path.relative(__dirname, 'src/config');
const PLUGIN_SRC = path.resolve(__dirname, `plugin-src`, env);
const PACKAGE_DIR = path.resolve(__dirname, `plugin-package`, env);
const MANIFEST_DIR = path.resolve(__dirname, `manifest`);

let MANIFEST_FILE_NAME = '';

// ソースマップ判定（dev/svr は inline）
// const sourcemapFlag = env === "pro" ? "" : "--sourcemap=inline";
const modeFlag = `--mode=${env}`;

if (env === 'dev') {
  MANIFEST_FILE_NAME = 'manifest-dev.json';
} else if (env === 'pro') {
  MANIFEST_FILE_NAME = 'manifest-pro.json';
} else if (env === 'svr') {
  MANIFEST_FILE_NAME = 'manifest-svr.json';
} else {
  // エラー
  console.error(`Unknown environment: ${env}`);
  process.exit(1);
}

// 出力ディレクトリ作成
for (const dir of [DIST_MAIN, DIST_CONFIG, PLUGIN_SRC, PACKAGE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Vite ビルド: メイン
console.log(`[VITE BUILD] Main (env=${env})`);
execSync(
  // `npx vite build --config vite.config.main.ts --outDir ${DIST_MAIN} ${sourcemapFlag}`,
  `npx vite build --config vite.config.main.ts --outDir ${DIST_MAIN} ${modeFlag}`,
  { stdio: 'inherit' }
);

// Vite ビルド: 設定画面
console.log(`[VITE BUILD] Config (env=${env})`);
execSync(`npx vite build --config vite.config.config.ts --outDir ${DIST_CONFIG} ${modeFlag}`, { stdio: 'inherit' });

// ファイルコピー関数
const copyFileSync = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: ${src} が存在しません`);
    return;
  }
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
};

// plugin-src/{env} にコピー
copyFileSync(path.join(DIST_MAIN, 'index.js'), path.join(PLUGIN_SRC, 'index.js'));
copyFileSync(path.join(DIST_MAIN, 'main.css'), path.join(PLUGIN_SRC, 'main.css'));
copyFileSync(path.join(DIST_CONFIG, 'config.js'), path.join(PLUGIN_SRC, 'config/config.js'));
copyFileSync(path.join(DIST_CONFIG, 'config.css'), path.join(PLUGIN_SRC, 'config/config.css'));
copyFileSync(path.join(SRC_CONFIG, 'config.html'), path.join(PLUGIN_SRC, 'config/config.html'));
copyFileSync(path.join(__dirname, 'image/plugin-icon.png'), path.join(PLUGIN_SRC, 'plugin-icon.png'));

console.log('MANIFEST_FILE_NAME', MANIFEST_FILE_NAME);

if (MANIFEST_FILE_NAME) {
  copyFileSync(path.join(MANIFEST_DIR, MANIFEST_FILE_NAME), path.join(PLUGIN_SRC, 'manifest.json'));
} else {
  console.error('Error: MANIFEST_FILE_NAME is not set.');
  process.exit(1);
}

console.log('[DONE] Plugin build successfully!');
