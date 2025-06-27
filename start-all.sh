#!/bin/bash
echo "🚀 Démarrage de tous les services en arrière-plan..."

# Démarrer les conteneurs Docker en mode détaché
docker compose up -d --build

# Démarrer l'agent en arrière-plan, rediriger sa sortie vers un fichier de log et sauvegarder son PID
echo "- Démarrage de l'agent local..."
(cd file-system-agent && npm start > ../agent.log 2>&1 & echo $! > ../agent.pid)

echo "✅ Tous les services sont démarrés."
echo "   - Logs des conteneurs : docker compose logs -f"
echo "   - Logs de l'agent : tail -f agent.log"
