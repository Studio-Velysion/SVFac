# Sauvegarde du projet SVFac (sans node_modules, dist, installateur)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$parent = Split-Path -Parent $root
$folderName = Split-Path -Leaf $root
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$dest = Join-Path $parent "$folderName - backup $date"

Write-Host "Creation de la sauvegarde..." -ForegroundColor Cyan
Write-Host "Source: $root"
Write-Host "Destination: $dest"

& robocopy $root $dest /E /XD node_modules dist installateur .git /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
$exitCode = $LASTEXITCODE
# Robocopy: 0-7 = OK (fichiers copiés), 8+ = erreur
if ($exitCode -ge 8) {
    Write-Host "Erreur robocopy: $exitCode" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Backup terminee avec succes." -ForegroundColor Green
Write-Host "Dossier: $dest"
Write-Host ""
Write-Host "Pour restaurer: copiez le contenu de ce dossier vers '$folderName' puis lancez 'npm install'." -ForegroundColor Yellow
