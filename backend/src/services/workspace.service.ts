import { prisma } from '../utils/prisma';
import { CreateWorkspaceBody, UpdateWorkspaceBody } from '../schemas/workspace.schema';

export class WorkspaceService {
  /**
   * Récupère tous les workspaces
   */
  async getAll() {
    return await prisma.workspace.findMany({
      include: {
        defaultComposition: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Récupère un workspace par son ID
   */
  async getById(id: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        defaultComposition: true
      }
    });

    if (!workspace) {
      throw new Error('WORKSPACE_NOT_FOUND');
    }

    return workspace;
  }

  /**
   * Crée un nouveau workspace
   */
  async create(data: CreateWorkspaceBody) {
    const {
      name,
      path,
      defaultCompositionId,
      ignorePatterns = [],
      projectInfo
    } = data;

    // Vérifier l'unicité du chemin
    const existingByPath = await prisma.workspace.findUnique({
      where: { path }
    });
    
    if (existingByPath) {
      throw new Error('CONFLICT:Un espace de travail avec ce chemin existe déjà.');
    }

    const workspaceData: any = {
      name,
      path,
      ignorePatterns,
      selectedFiles: [],
      projectInfo: projectInfo || null,
      defaultCompositionId: defaultCompositionId || null
    };

    return await prisma.workspace.create({
      data: workspaceData,
      include: {
        defaultComposition: true
      }
    });
  }

  /**
   * Met à jour un workspace
   */
  async update(id: string, data: UpdateWorkspaceBody) {
    const updateData: any = { ...data };

    // Vérifier l'unicité du chemin si fourni
    if (updateData.path) {
      const existingByPath = await prisma.workspace.findUnique({
        where: { path: updateData.path }
      });
      
      if (existingByPath && existingByPath.id !== id) {
        throw new Error('CONFLICT:Un espace de travail avec ce chemin existe déjà.');
      }
    }

    // Convertir les undefined en null pour les champs optionnels
    if ('defaultCompositionId' in updateData && updateData.defaultCompositionId === undefined) {
      updateData.defaultCompositionId = null;
    }

    try {
      return await prisma.workspace.update({
        where: { id },
        data: updateData,
        include: {
          defaultComposition: true
        }
      });
    } catch (error) {
      throw new Error('WORKSPACE_NOT_FOUND');
    }
  }

  /**
   * Supprime un workspace
   */
  async remove(id: string) {
    try {
      await prisma.workspace.delete({
        where: { id }
      });
    } catch (error) {
      throw new Error('WORKSPACE_NOT_FOUND');
    }
  }
}

// Instance singleton du service
export const workspaceService = new WorkspaceService();