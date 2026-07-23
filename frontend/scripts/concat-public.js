const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
  'filters.js', 'tabs.js', 'skeleton.js', 'contact.js', 'main.js',
];

const jsDir = path.join(__dirname, '..', 'js');
const tmpFile = path.join(__dirname, '..', 'js', '_public-concat-tmp.js');

const output = files.map(f => fs.readFileSync(path.join(jsDir, f), 'utf-8')).join('\n');
fs.writeFileSync(tmpFile, output);

try {
  execSync(
    `npx --yes esbuild "${tmpFile}" --bundle --format=iife --minify-syntax --minify-whitespace ` +
    `--outfile="${path.join(jsDir, 'main.min.js')}" --target=es2017`,
    { cwd: path.join(__dirname, '..'), stdio: 'pipe' }
  );
  // Unminified for dev
  execSync(
    `npx --yes esbuild "${tmpFile}" --bundle --format=iife ` +
    `--outfile="${path.join(jsDir, 'main.bundle.js')}" --target=es2017`,
    { cwd: path.join(__dirname, '..'), stdio: 'pipe' }
  );
} finally {
  try { fs.unlinkSync(tmpFile); } catch {}
}
