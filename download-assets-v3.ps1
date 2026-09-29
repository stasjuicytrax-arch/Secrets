# SECRETS Lounge - download all assets from the old site into the working folder (v3).
# Run from the project folder:
#     powershell -ExecutionPolicy Bypass -File .\download-assets-v3.ps1
#
# v3: uses curl.exe with hard timeouts; probes static.tildacdn.com once and skips it
#     if it is unreachable from this network (falls back to thb.tildacdn.com).
#
# Output goes to .\assets\  (interior\, brand\, menu-pdf\, html\, MANIFEST.csv)
# NOTE: ASCII-only on purpose (Windows PowerShell 5.1 breaks on UTF-8 without BOM).

$ErrorActionPreference = 'Continue'

$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$assets = Join-Path $root 'assets'
$dInterior = Join-Path $assets 'interior'
$dBrand    = Join-Path $assets 'brand'
$dMenu     = Join-Path $assets 'menu-pdf'
$dHtml     = Join-Path $assets 'html'
foreach ($d in @($dInterior, $dBrand, $dMenu, $dHtml)) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36'
$manifest = New-Object System.Collections.Generic.List[object]

function Get-Asset {
    param([string]$Url, [string]$Out, [string]$Group, [int]$MaxTime = 45)

    $leaf = Split-Path $Out -Leaf

    if (Test-Path $Out) {
        if ((Get-Item $Out).Length -gt 2048) {
            Write-Host ('  = exists    ' + $leaf) -ForegroundColor DarkGray
            return $true
        }
        Remove-Item $Out -Force   # empty stub from an interrupted run
    }

    & curl.exe -sS -L --connect-timeout 8 -m $MaxTime -A $UA -o $Out $Url 2>$null
    $code = $LASTEXITCODE

    $ok = ($code -eq 0) -and (Test-Path $Out) -and ((Get-Item $Out).Length -gt 2048)
    if ($ok) {
        $kb = [math]::Round((Get-Item $Out).Length / 1KB)
        Write-Host ('  + {0,-40} {1,6} KB' -f $leaf, $kb) -ForegroundColor Green
        $manifest.Add([pscustomobject]@{ group = $Group; file = $leaf; kb = $kb; url = $Url })
        return $true
    }

    if (Test-Path $Out) { Remove-Item $Out -Force }
    Write-Host ('  - failed    ' + $leaf + ' (curl exit ' + $code + ')') -ForegroundColor DarkYellow
    return $false
}

# ---------------------------------------------------------------
# Probe: is static.tildacdn.com reachable from this network?
# ---------------------------------------------------------------
Write-Host ''
Write-Host '[0/4] Checking static.tildacdn.com ...' -ForegroundColor Cyan
& curl.exe -sS -I --connect-timeout 6 -m 8 -o NUL 'https://static.tildacdn.com/tild3835-3130-4238-a433-386263383834/DSC01841m.jpg' 2>$null
$staticOk = ($LASTEXITCODE -eq 0)
if ($staticOk) {
    Write-Host '  static reachable: originals will be tried first' -ForegroundColor Green
} else {
    Write-Host '  static NOT reachable: using thb.tildacdn.com only' -ForegroundColor Yellow
}

# ---------------------------------------------------------------
# 1. Interior gallery - 20 photos
# ---------------------------------------------------------------
Write-Host ''
Write-Host '[1/4] Interior' -ForegroundColor Cyan

$interior = @(
    'tild3235-6139-4966-b732-386665646235/_1.jpg',
    'tild3139-6439-4162-b939-373262613561/_3.jpg',
    'tild6639-6634-4633-b333-313261626232/_4.jpg',
    'tild6561-3539-4230-a362-363463373330/_2.jpg',
    'tild6266-3234-4531-b038-353233336337/photo.jpg',
    'tild3635-3139-4731-a463-363433626333/photo.jpg',
    'tild3965-3039-4635-b830-393933666131/photo.jpg',
    'tild3463-3761-4562-b338-633036323264/photo.jpg',
    'tild6631-3735-4839-a636-313136303139/photo.jpg',
    'tild3165-6232-4839-a466-336431613863/photo.jpg',
    'tild3364-6162-4864-b961-346131666433/photo.jpg',
    'tild6430-6634-4936-a136-336334356339/photo.jpg',
    'tild3636-6437-4935-a666-353561353661/photo.jpg',
    'tild3862-3265-4731-b536-316631626333/photo.jpg',
    'tild6464-3836-4633-b734-666132613362/_1_-____compressed.jpg',
    'tild6230-3938-4038-b564-646139396165/___compressed.jpg',
    'tild6264-3234-4434-b336-626636386338/_2_-___compressed.jpg',
    'tild6666-3863-4935-b736-613265303163/_3_-___compressed.jpg',
    'tild3666-6265-4561-a530-323631303937/_4_-__-__compressed.jpg',
    'tild3064-3636-4532-a561-643635353831/_.jpg'
)

$i = 0
foreach ($path in $interior) {
    $i++
    $name = 'interior-{0:d2}.jpg' -f $i
    $out  = Join-Path $dInterior $name
    $ok = $false
    if ($staticOk) {
        $ok = Get-Asset ('https://static.tildacdn.com/' + $path) $out 'interior' 30
    }
    if (-not $ok) {
        Get-Asset ('https://thb.tildacdn.com/' + $path) $out 'interior-thumb' 45 | Out-Null
    }
}

# ---------------------------------------------------------------
# 2. Logo, icon, OG image
# ---------------------------------------------------------------
Write-Host ''
Write-Host '[2/4] Brand' -ForegroundColor Cyan

$brandItems = @(
    @('logo.png', 'tild6335-6436-4534-b236-356437663338/Logo.png'),
    @('icon.svg', 'tild6362-6662-4634-b166-663231613364/5f63be9718732c120852.svg'),
    @('og.jpg',   'tild3835-3130-4238-a433-386263383834/DSC01841m.jpg')
)
foreach ($b in $brandItems) {
    $out = Join-Path $dBrand $b[0]
    $ok = $false
    if ($staticOk) { $ok = Get-Asset ('https://static.tildacdn.com/' + $b[1]) $out 'brand' 30 }
    if (-not $ok)  { Get-Asset ('https://thb.tildacdn.com/' + $b[1]) $out 'brand' 30 | Out-Null }
}

# ---------------------------------------------------------------
# 3. Menu PDFs from Google Drive
# ---------------------------------------------------------------
Write-Host ''
Write-Host '[3/4] Menu (PDF)' -ForegroundColor Cyan

$driveIds = @(
    '1reR5s5XqpJzKkV4sVbMx9R2jAPKaVdC8',
    '1DLQKW7gexurof_5DFajMpNvGwfa9C1ts',
    '167o4cL-HeDcuk-AK3Gtf_mc1r2ySpd1_',
    '1uwHZk0eFi16YB7_Zrm2iEJmsz6-KWn4u',
    '1ILqyyKQH1yEpAnYlYBqhwGDJ-Jf1xK7Y'
)
$n = 0
foreach ($id in $driveIds) {
    $n++
    $out = Join-Path $dMenu ('menu-{0}.pdf' -f $n)
    Get-Asset ('https://drive.google.com/uc?export=download&id=' + $id) $out 'menu' 60 | Out-Null
}

# ---------------------------------------------------------------
# 4. HTML of the old site
# ---------------------------------------------------------------
Write-Host ''
Write-Host '[4/4] HTML' -ForegroundColor Cyan

Get-Asset 'https://secretslounge.ru/'     (Join-Path $dHtml 'index.html') 'html' 30 | Out-Null
Get-Asset 'https://secretslounge.ru/menu' (Join-Path $dHtml 'menu.html')  'html' 30 | Out-Null

# ---------------------------------------------------------------
# Summary
# ---------------------------------------------------------------
$manifestPath = Join-Path $assets 'MANIFEST.csv'
$manifest | Export-Csv -Path $manifestPath -NoTypeInformation -Encoding UTF8

$total = 0
foreach ($m in $manifest) { $total += $m.kb }
$mb = [math]::Round($total / 1024, 1)

$photos = @(Get-ChildItem $dInterior -Filter *.jpg -ErrorAction SilentlyContinue).Count
$pdfs   = @(Get-ChildItem $dMenu -Filter *.pdf -ErrorAction SilentlyContinue).Count

Write-Host ''
Write-Host '--------------------------------------------'
Write-Host ('This run:  {0} files ({1} MB)' -f $manifest.Count, $mb) -ForegroundColor Cyan
Write-Host ('In folder: {0}/20 interior photos, {1}/5 menu PDFs' -f $photos, $pdfs)
Write-Host ('Folder:    ' + $assets)
Write-Host ('Manifest:  ' + $manifestPath)

$thumbs = @($manifest | Where-Object { $_.group -eq 'interior-thumb' }).Count
if ($thumbs -gt 0) {
    Write-Host ''
    Write-Host ('NOTE: {0} photos came from thb (compressed previews).' -f $thumbs) -ForegroundColor Yellow
    Write-Host 'Ask the client for camera originals for the full-width gallery.' -ForegroundColor Yellow
}
