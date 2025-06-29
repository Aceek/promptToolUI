import { prisma } from '../utils/prisma';
import { PromptBlockType } from '@prisma/client';
import { CreateBlockBody, UpdateBlockBody } from '../schemas/block.schema';
import { SYSTEM_CATEGORY_NAME, SYSTEM_BLOCK_COLOR, DYNAMIC_TASK_BLOCK_COLOR, RESERVED_COLORS } from '../constants';

export class BlockService {
  /**
   * Récupère tous les blocs
   */
  async getAll() {
    return await prisma.promptBlock.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  /**
   * Récupère un bloc par son ID
   */
  async getById(id: string) {
    const block = await prisma.promptBlock.findUnique({
      where: { id }
    });

    if (!block) {
      throw new Error('BLOCK_NOT_FOUND');
    }

    return block;
  }

  /**
   * Crée un nouveau bloc
   */
  async create(data: CreateBlockBody) {
    const { name, content, type, category, color } = data;

    let dataToCreate: any = {
      name,
      content,
      type,
      category: category || null,
      color: color || null
    };

    // Logique spéciale pour les blocs DYNAMIC_TASK
    if (type === PromptBlockType.DYNAMIC_TASK) {
      const SYSTEM_CATEGORY_NAME = 'Blocs Fondamentaux';
      const DYNAMIC_TASK_BLOCK_COLOR = '#EF4444';
      
      dataToCreate.category = SYSTEM_CATEGORY_NAME;
      dataToCreate.systemBehavior = 'SYSTEM';
      dataToCreate.color = DYNAMIC_TASK_BLOCK_COLOR;
    }

    return await prisma.promptBlock.create({
      data: dataToCreate
    });
  }

  /**
   * Met à jour un bloc
   */
  async update(id: string, data: UpdateBlockBody) {
    const { name, content, type, category, color } = data;

    const existingBlock = await prisma.promptBlock.findUnique({
      where: { id }
    });

    if (!existingBlock) {
      throw new Error('BLOCK_NOT_FOUND');
    }

    // Vérification des contraintes système
    if (existingBlock.systemBehavior !== 'NONE' && type && type !== existingBlock.type) {
      throw new Error('SYSTEM_BLOCK_TYPE_IMMUTABLE');
    }

    const updatedBlock = await prisma.promptBlock.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category: category || null }),
        ...(color !== undefined && { color: color || null })
      }
    });

    return updatedBlock;
  }

  /**
   * Supprime un bloc
   */
  async remove(id: string) {
    const existingBlock = await prisma.promptBlock.findUnique({
      where: { id }
    });

    if (!existingBlock) {
      throw new Error('BLOCK_NOT_FOUND');
    }

    if (existingBlock.systemBehavior === 'INDELETABLE') {
      throw new Error('SYSTEM_BLOCK_INDELETABLE');
    }

    await prisma.promptBlock.delete({
      where: { id }
    });

    return existingBlock;
  }

  /**
   * Récupère toutes les catégories uniques
   */
  async getCategories() {
    const result = await prisma.promptBlock.findMany({
      select: { category: true },
      distinct: ['category'],
      where: {
        category: { not: null }
      }
    });

    return result
      .map(r => r.category)
      .filter(Boolean)
      .sort();
  }
}

// Instance singleton du service
export const blockService = new BlockService();