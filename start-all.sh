#!/bin/bash

# Fonction de nettoyage pour les erreurs
cleanup_on_error() {
    echo "❌ [DEBUG] Erreur détectée - Nettoyage en cours..."
    
    # Arrêter l'agent s'il existe
    if [ -f "agent.pid" ]; then
        AGENT_PID=$(cat agent.pid)
        if kill -0 "$AGENT_PID" 2>/dev/null; then
            echo "🛑 [DEBUG] Arrêt de l'agent (PID: $AGENT_PID)..."
            kill -TERM "$AGENT_PID" 2>/dev/null
            sleep 2
            if kill -0 "$AGENT_PID" 2>/dev/null; then
                kill -KILL "$AGENT_PID" 2>/dev/null
            fi
        fi
        rm -f agent.pid agent.log
    fi
    
    # Arrêter Docker Compose
    echo "🐳 [DEBUG] Arrêt des conteneurs Docker..."
    docker compose down
    
    exit 1
}

# Gestionnaire d'erreurs
trap cleanup_on_error ERR

echo "🚀 Démarrage de tous les services en arrière-plan..."

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi
echo "✅ Docker est prêt."

# Nettoyer les anciens fichiers de processus
if [ -f "agent.pid" ]; then
    OLD_PID=$(cat agent.pid)
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "🛑 [DEBUG] Arrêt de l'ancien agent (PID: $OLD_PID)..."
        kill -TERM "$OLD_PID" 2>/dev/null
        sleep 2
        if kill -0 "$OLD_PID" 2>/dev/null; then
            kill -KILL "$OLD_PID" 2>/dev/null
        fi
    fi
    rm -f agent.pid agent.log
fi

# Démarrer les conteneurs Docker en mode détaché
echo "🐳 [DEBUG] Démarrage des conteneurs Docker en mode détaché..."
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du démarrage des conteneurs Docker"
    exit 1
fi

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services Docker..."
sleep 5

# Vérifier que les conteneurs sont bien démarrés
RUNNING_CONTAINERS=$(docker compose ps -q --status running)
if [ -z "$RUNNING_CONTAINERS" ]; then
    echo "❌ Aucun conteneur n'est en cours d'exécution"
    cleanup_on_error
fi

# Démarrer l'agent en arrière-plan avec gestion d'erreurs améliorée
echo "🤖 [DEBUG] Démarrage de l'agent local..."
cd file-system-agent

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances de l'agent..."
    npm install
fi

# Compiler si nécessaire
if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
    echo "🔨 Compilation de l'agent..."
    npm run build
fi

# Démarrer l'agent et capturer son PID
npm start > ../agent.log 2>&1 &
AGENT_PID=$!
echo $AGENT_PID > ../agent.pid
cd ..

# Vérifier que l'agent a bien démarré
sleep 3
if ! kill -0 "$AGENT_PID" 2>/dev/null; then
    echo "❌ L'agent n'a pas pu démarrer. Vérifiez agent.log pour plus de détails."
    echo "📋 Dernières lignes du log de l'agent :"
    tail -10 agent.log
    cleanup_on_error
fi

echo "✅ Tous les services sont démarrés."
echo "🔍 [DEBUG] Agent PID: $AGENT_PID"
echo "📊 Services actifs :"
echo "   - Conteneurs Docker : $(docker compose ps --format 'table {{.Service}}\t{{.Status}}' | tail -n +2 | wc -l) services"
echo "   - Agent local : PID $AGENT_PID"
echo ""
echo "📋 Commandes utiles :"
echo "   - Logs des conteneurs : docker compose logs -f"
echo "   - Logs de l'agent : tail -f agent.log"
echo "   - Statut des services : docker compose ps"
echo "   - Arrêter tout : ./stop-all.sh"
