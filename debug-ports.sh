#!/bin/bash

echo "🔍 Diagnostic des ports et processus"
echo "===================================="

# Fonction pour afficher les processus sur un port
check_port() {
    local port=$1
    local service_name=$2
    
    echo ""
    echo "📡 Port $port ($service_name) :"
    echo "--------------------------------"
    
    PROCESSES=$(lsof -i :$port 2>/dev/null)
    if [ ! -z "$PROCESSES" ]; then
        echo "⚠️  Port occupé :"
        echo "$PROCESSES"
        
        # Extraire les PIDs
        PIDS=$(lsof -ti :$port 2>/dev/null)
        for pid in $PIDS; do
            echo "   📋 Détails du processus $pid :"
            ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null | sed 's/^/      /'
        done
    else
        echo "✅ Port libre"
    fi
}

# Vérifier les ports utilisés par le projet
check_port 3000 "Frontend"
check_port 3001 "Backend" 
check_port 4001 "Agent"
check_port 5432 "PostgreSQL"

echo ""
echo "🐳 Conteneurs Docker :"
echo "----------------------"
CONTAINERS=$(docker compose ps 2>/dev/null)
if [ ! -z "$CONTAINERS" ]; then
    echo "$CONTAINERS"
else
    echo "✅ Aucun conteneur actif"
fi

echo ""
echo "📁 Fichiers de processus :"
echo "---------------------------"
if [ -f "agent.pid" ]; then
    AGENT_PID=$(cat agent.pid)
    echo "📄 agent.pid : $AGENT_PID"
    if kill -0 "$AGENT_PID" 2>/dev/null; then
        echo "   ✅ Processus actif"
    else
        echo "   ❌ Processus mort (fichier obsolète)"
    fi
else
    echo "📄 agent.pid : absent"
fi

if [ -f "agent.log" ]; then
    echo "📄 agent.log : présent ($(wc -l < agent.log) lignes)"
    echo "   📋 Dernières lignes :"
    tail -5 agent.log | sed 's/^/      /'
else
    echo "📄 agent.log : absent"
fi

echo ""
echo "🔧 Actions recommandées :"
echo "-------------------------"

# Vérifier les conflits
CONFLICTS=false

if lsof -i :4001 >/dev/null 2>&1; then
    echo "⚠️  Port 4001 occupé - Exécuter : kill \$(lsof -ti :4001)"
    CONFLICTS=true
fi

if docker compose ps -q 2>/dev/null | grep -q .; then
    echo "⚠️  Conteneurs actifs - Exécuter : docker compose down"
    CONFLICTS=true
fi

if [ -f "agent.pid" ]; then
    AGENT_PID=$(cat agent.pid)
    if ! kill -0 "$AGENT_PID" 2>/dev/null; then
        echo "⚠️  Fichier PID obsolète - Exécuter : rm agent.pid agent.log"
        CONFLICTS=true
    fi
fi

if [ "$CONFLICTS" = false ]; then
    echo "✅ Aucun conflit détecté - Vous pouvez lancer ./start-dev.sh"
fi

echo ""
echo "🚀 Commandes de nettoyage rapide :"
echo "-----------------------------------"
echo "   ./stop-all.sh                    # Arrêter tout proprement"
echo "   kill \$(lsof -ti :4001) 2>/dev/null  # Forcer l'arrêt de l'agent"
echo "   docker compose down              # Arrêter les conteneurs"
echo "   rm -f agent.pid agent.log        # Nettoyer les fichiers"