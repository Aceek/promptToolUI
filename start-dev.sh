#!/bin/bash

echo "🚀 Démarrage de l'environnement de développement complet..."

# Étape 1: Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
  exit 1
fi
echo "✅ Docker est prêt."

# Étape 2: S'assurer que les conteneurs sont construits et à jour
echo "🏗️  Construction/Mise à jour des conteneurs Docker..."
docker compose build

# Étape 3: Lancer tous les services (conteneurs + agent) en parallèle avec des logs unifiés
echo "🔥 Lancement de tous les services avec monitoring unifié..."
echo "🛑 Appuyez sur Ctrl+C dans ce terminal pour tout arrêter proprement."

npm run start

echo "👋 Environnement arrêté."
