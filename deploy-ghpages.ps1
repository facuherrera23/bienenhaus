<#
  ⚠️ DEPRECATED — Use GitHub Actions instead (`.github/workflows/deploy-frontend.yml`)
  On push to `main`, the frontend is automatically deployed to GitHub Pages
  at https://facuherrera23.github.io/bienenhaus/
#>
$ErrorActionPreference = 'Stop'
$src  = Join-Path $PSScriptRoot 'frontend'
$dest = 'C:\Users\facuh\Desktop\Dlicias APP\bienenhaus-landing'

Write-Host "⚠️  DEPRECATED — Use GitHub Actions workflow instead" -ForegroundColor Yellow
Write-Host "=== Deploy Bienenhaus Landing to GH Pages ===" -ForegroundColor Cyan

# 1. Remove old (keep .git) and copy fresh
if (Test-Path $dest) {
    Get-ChildItem -Path $dest -Exclude '.git' | Remove-Item -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $dest | Out-Null
}
Get-ChildItem -Path $src -Exclude node_modules,test-results,tests,package*.json,postcss.config.js |
    Copy-Item -Destination $dest -Recurse -Force
Write-Host "Files copied." -ForegroundColor Green

# 2. Transform paths in HTML files for GH Pages subpath
$htmlFiles = Get-ChildItem -Path $dest -Filter '*.html' -Recurse | Select-Object -ExpandProperty FullName

# Order matters: more specific patterns first
$replacements = @(
    # 1. Static assets (CSS, JS, images, manifest, favicons)
    @{ Pattern = 'href="/css/';          Replacement = 'href="/bienenhaus-landing/css/' }
    @{ Pattern = 'href="/js/';           Replacement = 'href="/bienenhaus-landing/js/' }
    @{ Pattern = 'href="/images/';       Replacement = 'href="/bienenhaus-landing/images/' }
    @{ Pattern = 'href="/manifest.json'; Replacement = 'href="/bienenhaus-landing/manifest.json' }
    @{ Pattern = 'href="/favicon';       Replacement = 'href="/bienenhaus-landing/favicon' }
    @{ Pattern = 'src="/js/';            Replacement = 'src="/bienenhaus-landing/js/' }
    @{ Pattern = 'src="/images/';        Replacement = 'src="/bienenhaus-landing/images/' }
    # 2. Navigation links: /venta, /alquiler, /admin (but NOT /venta.html, etc.)
    @{ Pattern = 'href="/venta(?=[">\s])';       Replacement = 'href="/bienenhaus-landing/venta' }
    @{ Pattern = 'href="/alquiler(?=[">\s])';    Replacement = 'href="/bienenhaus-landing/alquiler' }
    @{ Pattern = 'href="/admin(?=[">\s])';       Replacement = 'href="/bienenhaus-landing/admin' }
    # 3. Fragment links (/#quienes, /#agents, /#contact, /#tasacion, /#servicios, etc.)
    @{ Pattern = 'href="/#(?=[a-z])';            Replacement = 'href="/bienenhaus-landing/#' }
    @{ Pattern = 'location\.href="/#tasacion"';  Replacement = 'location.href="/bienenhaus-landing/#tasacion"' }
    @{ Pattern = 'url=/+#tasacion';              Replacement = 'url=/bienenhaus-landing/#tasacion' }
    # 4. 404 redirect paths (must be inside JS strings)
    @{ Pattern = "'/propiedad.html'";  Replacement = "'/bienenhaus-landing/propiedad.html'" }
    @{ Pattern = "'/venta.html'";      Replacement = "'/bienenhaus-landing/venta.html'" }
    @{ Pattern = "'/alquiler.html'";   Replacement = "'/bienenhaus-landing/alquiler.html'" }
    # 5. Root href="/" (standalone, not preceded by other replacements)
    @{ Pattern = 'href="/"';           Replacement = 'href="/bienenhaus-landing/"' }
)

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    $changed = $false
    foreach ($r in $replacements) {
        if ($content -match $r.Pattern) {
            $content = $content -replace $r.Pattern, $r.Replacement
            $changed = $true
        }
    }
    if ($changed) {
        [System.IO.File]::WriteAllText($file, $content)
        Write-Host "  Patched: $((Get-Item $file).Name)" -ForegroundColor Yellow
    }
}

# 3. Fix CSS url() paths for GH Pages subpath
$cssFiles = Get-ChildItem -Path $dest -Filter '*.css' -Recurse | Select-Object -ExpandProperty FullName
$cssReplacements = @(
    @{ Pattern = "url\('/images/";       Replacement = "url('/bienenhaus-landing/images/" }
    @{ Pattern = 'url\("/images/';       Replacement = 'url("/bienenhaus-landing/images/' }
    @{ Pattern = "url\(/images/";        Replacement = "url(/bienenhaus-landing/images/" }
    @{ Pattern = "url\('/css/";          Replacement = "url('/bienenhaus-landing/css/" }
    @{ Pattern = 'url\("/css/';          Replacement = 'url("/bienenhaus-landing/css/' }
    @{ Pattern = "url\(/css/";           Replacement = "url(/bienenhaus-landing/css/" }
)
foreach ($file in $cssFiles) {
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    $changed = $false
    foreach ($r in $cssReplacements) {
        if ($content -match $r.Pattern) {
            $content = $content -replace $r.Pattern, $r.Replacement
            $changed = $true
        }
    }
    if ($changed) {
        [System.IO.File]::WriteAllText($file, $content)
        Write-Host "  Patched CSS: $((Get-Item $file).Name)" -ForegroundColor Yellow
    }
}

# 4. Fix JS href paths for GH Pages subpath (property detail links)
$jsFiles = Get-ChildItem -Path $dest -Filter '*.js' -Recurse | Select-Object -ExpandProperty FullName
$jsHrefReplacements = @(
    @{ Pattern = 'href="/venta/';       Replacement = 'href="/bienenhaus-landing/venta/' }
    @{ Pattern = 'href="/alquiler/';    Replacement = 'href="/bienenhaus-landing/alquiler/' }
)
foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    $changed = $false
    foreach ($r in $jsHrefReplacements) {
        if ($content -match $r.Pattern) {
            $content = $content -replace $r.Pattern, $r.Replacement
            $changed = $true
        }
    }
    if ($changed) {
        [System.IO.File]::WriteAllText($file, $content)
        Write-Host "  Patched JS href: $((Get-Item $file).Name)" -ForegroundColor Yellow
    }
}

# 5. Inject/replace API_BASE for GH Pages (points to Render)
$apiBaseValue = 'https://bienenhaus.onrender.com'
$injectScript = "<script>window.__API_BASE__='$apiBaseValue'</script>"
foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    if ($content -match "window\.__API_BASE__\s*=\s*'[^']*'") {
        $content = $content -replace "window\.__API_BASE__\s*=\s*'[^']*'", "window.__API_BASE__='$apiBaseValue'"
        [System.IO.File]::WriteAllText($file, $content)
        Write-Host "  Patched API_BASE: $((Get-Item $file).Name)" -ForegroundColor Yellow
    } elseif ($content -notmatch 'window\.__API_BASE__') {
        $content = $content -replace '</head>', "  $injectScript`r`n</head>"
        [System.IO.File]::WriteAllText($file, $content)
        Write-Host "  Injected API_BASE: $((Get-Item $file).Name)" -ForegroundColor Yellow
    }
}

Write-Host "=== Deploy ready at $dest ===" -ForegroundColor Cyan
Write-Host "Run: git -C '$dest' add -A && git -C '$dest' commit -m 'deploy' && git -C '$dest' push origin main" -ForegroundColor Cyan
