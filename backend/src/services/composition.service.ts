import { prisma } from '../utils/prisma';
import { CreateCompositionBody, UpdateCompositionBody } from '../schemas/composition.schema';

export class CompositionService {
  /**
   * Récupère toutes les compositions
   */
  async getAll() {
    return await prisma.promptComposition.findMany({
      include: {
        blocks: {
          include: {
            block: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Récupère une composition par son ID
   */
  async getById(id: string) {
    const composition = await prisma.promptComposition.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            block: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!composition) {
      throw new Error('COMPOSITION_NOT_FOUND');
    }

    return composition;
  }

  /**
   * Crée une nouvelle composition
   */
  async create(data: CreateCompositionBody) {
    const { name, blockIds } = data;

    // Vérifier l'unicité du nom
    const existingByName = await prisma.promptComposition.findUnique({
      where: { name }
    });
    
    if (existingByName) {
      throw new Error('CONFLICT:Une composition avec ce nom existe déjà.');
    }

    // Vérifier que tous les blocs existent
    const existingBlocks = await prisma.promptBlock.findMany({
      where: { id: { in: blockIds } }
    });

    if (existingBlocks.length !== blockIds.length) {
      throw new Error('INVALID_BLOCKS:Some blocks do not exist');
    }

    // Créer la composition avec les blocs dans l'ordre
    return await prisma.promptComposition.create({
      data: {
        name,
        blocks: {
          create: blockIds.map((blockId, index) => ({
            blockId,
            order: index
          }))
        }
      },
      include: {
        blocks: {
          include: {
            block: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
  }

  /**
   * Met à jour une composition
   */
  async update(id: string, data: UpdateCompositionBody) {
    const { name, blockIds } = data;

    const existingComposition = await prisma.promptComposition.findUnique({
      where: { id }
    });

    if (!existingComposition) {
      throw new Error('COMPOSITION_NOT_FOUND');
    }

    // Vérifier l'unicité du nom si fourni
    if (name) {
      const existingByName = await prisma.promptComposition.findUnique({
        where: { name }
      });
      
      if (existingByName && existingByName.id !== id) {
        throw new Error('CONFLICT:Une composition avec ce nom existe déjà.');
      }
    }

    // Si blockIds est fourni, vérifier que tous les blocs existent
    if (blockIds && Array.isArray(blockIds)) {
      const existingBlocks = await prisma.promptBlock.findMany({
        where: { id: { in: blockIds } }
      });

      if (existingBlocks.length !== blockIds.length) {
        throw new Error('INVALID_BLOCKS:Some blocks do not exist');
      }
    }

    // Mettre à jour la composition
    return await prisma.$transaction(async (tx) => {
      // Mettre à jour le nom si fourni
      const composition = await tx.promptComposition.update({
        where: { id },
        data: {
          ...(name !== undefined && { name })
        }
      });

      // Si blockIds est fourni, recréer les relations
      if (blockIds && Array.isArray(blockIds)) {
        // Supprimer les anciennes relations
        await tx.promptCompositionBlocks.deleteMany({
          where: { compositionId: id }
        });

        // Créer les nouvelles relations
        await tx.promptCompositionBlocks.createMany({
          data: blockIds.map((blockId, index) => ({
            compositionId: id,
            blockId,
            order: index
          }))
        });
      }

      // Retourner la composition mise à jour avec les blocs
      return await tx.promptComposition.findUnique({
        where: { id },
        include: {
          blocks: {
            include: {
              block: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });
    });
  }

  /**
   * Supprime une composition
   */
  async remove(id: string) {
    const existingComposition = await prisma.promptComposition.findUnique({
      where: { id }
    });

    if (!existingComposition) {
      throw new Error('COMPOSITION_NOT_FOUND');
    }

    await prisma.promptComposition.delete({
      where: { id }
    });

    return existingComposition;
  }
}

// Instance singleton du service
export const compositionService = new CompositionService();