import { FileNode } from './structure.js';
import { logger } from './logger.js';

export interface FileContent {
  path: string;
  content: string;
}

export interface FileContentRequest {
  basePath: string;
  files: string[];
}

export class AgentService {
  private agentUrl: string;

  constructor() {
    this.agentUrl = process.env.AGENT_URL || 'http://host.docker.internal:4001';
  }

  /**
   * Vérifie si l'agent est en cours d'exécution
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.agentUrl}/status`);
      if (response.ok) {
        const data = await response.json() as { status: string };
        return data.status === 'running';
      }
      return false;
    } catch (error) {
      logger.warn(`Agent not available: ${error}`);
      return false;
    }
  }

  /**
   * Obtient la structure d'un répertoire via l'agent
   */
  async getStructure(path: string, ignorePatterns: string[] = []): Promise<FileNode[]> {
    try {
      const params = new URLSearchParams({
        path: path
      });

      if (ignorePatterns.length > 0) {
        params.append('ignorePatterns', ignorePatterns.join(','));
      }

      logger.info(`Requesting structure from agent for path: ${path}`);
      const response = await fetch(`${this.agentUrl}/structure?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur agent (${response.status}): ${errorText}`);
      }

      const result = await response.json() as FileNode[];
      logger.success(`Structure received from agent for path: ${path}`);
      return result;
    } catch (error) {
      logger.error(`Failed to communicate with agent for structure: ${error}`);
      throw new Error(`Échec de la communication avec l'agent: ${error}`);
    }
  }

  /**
   * Lit le contenu de plusieurs fichiers via l'agent
   */
  async readFiles(basePath: string, files: string[]): Promise<FileContent[]> {
    try {
      const requestBody: FileContentRequest = {
        basePath,
        files
      };

      logger.info(`Requesting file content from agent: ${files.length} files from ${basePath}`);
      const response = await fetch(`${this.agentUrl}/files/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur agent (${response.status}): ${errorText}`);
      }

      const result = await response.json() as FileContent[];
      logger.success(`File content received from agent: ${result.length} files processed`);
      return result;
    } catch (error) {
      logger.error(`Failed to read files via agent: ${error}`);
      throw new Error(`Échec de la lecture des fichiers via l'agent: ${error}`);
    }
  }

  /**
   * Demande à l'agent d'arrêter la surveillance d'un chemin
   */
  async stopWatching(path: string): Promise<void> {
    try {
      logger.info(`Requesting agent to stop watching path: ${path}`);
      const response = await fetch(`${this.agentUrl}/unwatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur agent (${response.status}): ${errorText}`);
      }

      logger.success(`Agent stopped watching path: ${path}`);
    } catch (error) {
      logger.error(`Failed to stop watching via agent: ${error}`);
      throw new Error(`Échec de l'arrêt de la surveillance via l'agent: ${error}`);
    }
  }

  /**
   * Demande à l'agent de démarrer la surveillance d'un chemin
   */
  async startWatching(path: string, callbackUrl: string, ignorePatterns: string[] = []): Promise<void> {
    try {
      logger.info(`Requesting agent to watch path: ${path}`);
      const response = await fetch(`${this.agentUrl}/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path, callbackUrl, ignorePatterns })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur agent (${response.status}): ${errorText}`);
      }

      logger.success(`Agent started watching path: ${path}`);
    } catch (error) {
      logger.error(`Failed to start watching via agent: ${error}`);
      throw new Error(`Échec du démarrage de la surveillance via l'agent: ${error}`);
    }
  }

  /**
   * Obtient l'URL de l'agent configurée
   */
  getAgentUrl(): string {
    return this.agentUrl;
  }
}