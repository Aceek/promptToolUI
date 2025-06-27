#!/bin/bash

# Script de démarrage pour l'agent de système de fichiers
# Ce script compile et démarre l'agent avec les bonnes configurations

echo "🚀 Démarrage de l'agent de système de fichiers..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Se déplacer dans le répertoire de l'agent
cd "$(dirname "$0")"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Compiler le TypeScript
echo "🔨 Compilation du TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la compilation"
    exit 1
fi

# Démarrer l'agent
echo "🎯 Démarrage de l'agent sur le port 4001..."
echo "📁 L'agent est prêt à servir les fichiers du système local"
echo "🛑 Appuyez sur Ctrl+C pour arrêter l'agent"
echo ""

npm start