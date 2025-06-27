#!/bin/bash
set -e

echo "🚀 Starting backend server..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Waiting for PostgreSQL to be ready..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Appliquer les migrations
echo "📦 Applying database migrations..."
npx prisma migrate deploy

# Vérifier si la base de données a besoin d'être seedée
echo "🔍 Checking if database needs seeding..."

# Méthode plus robuste : utiliser un script Node.js pour vérifier
NEEDS_SEED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNeedsSeeding() {
  try {
    const templateCount = await prisma.promptTemplate.count();
    const settingsCount = await prisma.setting.count();
    
    // Si pas de templates ou pas de settings, on a besoin de seed
    if (templateCount === 0 || settingsCount === 0) {
      console.log('true');
    } else {
      console.log('false');
    }
  } catch (error) {
    // En cas d'erreur (table n'existe pas, etc.), on a besoin de seed
    console.log('true');
  } finally {
    await prisma.\$disconnect();
  }
}

checkNeedsSeeding();
")

if [ "$NEEDS_SEED" = "true" ]; then
  echo "🌱 Database needs seeding. Running seed script..."
  npm run db:seed
  echo "✅ Database seeded successfully!"
else
  echo "✅ Database already contains required data"
fi

# Démarrer le serveur
echo "🎯 Starting development server..."
exec npm run dev