import { FastifyPluginAsync } from 'fastify';
import { FileService } from '../services/fileService.js';
import { FileContentRequest } from '../types.js';

export const fileRoutes: FastifyPluginAsync = async (fastify) => {
  const fileService = new FileService();

  // GET /structure - Analyser un répertoire et renvoyer sa structure arborescente
  fastify.get<{
    Querystring: {
      path: string;
      ignorePatterns?: string;
    }
  }>('/structure', async (request, reply) => {
    try {
      const { path, ignorePatterns } = request.query;

      if (!path) {
        return reply.status(400).send({ 
          error: 'Le paramètre "path" est requis' 
        });
      }

      // Vérifier si le chemin existe
      const pathExists = await fileService.pathExists(path);
      if (!pathExists) {
        return reply.status(404).send({ 
          error: `Le chemin "${path}" n'existe pas ou n'est pas accessible` 
        });
      }

      // Parser les patterns d'ignore
      const patterns = ignorePatterns ? ignorePatterns.split(',').map(p => p.trim()) : [];

      fastify.appLogger.business({
        action: 'Structure Analysis Started',
        path: path,
        details: patterns.length > 0 ? `with ${patterns.length} ignore patterns` : undefined
      });
      
      // Générer la structure
      const structure = await fileService.generateStructure(path, patterns);
      
      // Compter le nombre total de fichiers dans la structure
      const countFiles = (nodes: any[]): number => {
        return nodes.reduce((count, node) => {
          if (node.type === 'file') {
            return count + 1;
          } else if (node.children) {
            return count + countFiles(node.children);
          }
          return count;
        }, 0);
      };

      fastify.appLogger.business({
        action: 'Structure Analysis Completed',
        path: path,
        fileCount: countFiles(structure)
      });
      return structure;
    } catch (error) {
      fastify.appLogger.error(`Failed to generate structure for path ${request.query.path}: ${error}`);
      return reply.status(500).send({
        error: `Erreur lors de la génération de la structure: ${error}`
      });
    }
  });

  // POST /files/content - Obtenir le contenu de plusieurs fichiers
  fastify.post<{
    Body: FileContentRequest
  }>('/files/content', async (request, reply) => {
    try {
      const { basePath, files } = request.body;

      if (!basePath || !files || !Array.isArray(files)) {
        return reply.status(400).send({ 
          error: 'Les paramètres "basePath" et "files" (tableau) sont requis' 
        });
      }

      // Vérifier si le chemin de base existe
      const pathExists = await fileService.pathExists(basePath);
      if (!pathExists) {
        return reply.status(404).send({ 
          error: `Le chemin de base "${basePath}" n'existe pas ou n'est pas accessible` 
        });
      }

      fastify.appLogger.business({
        action: 'File Content Request',
        path: basePath,
        fileCount: files.length
      });
      
      // Lire les fichiers
      const fileContents = await fileService.readFiles(basePath, files);
      
      fastify.appLogger.business({
        action: 'File Content Delivered',
        path: basePath,
        fileCount: fileContents.length
      });
      return fileContents;
    } catch (error) {
      fastify.appLogger.error(`Failed to read files from ${request.body.basePath}: ${error}`);
      return reply.status(500).send({
        error: `Erreur lors de la lecture des fichiers: ${error}`
      });
    }
  });
};