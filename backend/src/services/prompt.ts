import * as path from 'path';
import { detectLanguage } from './structure.js';
import { AgentService } from './agentService.js';
import { Workspace, PromptBlock, PromptBlockType, PrismaClient } from '@prisma/client';

export interface PromptGenerationOptions {
  prisma: PrismaClient;
  workspace: Workspace;
  orderedBlockIds: string[];
  finalRequest?: string;
  selectedFilePaths?: string[];
  ignorePatterns: string[];
}

export interface CodeFile {
  path: string;
  language: string;
  lines: Array<{ text: string }>;
}

/**
 * Génère un prompt en assemblant des blocs modulaires dans l'ordre spécifié
 */
export async function generatePrompt(options: PromptGenerationOptions): Promise<string> {
  const {
    prisma,
    workspace,
    orderedBlockIds,
    finalRequest,
    selectedFilePaths = [],
    ignorePatterns
  } = options;

  try {
    let finalPromptParts: string[] = [];

    // 1. Fetch tous les blocs nécessaires en une seule requête
    const blocks = await prisma.promptBlock.findMany({
      where: { id: { in: orderedBlockIds } },
    });

    // 2. Créer un Map pour un accès facile et respecter l'ordre
    const blockMap = new Map(blocks.map((b: PromptBlock) => [b.id, b]));

    // 3. Itérer sur les IDs ordonnés fournis par le client
    for (const blockId of orderedBlockIds) {
      const block = blockMap.get(blockId);
      if (!block) continue;

      let blockContent = '';

      // 4. Le 'switch' est le nouveau moteur modulaire
      switch (block.type) {
        case 'STATIC':
          blockContent = block.content;
          break;

        case 'DYNAMIC_TASK':
          // Remplacer un placeholder dans le contenu du bloc par la requête
          blockContent = block.content.replace('{{dynamic_task}}', finalRequest || '');
          break;

        case 'PROJECT_STRUCTURE':
          // Appeler le service existant pour générer la structure
          blockContent = await generateProjectStructure(workspace.path, ignorePatterns);
          break;

        case 'SELECTED_FILES_CONTENT':
          // Appeler le service existant pour lire les fichiers
          const files = await readSelectedFiles(workspace.path, selectedFilePaths, ignorePatterns);
          blockContent = formatFilesContent(files);
          break;
        
        case 'PROJECT_INFO':
          blockContent = formatProjectInfo(workspace);
          break;

        default:
          // Type de bloc non reconnu, on prend le contenu tel quel
          blockContent = block.content;
          break;
      }

      if (blockContent.trim()) {
        finalPromptParts.push(blockContent);
      }
    }

    // 5. Assembler le tout avec des séparateurs
    return finalPromptParts.join('\n\n====================================\n\n');

  } catch (error) {
    throw new Error(`Failed to generate prompt: ${error}`);
  }
}

/**
 * Lit les fichiers sélectionnés via l'agent
 */
async function readSelectedFiles(
  workspacePath: string,
  selectedFilePaths: string[],
  ignorePatterns: string[]
): Promise<CodeFile[]> {
  const agentService = new AgentService();
  const codeFiles: CodeFile[] = [];

  try {
    // Vérifier si l'agent est disponible
    const isAgentRunning = await agentService.checkStatus();
    if (!isAgentRunning) {
      throw new Error('Agent de système de fichiers non disponible. Assurez-vous qu\'il est démarré sur ' + agentService.getAgentUrl());
    }

    // Utiliser l'agent pour lire les fichiers
    const fileContents = await agentService.readFiles(workspacePath, selectedFilePaths);

    for (const fileContent of fileContents) {
      const lines = fileContent.content.split('\n').map(text => ({ text }));
      const extension = path.extname(fileContent.path);
      const language = detectLanguage(extension);

      codeFiles.push({
        path: fileContent.path,
        language,
        lines
      });
    }

    return codeFiles;
  } catch (error) {
    throw new Error(`Failed to read selected files: ${error}`);
  }
}

/**
 * Génère la structure du projet via l'agent
 */
async function generateProjectStructure(workspacePath: string, ignorePatterns: string[]): Promise<string> {
  const agentService = new AgentService();
  
  try {
    // Vérifier si l'agent est disponible
    const isAgentRunning = await agentService.checkStatus();
    if (!isAgentRunning) {
      return `Error: Agent de système de fichiers non disponible sur ${agentService.getAgentUrl()}`;
    }

    // Obtenir la structure via l'agent
    const structure = await agentService.getStructure(workspacePath, ignorePatterns);
    const structureText = buildStructureTextFromNodes(structure, 0);
    return `Project Root: ${path.basename(workspacePath) || '.'}\n${structureText}`;
  } catch (error) {
    return `Error generating project structure: ${error}`;
  }
}

/**
 * Construit le texte de structure à partir des nœuds
 */
function buildStructureTextFromNodes(nodes: any[], level: number): string {
  const lines: string[] = [];
  const indent = '  '.repeat(level);

  // Séparer les fichiers et dossiers
  const files = nodes.filter(node => node.type === 'file');
  const directories = nodes.filter(node => node.type === 'directory');

  // Ajouter les fichiers d'abord
  for (const file of files) {
    lines.push(`${indent}  - ${file.name}`);
  }

  // Ajouter les dossiers et leur contenu
  for (const dir of directories) {
    lines.push(`${indent}Directory: ${dir.name}/`);
    if (dir.children && dir.children.length > 0) {
      const subStructure = buildStructureTextFromNodes(dir.children, level + 1);
      if (subStructure) {
        lines.push(subStructure);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Formate le contenu des fichiers de code
 */
function formatFilesContent(files: CodeFile[]): string {
  const fileParts: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    
    const fileContent = file.lines.map(line => line.text).join('\n');
    
    let filePart = `File: ${file.path}\nLanguage: ${file.language}\n\n\`\`\`${file.language}\n${fileContent}\n\`\`\``;
    
    // Ajouter un séparateur entre les fichiers (sauf pour le dernier)
    if (i < files.length - 1) {
      filePart += '\n\n---------------------------------------------------------------------------';
    }
    
    fileParts.push(filePart);
  }
  
  return fileParts.join('\n\n');
}

/**
 * Formate les informations du projet
 */
function formatProjectInfo(workspace: Workspace): string {
  const parts: string[] = [];
  
  parts.push(`Project Name: ${workspace.name}`);
  parts.push(`Workspace Path: ${workspace.path}`);
  
  if (workspace.projectInfo && workspace.projectInfo.trim()) {
    parts.push('');
    parts.push(workspace.projectInfo);
  }
  
  return parts.join('\n');
}
