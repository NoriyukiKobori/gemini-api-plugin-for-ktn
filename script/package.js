// package.js
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
  console.error('Usage: node package.js [dev|pro|svr]');
  process.exit(1);
}

// ディレクトリ設定
const DIST_MAIN = path.resolve(__dirname, `dist/main`);
const DIST_CONFIG = path.resolve(__dirname, `dist/config`);
const PLUGIN_SRC = path.resolve(__dirname, `plugin-src`, env);
const PACKAGE_DIR = path.resolve(__dirname, `plugin-package`, env);

// 出力ディレクトリ作成
for (const dir of [DIST_MAIN, DIST_CONFIG, PLUGIN_SRC, PACKAGE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// PPK の検出（あれば使用）
const ppks = fs.readdirSync(PACKAGE_DIR).filter((f) => f.endsWith('.ppk'));
let ppkArg = '';
if (ppks.length > 0) {
  ppkArg = `--ppk ${path.join(PACKAGE_DIR, ppks[0])}`;
}

// ZIP 出力
// zip ファイル名をmanifest.jsonのname>enとversionから生成
const manifest = JSON.parse(fs.readFileSync(path.join(PLUGIN_SRC, 'manifest.json'), 'utf8'));
const pluginName = manifest.name['en'].replace(/\s+/g, '_');
const zipFile = path.join(PACKAGE_DIR, `${pluginName}-${manifest.version}.zip`);

console.log(`[PLUGIN PACKER] output=${zipFile}`);
execSync(`npx @kintone/plugin-packer ${PLUGIN_SRC} --out ${zipFile} ${ppkArg}`, { stdio: 'inherit' });

console.log('[DONE] Plugin packaged successfully!');
