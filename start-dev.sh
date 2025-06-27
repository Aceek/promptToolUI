#!/bin/bash

# Variables pour le suivi des processus
DOCKER_PID=""
AGENT_PID=""
CLEANUP_DONE=false

echo "🚀 Démarrage de l'environnement de développement complet..."

# Fonction de nettoyage
cleanup() {
    if [ "$CLEANUP_DONE" = true ]; then
        return
    fi
    CLEANUP_DONE=true
    
    echo ""
    echo "🧹 [DEBUG] Signal d'arrêt reçu - Nettoyage en cours..."
    
    # Arrêter l'agent en premier
    if [ ! -z "$AGENT_PID" ] && kill -0 "$AGENT_PID" 2>/dev/null; then
        echo "🛑 [DEBUG] Arrêt de l'agent (PID: $AGENT_PID)..."
        kill -TERM "$AGENT_PID" 2>/dev/null
        sleep 2
        if kill -0 "$AGENT_PID" 2>/dev/null; then
            echo "⚠️  [DEBUG] Arrêt forcé de l'agent..."
            kill -KILL "$AGENT_PID" 2>/dev/null
        fi
    fi
    
    # Arrêter Docker Compose
    echo "🐳 [DEBUG] Arrêt des conteneurs Docker..."
    docker compose down --timeout 10
    
    # Vérifier que tous les conteneurs sont arrêtés
    RUNNING_CONTAINERS=$(docker compose ps -q)
    if [ ! -z "$RUNNING_CONTAINERS" ]; then
        echo "⚠️  [DEBUG] Arrêt forcé des conteneurs restants..."
        docker compose kill
        docker compose down
    fi
    
    echo "✅ [DEBUG] Nettoyage terminé."
    echo "👋 Environnement arrêté proprement."
}

# Gestionnaire de signaux
trap 'echo "🔍 [DEBUG] SIGINT reçu"; cleanup; exit 0' SIGINT
trap 'echo "🔍 [DEBUG] SIGTERM reçu"; cleanup; exit 0' SIGTERM

# Étape 1: Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
  exit 1
fi
echo "✅ Docker est prêt."

# Étape 1.5: Nettoyer les processus existants
echo "🧹 [DEBUG] Vérification des processus existants..."

# Vérifier si le port 4001 est occupé
EXISTING_AGENT=$(lsof -ti :4001 2>/dev/null)
if [ ! -z "$EXISTING_AGENT" ]; then
    echo "🛑 [DEBUG] Agent existant détecté sur le port 4001 (PID: $EXISTING_AGENT)"
    echo "🔄 [DEBUG] Arrêt de l'agent existant..."
    kill -TERM "$EXISTING_AGENT" 2>/dev/null
    sleep 2
    if kill -0 "$EXISTING_AGENT" 2>/dev/null; then
        echo "⚠️  [DEBUG] Arrêt forcé de l'agent existant..."
        kill -KILL "$EXISTING_AGENT" 2>/dev/null
    fi
    echo "✅ [DEBUG] Agent existant arrêté"
fi

# Nettoyer les conteneurs existants
EXISTING_CONTAINERS=$(docker compose ps -q 2>/dev/null)
if [ ! -z "$EXISTING_CONTAINERS" ]; then
    echo "🐳 [DEBUG] Conteneurs existants détectés, nettoyage..."
    docker compose down --timeout 5 2>/dev/null
    echo "✅ [DEBUG] Conteneurs existants arrêtés"
fi

# Étape 2: S'assurer que les conteneurs sont construits et à jour
echo "🏗️  Construction/Mise à jour des conteneurs Docker..."
docker compose build

# Étape 3: Démarrer Docker Compose en arrière-plan
echo "🐳 [DEBUG] Démarrage des conteneurs Docker..."
docker compose up &
DOCKER_PID=$!
echo "🔍 [DEBUG] Docker Compose PID: $DOCKER_PID"

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 5

# Étape 4: Démarrer l'agent
echo "🤖 [DEBUG] Démarrage de l'agent..."
cd file-system-agent

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 [DEBUG] Installation des dépendances de l'agent..."
    npm install
fi

# Compiler si nécessaire
if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
    echo "🔨 [DEBUG] Compilation de l'agent..."
    npm run build
fi

npm run dev &
AGENT_PID=$!
cd ..
echo "🔍 [DEBUG] Agent PID: $AGENT_PID"

# Vérifier que l'agent a bien démarré
sleep 3
if ! kill -0 "$AGENT_PID" 2>/dev/null; then
    echo "❌ [DEBUG] L'agent n'a pas pu démarrer correctement"
    echo "🔍 [DEBUG] Vérification du port 4001..."
    CONFLICTING_PROCESS=$(lsof -ti :4001 2>/dev/null)
    if [ ! -z "$CONFLICTING_PROCESS" ]; then
        echo "⚠️  [DEBUG] Le port 4001 est encore occupé par le processus $CONFLICTING_PROCESS"
    fi
    cleanup
    exit 1
fi

# Vérifier que l'agent écoute bien sur le port 4001
sleep 2
if ! lsof -i :4001 >/dev/null 2>&1; then
    echo "❌ [DEBUG] L'agent ne semble pas écouter sur le port 4001"
    cleanup
    exit 1
fi

echo "✅ [DEBUG] Agent démarré avec succès sur le port 4001"

echo ""
echo "🔥 Tous les services sont démarrés avec monitoring unifié..."
echo "🛑 Appuyez sur Ctrl+C dans ce terminal pour tout arrêter proprement."
echo "🔍 [DEBUG] PIDs surveillés - Docker: $DOCKER_PID, Agent: $AGENT_PID"
echo ""

# Attendre que l'un des processus se termine
wait $DOCKER_PID $AGENT_PID

# Si on arrive ici, un des processus s'est terminé
echo "⚠️  [DEBUG] Un processus s'est terminé de manière inattendue"
cleanup
