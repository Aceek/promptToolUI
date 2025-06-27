#!/bin/bash
echo "🛑 Arrêt de tous les services..."

# Arrêter et supprimer les conteneurs Docker
docker compose down

# Arrêter l'agent local
if [ -f "agent.pid" ]; then
  echo "- Arrêt de l'agent local..."
  kill $(cat agent.pid)
  rm agent.pid agent.log
fi

echo "✅ Environnement arrêté."
