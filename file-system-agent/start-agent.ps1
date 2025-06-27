# Script PowerShell de démarrage pour l'agent de système de fichiers
# Ce script compile et démarre l'agent avec les bonnes configurations

Write-Host "🚀 Démarrage de l'agent de système de fichiers..." -ForegroundColor Green

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Vérifier si npm est installé
try {
    $npmVersion = npm --version
    Write-Host "✅ npm détecté: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé. Veuillez l'installer d'abord." -ForegroundColor Red
    exit 1
}

# Se déplacer dans le répertoire de l'agent
Set-Location $PSScriptRoot

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
}

# Compiler le TypeScript
Write-Host "🔨 Compilation du TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la compilation" -ForegroundColor Red
    exit 1
}

# Démarrer l'agent
Write-Host "🎯 Démarrage de l'agent sur le port 4001..." -ForegroundColor Green
Write-Host "📁 L'agent est prêt à servir les fichiers du système local" -ForegroundColor Cyan
Write-Host "🛑 Appuyez sur Ctrl+C pour arrêter l'agent" -ForegroundColor Yellow
Write-Host ""

npm start