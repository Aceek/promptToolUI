# AI Prompt Tool v2

Une application web moderne pour construire des prompts complexes pour les LLMs en analysant des projets locaux.

## 🚀 Fonctionnalités

- **Interface Web Moderne** : Interface utilisateur intuitive construite avec React et TypeScript
- **Base de Données** : Stockage persistant avec PostgreSQL et Prisma ORM
- **Temps Réel** : Surveillance automatique des changements de fichiers avec WebSockets
- **Gestion des Workspaces** : Organisation par projets avec configurations personnalisées
- **Formats Personnalisables** : Définition de formats de réponse pour les LLMs
- **Rôles et Personas** : Configuration de différents rôles d'expertise
- **Patterns d'Exclusion** : Filtrage intelligent des fichiers
- **Génération de Prompts** : Assemblage automatique de contexte complet

## 🏗️ Architecture

### Backend (TypeScript + Fastify)
- **API REST** : Endpoints pour toutes les opérations CRUD
- **WebSockets** : Communication temps réel avec Socket.IO
- **Base de Données** : PostgreSQL avec Prisma ORM
- **Services** :
  - Génération de structure de projet
  - Génération de prompts avec templates Nunjucks
  - Surveillance de fichiers avec Chokidar

### Frontend (React + TypeScript)
- **Interface Moderne** : React avec Vite et Tailwind CSS
- **Gestion d'État** : Zustand pour la gestion d'état
- **Temps Réel** : Intégration WebSocket
- **Routing** : React Router pour la navigation

## 🛠️ Installation et Démarrage

### Prérequis
- Docker et Docker Compose
- Node.js 18+ (pour le développement local)

### Démarrage avec Docker

1. **Cloner le projet**
```bash
git clone <repository-url>
cd ai-prompt-tool-v2
```

2. **Démarrer tous les services**
```bash
docker-compose up -d
```

3. **Initialiser la base de données**
```bash
# Attendre que PostgreSQL soit prêt, puis :
docker-compose exec backend npm run db:push
docker-compose exec backend npm run db:seed
```

4. **Accéder à l'application**
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001
- Base de données : localhost:5432

### Développement Local

1. **Backend**
```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 📁 Structure du Projet

```
ai-prompt-tool-v2/
├── backend/                 # API Backend (TypeScript + Fastify)
│   ├── src/
│   │   ├── routes/         # Endpoints API
│   │   ├── services/       # Logique métier
│   │   ├── index.ts        # Point d'entrée
│   │   └── seed.ts         # Données initiales
│   ├── prisma/
│   │   └── schema.prisma   # Schéma de base de données
│   └── package.json
├── frontend/               # Interface Web (React + TypeScript)
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API et WebSocket
│   │   ├── store/          # Gestion d'état Zustand
│   │   └── main.tsx        # Point d'entrée
│   └── package.json
├── docker-compose.yml      # Configuration Docker
└── README.md
```

## 🎯 Utilisation

### 1. Créer un Workspace
- Aller dans "Settings > Workspaces"
- Créer un nouveau workspace avec le chemin vers votre projet
- Configurer les patterns d'exclusion si nécessaire

### 2. Configurer les Formats et Rôles
- **Formats** : Définir comment l'IA doit structurer sa réponse
- **Rôles** : Définir l'expertise et le persona de l'IA

### 3. Générer un Prompt
- Sélectionner un workspace actif
- Choisir les fichiers à inclure dans l'arbre de fichiers
- Écrire votre requête finale
- Sélectionner un format et un rôle
- Générer le prompt complet

### 4. Surveillance Temps Réel
- L'arbre de fichiers se met à jour automatiquement
- Les changements dans le projet sont détectés en temps réel

## 🔧 Configuration

### Variables d'Environnement

**Backend (.env)**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_prompt_tool
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
```

### Patterns d'Exclusion par Défaut

Le système exclut automatiquement :
- Fichiers binaires (images, vidéos, archives)
- Dossiers de dépendances (node_modules, venv)
- Fichiers de build (dist, build, coverage)
- Fichiers système (.git, .DS_Store)
- Fichiers temporaires (*.tmp, *.log)

## 🚀 Migration depuis v1

Les données de l'ancien projet peuvent être migrées :

1. **Formats** : Les fichiers `config/formats/*.txt` sont convertis en entrées de base de données
2. **Configurations** : Les fichiers YAML sont remplacés par des workspaces
3. **Logique** : La logique Python est portée en TypeScript

## 🛠️ Développement

### Scripts Utiles

**Backend**
```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build de production
npm run db:generate  # Générer le client Prisma
npm run db:push      # Pousser le schéma vers la DB
npm run db:seed      # Initialiser les données
npm run db:studio    # Interface Prisma Studio
```

**Frontend**
```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
```

### API Endpoints

- `GET /api/workspaces` - Liste des workspaces
- `POST /api/workspaces` - Créer un workspace
- `GET /api/formats` - Liste des formats
- `GET /api/roles` - Liste des rôles
- `GET /api/settings` - Paramètres globaux
- `POST /api/prompt/generate` - Générer un prompt
- `GET /api/prompt/workspaces/:id/structure` - Structure de fichiers

## 📝 Licence

MIT License - voir le fichier LICENSE pour plus de détails.