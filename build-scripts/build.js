const fs = require('fs');
const path = require('path');
const glob = require('glob');
const terser = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_DIR = path.join(__dirname, '..', 'assets', 'js');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'dist');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function obfuscate(code, fileName) {
  const obf = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.75,
    selfDefending: true,
    disableConsoleOutput: true
  });
  return obf.getObfuscatedCode();
}

async function processFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const terserResult = await terser.minify(code, { module: true });
  if (terserResult.error) throw terserResult.error;
  const min = terserResult.code;
  const basename = path.basename(file, '.js');
  const outMin = path.join(OUT_DIR, basename + '.min.js');
  const outObf = path.join(OUT_DIR, basename + '.obf.js');
  fs.writeFileSync(outMin, min, 'utf8');
  const obfCode = obfuscate(min, basename);
  fs.writeFileSync(outObf, obfCode, 'utf8');
  console.log('Processed', file, '->', outObf);
}

(async function () {
  const files = glob.sync(path.join(SRC_DIR, '*.js'));
  for (const f of files) {
    try {
      await processFile(f);
    } catch (e) {
      console.error('Failed processing', f, e);
    }
  }
  console.log('Build complete.');
})();
