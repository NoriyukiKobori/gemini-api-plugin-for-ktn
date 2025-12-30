// watch.js - svrモード用ウォッチビルド
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESモジュール用 __dirname 定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), '..');

// svrモード固定
const env = 'svr';

// ディレクトリ設定
const DIST_MAIN = path.resolve(__dirname, `dist/main`);
const DIST_CONFIG = path.resolve(__dirname, `dist/config`);
const SRC_CONFIG = path.relative(__dirname, 'src/config');
const PLUGIN_SRC = path.resolve(__dirname, `plugin-src`, env);
const MANIFEST_DIR = path.resolve(__dirname, `manifest`);
const MANIFEST_FILE_NAME = 'manifest-svr.json';

// 出力ディレクトリ作成
for (const dir of [DIST_MAIN, DIST_CONFIG, PLUGIN_SRC]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ファイルコピー関数
const copyFileSync = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: ${src} が存在しません`);
    return;
  }
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[COPY] ${path.relative(__dirname, src)} → ${path.relative(__dirname, dest)}`);
};

// ビルド成果物のコピー
const copyBuildFiles = () => {
  copyFileSync(path.join(DIST_MAIN, 'index.js'), path.join(PLUGIN_SRC, 'index.js'));
  copyFileSync(path.join(DIST_MAIN, 'main.css'), path.join(PLUGIN_SRC, 'main.css'));
  copyFileSync(path.join(DIST_CONFIG, 'config.js'), path.join(PLUGIN_SRC, 'config/config.js'));
  copyFileSync(path.join(DIST_CONFIG, 'config.css'), path.join(PLUGIN_SRC, 'config/config.css'));
};

// 初回ビルド完了フラグ
let initialBuildComplete = false;

// Vite ウォッチモード: メイン
console.log(`[WATCH] メインビルドを監視開始 (env=${env})`);
const mainWatch = spawn('npx', ['vite', 'build', '--config', 'vite.config.main.ts', '--outDir', DIST_MAIN, `--mode=${env}`, '--watch'], {
  stdio: 'inherit',
  shell: true
});

// Vite ウォッチモード: 設定画面
console.log(`[WATCH] 設定画面ビルドを監視開始 (env=${env})`);
const configWatch = spawn('npx', ['vite', 'build', '--config', 'vite.config.config.ts', '--outDir', DIST_CONFIG, `--mode=${env}`, '--watch'], {
  stdio: 'inherit',
  shell: true
});

// 初回ビルド完了を待つ
const waitForInitialBuild = () => {
  const checkInterval = setInterval(() => {
    const mainJsExists = fs.existsSync(path.join(DIST_MAIN, 'index.js'));
    const configJsExists = fs.existsSync(path.join(DIST_CONFIG, 'config.js'));

    if (mainJsExists && configJsExists && !initialBuildComplete) {
      clearInterval(checkInterval);
      initialBuildComplete = true;
      console.log('[WATCH] 初回ビルド完了、ファイルをコピーします...');
      copyBuildFiles();
      console.log('[WATCH] 初回コピー完了\n');
    }
  }, 500);
};

waitForInitialBuild();

// distディレクトリの変更を監視してplugin-srcにコピー
let copyTimeout;
const watchDist = () => {
  const watcher = fs.watch(path.resolve(__dirname, 'dist'), { recursive: true }, (_eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.css')) && initialBuildComplete) {
      // デバウンス処理（連続した変更をまとめる）
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        console.log(`[WATCH] 変更検出: ${filename}`);
        copyBuildFiles();
        console.log('[WATCH] ファイルのコピーが完了しました');
      }, 1000); // 1秒待機してからコピー
    }
  });

  return watcher;
};

const distWatcher = watchDist();

// プロセス終了時のクリーンアップ
const cleanup = () => {
  console.log('\n[WATCH] ウォッチモードを終了します...');
  mainWatch.kill();
  configWatch.kill();
  distWatcher.close();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

console.log('\n[WATCH] ウォッチモード起動完了');
console.log('[WATCH] ファイルの変更を監視中... (終了するには Ctrl+C を押してください)');
console.log(`[WATCH] 出力先: ${path.relative(__dirname, PLUGIN_SRC)}\n`);
