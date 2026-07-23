const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
  'utils.js', 'api.js', 'admin-core.js', 'admin-crud.js', 'admin-messages.js',
  'admin-tasacion-requests.js', 'admin-bajas.js', 'admin-dashboard.js', 'admin-settings.js', 'admin-users.js',
  'admin-portals.js',   'admin-shared.js', 'admin-appraisals.js', 'admin-tasaciones.js', 'admin-crm.js', 'admin-crm-tasks.js',
  'admin-requests.js', 'admin-marketing.js',   'admin-calendar.js', 'admin-security.js', 'push-subscribe.js',
];

const jsDir = path.join(__dirname, '..', 'js');
const tmpFile = path.join(__dirname, '..', 'js', '_admin-concat-tmp.js');

// Concatenate files
const output = files.map(f => fs.readFileSync(path.join(jsDir, f), 'utf-8')).join('\n');
fs.writeFileSync(tmpFile, output);

// Use esbuild for IIFE bundle (preserves window.* assignments, much faster than terser)
try {
  execSync(
    `npx --yes esbuild "${tmpFile}" --bundle --format=iife --minify-syntax --minify-whitespace ` +
    `--outfile="${path.join(jsDir, 'admin-bundle.min.js')}" --target=es2017`,
    { cwd: path.join(__dirname, '..'), stdio: 'pipe' }
  );
  // Also write unminified for dev
  execSync(
    `npx --yes esbuild "${tmpFile}" --bundle --format=iife ` +
    `--outfile="${path.join(jsDir, 'admin-bundle.js')}" --target=es2017`,
    { cwd: path.join(__dirname, '..'), stdio: 'pipe' }
  );
} finally {
  // Cleanup temp file
  try { fs.unlinkSync(tmpFile); } catch {}
}
