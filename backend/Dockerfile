# Base image - nous utilisons Debian "slim" pour une meilleure compatibilité
FROM node:20-slim

# Installer OpenSSL, qui est une dépendance système requise par le moteur de Prisma.
# On passe en root pour installer des paquets, puis on revient à l'utilisateur 'node' (bonne pratique de sécurité).
USER root
RUN apt-get update && apt-get install -y openssl
USER node

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de paquets en s'assurant que l'utilisateur 'node' en est propriétaire
COPY --chown=node:node package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source en s'assurant que l'utilisateur 'node' en est propriétaire
COPY --chown=node:node . .

# Générer le client Prisma
RUN npx prisma generate

# Copier et rendre exécutable le script de démarrage
COPY --chown=node:node scripts/start.sh ./scripts/
RUN chmod +x ./scripts/start.sh

# Exposer le port et définir la commande de démarrage
EXPOSE 3001
CMD ["./scripts/start.sh"]