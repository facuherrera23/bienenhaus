const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = ['filters.js', 'tabs.js', 'skeleton.js', 'contact.js', 'main.js'];
const jsDir = path.join(__dirname, 'js');
const tmpFile = path.join(__dirname, 'js', '_public-concat-tmp.js');

const output = ['filters.js', 'tabs.js', 'skeleton.js', 'contact.js', 'main.js'].map(f => {
  const content = fs.readFileSync(path.join(__dirname, 'js', f), 'utf-8');
  return content.endsWith('\n') ? content : content + '\n';
}).join('\n');

fs.writeFileSync(path.join(__dirname, 'js', '_public-concat-tmp.js'), output);

try {
  execSync(
    'npx --yes esbuild "' + path.join(__dirname, 'js', '_public-concat-tmp.js') + '" --bundle --format=iife --minify-syntax --minify-whitespace --outfile="' + path.join(__dirname, 'js', 'main.min.js') + '" --target=es2017',
    { cwd: __dirname, stdio: 'pipe' }
  );
  console.log('Build successful!');
} catch (e) {
  console.error('Build failed:', e.message);
  console.error(e.stderr?.toString());
}