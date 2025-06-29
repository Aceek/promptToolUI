import { PrismaClient, PromptBlockType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with default prompt blocks and compositions...');

  // Supprimer toutes les données existantes
  await prisma.promptCompositionBlocks.deleteMany();
  await prisma.promptComposition.deleteMany();
  await prisma.promptBlock.deleteMany();

  // Créer les blocs de base
  const blocks = await Promise.all([
    // Blocs de rôles
    prisma.promptBlock.create({
      data: {
        name: 'Expert Software Engineer',
        content: 'You are an expert software engineer with extensive knowledge in multiple programming languages, frameworks, and best practices. You write clean, efficient, and maintainable code.',
        type: PromptBlockType.STATIC,
        category: 'Rôles',
        color: '#3B82F6'
      }
    }),

    prisma.promptBlock.create({
      data: {
        name: 'Senior Frontend Developer',
        content: 'You are a senior frontend developer specializing in React, TypeScript, and modern web technologies. You focus on creating responsive, accessible, and performant user interfaces.',
        type: PromptBlockType.STATIC,
        category: 'Rôles',
        color: '#3B82F6'
      }
    }),

    prisma.promptBlock.create({
      data: {
        name: 'Backend Architect',
        content: 'You are a backend architect with deep expertise in API design, database optimization, and scalable system architecture. You prioritize security, performance, and maintainability.',
        type: PromptBlockType.STATIC,
        category: 'Rôles',
        color: '#3B82F6'
      }
    }),

    // Bloc de tâche dynamique (SYSTEM BLOCK)
    prisma.promptBlock.create({
      data: {
        name: 'Tâche Utilisateur',
        content: JSON.stringify({
          prefix: "TASK TO ACCOMPLISH:",
          suffix: "Please analyze the provided code and project structure to accomplish this task effectively."
        }),
        type: PromptBlockType.DYNAMIC_TASK,
        category: 'Blocs Fondamentaux',
        color: '#EF4444',
        isSystemBlock: true
      }
    }),

    // Blocs d'instructions de format
    prisma.promptBlock.create({
      data: {
        name: 'Format Code avec Explications',
        content: 'FORMAT INSTRUCTIONS:\n\n- Provide clear, well-commented code\n- Explain your reasoning for key decisions\n- Include error handling where appropriate\n- Follow best practices for the given language/framework\n- Structure your response with clear sections',
        type: PromptBlockType.STATIC,
        category: 'Formats',
        color: '#10B981'
      }
    }),

    prisma.promptBlock.create({
      data: {
        name: 'Format Documentation',
        content: 'FORMAT INSTRUCTIONS:\n\n- Write comprehensive documentation\n- Include code examples where relevant\n- Use clear headings and structure\n- Explain complex concepts in simple terms\n- Provide usage examples and best practices',
        type: PromptBlockType.STATIC,
        category: 'Formats',
        color: '#10B981'
      }
    }),

    prisma.promptBlock.create({
      data: {
        name: 'Format Analyse et Recommandations',
        content: 'FORMAT INSTRUCTIONS:\n\n- Analyze the current code structure\n- Identify potential issues or improvements\n- Provide specific, actionable recommendations\n- Prioritize suggestions by impact and effort\n- Include code examples for proposed changes',
        type: PromptBlockType.STATIC,
        category: 'Formats',
        color: '#10B981'
      }
    }),

    // Blocs dynamiques pour le contenu du projet (SYSTEM BLOCKS)
    prisma.promptBlock.create({
      data: {
        name: 'Informations du Projet',
        content: 'PROJECT INFORMATION:\n\nThe following information describes the current project context.',
        type: PromptBlockType.PROJECT_INFO,
        category: 'Blocs Fondamentaux',
        color: '#8B5CF6',
        isSystemBlock: true
      }
    }),

    prisma.promptBlock.create({
      data: {
        name: 'Structure du Projet',
        content: 'PROJECT STRUCTURE:\n\nHere is the current file and directory structure of the project.',
        type: PromptBlockType.PROJECT_STRUCTURE,
        category: 'Blocs Fondamentaux',
        color: '#8B5CF6',
        isSystemBlock: true
      }
    }),

    prisma.promptBlock.create({
      data: {
        name: 'Fichiers Sélectionnés',
        content: 'SELECTED FILES CONTENT:\n\nThe following files have been selected for analysis.',
        type: PromptBlockType.SELECTED_FILES_CONTENT,
        category: 'Blocs Fondamentaux',
        color: '#8B5CF6',
        isSystemBlock: true
      }
    }),

    // Blocs d'instructions générales
    prisma.promptBlock.create({
      data: {
        name: 'Instructions Générales',
        content: 'GENERAL INSTRUCTIONS:\n\n- Analyze the provided code carefully\n- Consider the project context and structure\n- Provide practical, implementable solutions\n- Maintain consistency with existing code style\n- Ask for clarification if requirements are unclear',
        type: PromptBlockType.STATIC,
        category: 'Instructions',
        color: '#F59E0B'
      }
    }),

    prisma.promptBlock.create({
      data: {
        name: 'Bonnes Pratiques',
        content: 'BEST PRACTICES:\n\n- Follow SOLID principles\n- Write self-documenting code\n- Implement proper error handling\n- Consider performance implications\n- Ensure code is testable and maintainable\n- Use appropriate design patterns',
        type: PromptBlockType.STATIC,
        category: 'Instructions',
        color: '#F59E0B'
      }
    })
  ]);

  console.log(`✅ Created ${blocks.length} prompt blocks`);

  // Créer des compositions par défaut
  const compositions = await Promise.all([
    // Composition pour développement général
    prisma.promptComposition.create({
      data: {
        name: 'Développement Général',
        blocks: {
          create: [
            { blockId: blocks[0].id, order: 0 }, // Expert Software Engineer
            { blockId: blocks[3].id, order: 1 }, // Tâche Utilisateur
            { blockId: blocks[4].id, order: 2 }, // Format Code avec Explications
            { blockId: blocks[7].id, order: 3 }, // Informations du Projet
            { blockId: blocks[8].id, order: 4 }, // Structure du Projet
            { blockId: blocks[9].id, order: 5 }, // Fichiers Sélectionnés
            { blockId: blocks[10].id, order: 6 } // Instructions Générales
          ]
        }
      }
    }),

    // Composition pour frontend
    prisma.promptComposition.create({
      data: {
        name: 'Développement Frontend',
        blocks: {
          create: [
            { blockId: blocks[1].id, order: 0 }, // Senior Frontend Developer
            { blockId: blocks[3].id, order: 1 }, // Tâche Utilisateur
            { blockId: blocks[4].id, order: 2 }, // Format Code avec Explications
            { blockId: blocks[7].id, order: 3 }, // Informations du Projet
            { blockId: blocks[9].id, order: 4 }, // Fichiers Sélectionnés
            { blockId: blocks[11].id, order: 5 } // Bonnes Pratiques
          ]
        }
      }
    }),

    // Composition pour analyse de code
    prisma.promptComposition.create({
      data: {
        name: 'Analyse et Refactoring',
        blocks: {
          create: [
            { blockId: blocks[0].id, order: 0 }, // Expert Software Engineer
            { blockId: blocks[3].id, order: 1 }, // Tâche Utilisateur
            { blockId: blocks[6].id, order: 2 }, // Format Analyse et Recommandations
            { blockId: blocks[8].id, order: 3 }, // Structure du Projet
            { blockId: blocks[9].id, order: 4 }, // Fichiers Sélectionnés
            { blockId: blocks[11].id, order: 5 } // Bonnes Pratiques
          ]
        }
      }
    }),

    // Composition pour documentation
    prisma.promptComposition.create({
      data: {
        name: 'Génération de Documentation',
        blocks: {
          create: [
            { blockId: blocks[0].id, order: 0 }, // Expert Software Engineer
            { blockId: blocks[3].id, order: 1 }, // Tâche Utilisateur
            { blockId: blocks[5].id, order: 2 }, // Format Documentation
            { blockId: blocks[7].id, order: 3 }, // Informations du Projet
            { blockId: blocks[8].id, order: 4 }, // Structure du Projet
            { blockId: blocks[9].id, order: 5 }  // Fichiers Sélectionnés
          ]
        }
      }
    })
  ]);

  console.log(`✅ Created ${compositions.length} prompt compositions`);

  console.log('🎉 Database seeded successfully!');
  console.log('\nCreated blocks:');
  blocks.forEach((block, index) => {
    console.log(`  ${index + 1}. ${block.name} (${block.category}) - ${block.type}`);
  });

  console.log('\nCreated compositions:');
  compositions.forEach((comp, index) => {
    console.log(`  ${index + 1}. ${comp.name}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
