import { FileNode } from './structure.js';

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
      console.warn('Agent non disponible:', error);
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

      const response = await fetch(`${this.agentUrl}/structure?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur agent (${response.status}): ${errorText}`);
      }

      return await response.json() as FileNode[];
    } catch (error) {
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

      return await response.json() as FileContent[];
    } catch (error) {
      throw new Error(`Échec de la lecture des fichiers via l'agent: ${error}`);
    }
  }

  /**
   * Obtient l'URL de l'agent configurée
   */
  getAgentUrl(): string {
    return this.agentUrl;
  }
}