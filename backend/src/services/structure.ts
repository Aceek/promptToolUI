import { AgentService } from './agentService.js';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export async function generateStructure(sourcePath: string, ignorePatterns: string[]): Promise<FileNode[]> {
  const agentService = new AgentService();
  
  try {
    // Vérifier si l'agent est disponible
    const isAgentRunning = await agentService.checkStatus();
    if (!isAgentRunning) {
      throw new Error('Agent de système de fichiers non disponible. Assurez-vous qu\'il est démarré sur ' + agentService.getAgentUrl());
    }

    // Utiliser l'agent pour obtenir la structure
    return await agentService.getStructure(sourcePath, ignorePatterns);
  } catch (error) {
    throw new Error(`Failed to generate structure: ${error}`);
  }
}

// Les fonctions buildTree et isExcluded ne sont plus nécessaires car
// elles sont maintenant gérées par l'agent de système de fichiers

export function detectLanguage(extension: string): string {
  const langMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.php': 'php',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.sh': 'bash',
    '.sql': 'sql',
    '.xml': 'xml'
  };

  return langMap[extension.toLowerCase()] || 'text';
}