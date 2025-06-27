# Agent de Système de Fichiers

Agent local léger pour permettre l'accès au système de fichiers depuis des conteneurs Docker isolés.

## Description

Cet agent résout le problème d'isolation des conteneurs Docker en fournissant un pont sécurisé entre le backend containerisé et le système de fichiers de la machine hôte. Au lieu que le backend essaie d'accéder directement aux fichiers (ce qui est impossible dans un conteneur isolé), il délègue cette responsabilité à cet agent qui s'exécute directement sur la machine hôte.

## Fonctionnalités

- **Analyse de structure** : Génère l'arborescence complète d'un répertoire
- **Lecture de fichiers** : Lit le contenu de plusieurs fichiers en une seule requête
- **Filtrage intelligent** : Support des patterns d'exclusion (comme `.gitignore`)
- **API REST simple** : Interface HTTP claire et documentée
- **Gestion d'erreurs robuste** : Gestion appropriée des erreurs d'accès aux fichiers
- **CORS configuré** : Prêt pour l'intégration avec des applications web

## Installation

```bash
# Installer les dépendances
npm install

# Compiler le TypeScript
npm run build

# Démarrer l'agent
npm start
```

## Développement

```bash
# Mode développement avec rechargement automatique
npm run dev
```

## Configuration

L'agent peut être configuré via des variables d'environnement :

- `AGENT_PORT` : Port d'écoute (défaut: 4001)
- `AGENT_HOST` : Adresse d'écoute (défaut: 0.0.0.0)
- `CORS_ORIGINS` : Origines CORS autorisées, séparées par des virgules (défaut: *)

## API

### GET /status
Vérifie si l'agent est en cours d'exécution.

**Réponse :**
```json
{
  "status": "running"
}
```

### GET /structure
Analyse un répertoire et retourne sa structure arborescente.

**Paramètres de requête :**
- `path` (requis) : Chemin absolu du répertoire à analyser
- `ignorePatterns` (optionnel) : Patterns à ignorer, séparés par des virgules

**Exemple :**
```
GET /structure?path=/home/user/project&ignorePatterns=node_modules,*.log
```

**Réponse :**
```json
[
  {
    "name": "src",
    "path": "src",
    "type": "directory",
    "children": [
      {
        "name": "index.ts",
        "path": "src/index.ts",
        "type": "file"
      }
    ]
  }
]
```

### POST /files/content
Lit le contenu de plusieurs fichiers.

**Corps de la requête :**
```json
{
  "basePath": "/home/user/project",
  "files": ["src/index.ts", "package.json"]
}
```

**Réponse :**
```json
[
  {
    "path": "src/index.ts",
    "content": "console.log('Hello World');"
  },
  {
    "path": "package.json",
    "content": "{\n  \"name\": \"my-project\"\n}"
  }
]
```

## Intégration avec Docker

Pour utiliser cet agent avec votre application Docker, ajoutez cette configuration à votre `docker-compose.yml` :

```yaml
services:
  backend:
    # ... votre configuration existante
    environment:
      AGENT_URL: http://host.docker.internal:4001
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

## Packaging

Pour créer des exécutables autonomes :

```bash
npm run pkg
```

Cela génère des binaires pour Linux, Windows et macOS dans le dossier `./bin/`.

## Sécurité

⚠️ **Important** : Cet agent donne accès au système de fichiers local. Assurez-vous de :
- L'exécuter uniquement dans un environnement de développement sécurisé
- Configurer correctement les origines CORS
- Ne pas l'exposer sur un réseau public
- Valider tous les chemins d'accès dans votre application

## Dépannage

### L'agent ne démarre pas
- Vérifiez que le port 4001 n'est pas déjà utilisé
- Assurez-vous d'avoir les permissions nécessaires

### Erreurs d'accès aux fichiers
- Vérifiez les permissions du répertoire
- Assurez-vous que le chemin existe et est accessible

### Problèmes de CORS
- Configurez correctement la variable `CORS_ORIGINS`
- Vérifiez que votre application utilise la bonne URL d'agent