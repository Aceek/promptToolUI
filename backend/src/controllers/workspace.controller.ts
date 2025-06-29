import { FastifyRequest, FastifyReply } from 'fastify';
import { workspaceService } from '../services/workspace.service';
import {
  WorkspaceIdParam,
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
} from '../schemas/workspace.schema';

export class WorkspaceController {
  /**
   * Handler pour GET /api/workspaces - Liste tous les workspaces
   */
  async getAllWorkspacesHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
      const workspaces = await workspaceService.getAll();
      return workspaces;
    } catch (error) {
      request.log.error(`Failed to fetch workspaces: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch workspaces' });
    }
  }

  /**
   * Handler pour GET /api/workspaces/:id - Récupère un workspace spécifique
   */
  async getWorkspaceByIdHandler(
    request: FastifyRequest<{ Params: WorkspaceIdParam }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const workspace = await workspaceService.getById(id);
      return workspace;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'WORKSPACE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Workspace not found' });
      }
      
      request.log.error(`Failed to fetch workspace ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to fetch workspace' });
    }
  }

  /**
   * Handler pour POST /api/workspaces - Crée un nouveau workspace
   */
  async createWorkspaceHandler(
    request: FastifyRequest<{ Body: CreateWorkspaceBody }>,
    reply: FastifyReply
  ) {
    try {
      const workspace = await workspaceService.create(request.body);
      
      request.log.info({
        action: 'Workspace Created',
        details: `"${workspace.name}" at ${workspace.path}`,
        resourceId: workspace.id
      });
      
      return workspace;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.startsWith('CONFLICT:')) {
        const conflictMessage = errorMessage.replace('CONFLICT:', '');
        return reply.status(409).send({ error: conflictMessage });
      }
      
      request.log.error(`Failed to create workspace "${request.body.name}": ${error}`);
      return reply.status(500).send({ error: 'Failed to create workspace' });
    }
  }

  /**
   * Handler pour PUT /api/workspaces/:id - Met à jour un workspace
   */
  async updateWorkspaceHandler(
    request: FastifyRequest<{
      Params: WorkspaceIdParam;
      Body: UpdateWorkspaceBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const workspace = await workspaceService.update(id, request.body);
      
      request.log.info({
        action: 'Workspace Updated',
        resourceId: id
      });
      
      return workspace;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.startsWith('CONFLICT:')) {
        const conflictMessage = errorMessage.replace('CONFLICT:', '');
        return reply.status(409).send({ error: conflictMessage });
      }
      
      if (errorMessage === 'WORKSPACE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Workspace not found' });
      }
      
      request.log.error(`Failed to update workspace ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to update workspace' });
    }
  }

  /**
   * Handler pour DELETE /api/workspaces/:id - Supprime un workspace
   */
  async deleteWorkspaceHandler(
    request: FastifyRequest<{ Params: WorkspaceIdParam }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      await workspaceService.remove(id);
      
      request.log.info({
        action: 'Workspace Deleted',
        resourceId: id
      });
      
      return reply.status(204).send();
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage === 'WORKSPACE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Workspace not found' });
      }
      
      request.log.error(`Failed to delete workspace ${request.params.id}: ${error}`);
      return reply.status(500).send({ error: 'Failed to delete workspace' });
    }
  }
}

// Instance singleton du contrôleur
export const workspaceController = new WorkspaceController();