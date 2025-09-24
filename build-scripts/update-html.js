const fs = require('fs');
const path = require('path');
const glob = require('glob');

const HTML_GLOB = path.join(__dirname, '..', '*.html');
const JS_SRC_DIR = 'assets/js/';
const JS_OUT_DIR = 'assets/dist/';

const files = glob.sync(HTML_GLOB);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Replace script src="assets/js/NAME.js" with assets/dist/NAME.obf.js
  content = content.replace(/assets\/js\/(.+?)\.js/g, (m, name) => {
    return JS_OUT_DIR + name + '.obf.js';
  });
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated', file);
}
console.log('HTML update complete.');
