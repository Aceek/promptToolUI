#!/bin/bash

echo "🛑 Arrêt de tous les services..."

# Fonction pour arrêter l'agent proprement
stop_agent() {
    if [ -f "agent.pid" ]; then
        AGENT_PID=$(cat agent.pid)
        echo "🤖 [DEBUG] Arrêt de l'agent local (PID: $AGENT_PID)..."
        
        # Vérifier si le processus existe encore
        if kill -0 "$AGENT_PID" 2>/dev/null; then
            # Tentative d'arrêt gracieux
            echo "🔍 [DEBUG] Envoi du signal SIGTERM à l'agent..."
            kill -TERM "$AGENT_PID" 2>/dev/null
            
            # Attendre jusqu'à 5 secondes pour un arrêt gracieux
            for i in {1..5}; do
                if ! kill -0 "$AGENT_PID" 2>/dev/null; then
                    echo "✅ [DEBUG] Agent arrêté gracieusement"
                    break
                fi
                echo "⏳ [DEBUG] Attente de l'arrêt de l'agent... ($i/5)"
                sleep 1
            done
            
            # Si le processus existe encore, forcer l'arrêt
            if kill -0 "$AGENT_PID" 2>/dev/null; then
                echo "⚠️  [DEBUG] Arrêt forcé de l'agent..."
                kill -KILL "$AGENT_PID" 2>/dev/null
                sleep 1
                
                if kill -0 "$AGENT_PID" 2>/dev/null; then
                    echo "❌ [DEBUG] Impossible d'arrêter l'agent (PID: $AGENT_PID)"
                else
                    echo "✅ [DEBUG] Agent arrêté de force"
                fi
            fi
        else
            echo "ℹ️  [DEBUG] L'agent n'était pas en cours d'exécution"
        fi
        
        # Nettoyer les fichiers
        rm -f agent.pid
        if [ -f "agent.log" ]; then
            echo "🗑️  [DEBUG] Suppression du fichier de log de l'agent"
            rm -f agent.log
        fi
    else
        echo "ℹ️  [DEBUG] Aucun fichier PID d'agent trouvé"
    fi
}

# Fonction pour arrêter Docker Compose proprement
stop_docker() {
    echo "🐳 [DEBUG] Arrêt des conteneurs Docker..."
    
    # Vérifier s'il y a des conteneurs en cours d'exécution
    RUNNING_CONTAINERS=$(docker compose ps -q --status running 2>/dev/null)
    
    if [ ! -z "$RUNNING_CONTAINERS" ]; then
        echo "🔍 [DEBUG] Conteneurs actifs détectés, arrêt en cours..."
        
        # Arrêt gracieux avec timeout
        docker compose down --timeout 10
        
        # Vérifier si des conteneurs sont encore en cours d'exécution
        STILL_RUNNING=$(docker compose ps -q --status running 2>/dev/null)
        
        if [ ! -z "$STILL_RUNNING" ]; then
            echo "⚠️  [DEBUG] Certains conteneurs ne se sont pas arrêtés, arrêt forcé..."
            docker compose kill
            docker compose down --remove-orphans
        else
            echo "✅ [DEBUG] Tous les conteneurs Docker arrêtés gracieusement"
        fi
    else
        echo "ℹ️  [DEBUG] Aucun conteneur Docker en cours d'exécution"
        # Nettoyer quand même au cas où
        docker compose down --remove-orphans 2>/dev/null
    fi
}

# Arrêter l'agent en premier
stop_agent

# Arrêter Docker Compose
stop_docker

# Vérification finale
echo "🔍 [DEBUG] Vérification finale..."

# Vérifier les processus restants
REMAINING_PROCESSES=$(ps aux | grep -E "(npm|node|fastify)" | grep -v grep | wc -l)
if [ "$REMAINING_PROCESSES" -gt 0 ]; then
    echo "⚠️  [DEBUG] $REMAINING_PROCESSES processus Node.js/npm encore actifs"
    echo "📋 Processus restants :"
    ps aux | grep -E "(npm|node|fastify)" | grep -v grep
fi

# Vérifier les conteneurs Docker
REMAINING_CONTAINERS=$(docker compose ps -q 2>/dev/null | wc -l)
if [ "$REMAINING_CONTAINERS" -gt 0 ]; then
    echo "⚠️  [DEBUG] $REMAINING_CONTAINERS conteneurs encore présents"
    docker compose ps
fi

echo "✅ Environnement arrêté."
echo "📊 Résumé :"
echo "   - Agent local : arrêté"
echo "   - Conteneurs Docker : arrêtés"
echo "   - Fichiers temporaires : nettoyés"
