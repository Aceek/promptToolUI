import * as path from 'path';
import { detectLanguage } from './structure.js';
import { AgentService } from './agentService.js';
import { Workspace, Format, Role, PromptTemplate, PrismaClient } from '@prisma/client';
import { renderString } from 'nunjucks';


export interface PromptGenerationOptions {
  prisma: PrismaClient;
  workspace: Workspace;
  format?: Format | null;
  role?: Role | null;
  finalRequest?: string;
  selectedFilePaths?: string[];
  ignorePatterns: string[];
  includeProjectInfo: boolean;
  includeStructure: boolean;
  promptTemplateId?: string | null | undefined;
}

export interface CodeFile {
  path: string;
  language: string;
  lines: Array<{ text: string }>;
}

export async function generatePrompt(options: PromptGenerationOptions): Promise<string> {
  const {
    prisma,
    workspace,
    format,
    role,
    finalRequest,
    selectedFilePaths = [],
    ignorePatterns,
    includeProjectInfo,
    includeStructure,
    promptTemplateId
  } = options;

  try {
    // Step 1: Load the prompt template from database
    let promptTemplate: PromptTemplate | null = null;
    if (promptTemplateId) {
      promptTemplate = await prisma.promptTemplate.findUnique({ where: { id: promptTemplateId } });
    }
    // Fallback to default template if none found or provided
    if (!promptTemplate) {
      promptTemplate = await prisma.promptTemplate.findFirst({ where: { isDefault: true } });
    }
    if (!promptTemplate) {
      throw new Error('No default prompt template found in the database.');
    }

    // Read selected files content only if files are selected
    const codeFiles = selectedFilePaths.length > 0
      ? await readSelectedFiles(workspace.path, selectedFilePaths, ignorePatterns)
      : [];

    // Generate project structure only if enabled
    const projectStructure = includeStructure
      ? await generateProjectStructure(workspace.path, ignorePatterns)
      : '';

    // Parse format instructions and examples only if format is provided
    const formatInstructions = format ? parseFormatInstructions(format.instructions) : [];
    const formatExamples = format ? parseFormatExamples(format.examples) : [];

    // Prepare template context with conditional sections
    const templateContext = {
      // Conditional sections based on what's provided and UI settings
      include_role_and_expertise: !!role,
      include_final_request: !!finalRequest && finalRequest.trim() !== '',
      include_format_instructions: !!format,
      include_project_info: includeProjectInfo,
      include_structure: includeStructure,
      include_code_content: codeFiles.length > 0,

      // Data (with fallbacks for optional fields)
      role_description: role?.description || '',
      final_request: finalRequest || '',
      format_name: format?.name || '',
      format_instructions: formatInstructions,
      format_examples: formatExamples,
      project_name: workspace.name,
      workspace_path: workspace.path,
      project_info: (workspace as any).projectInfo || '',
      project_structure: projectStructure,
      code_files: codeFiles
    };

    // Render the template using Nunjucks directly
    const prompt = renderString(promptTemplate.content, templateContext);
    return prompt;

  } catch (error) {
    throw new Error(`Failed to generate prompt: ${error}`);
  }
}

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

function parseFormatInstructions(instructions: string): string[] {
  return instructions.split('\n').filter(line => line.trim()).map(line => line.trim());
}

function parseFormatExamples(examples: string): string[] {
  return examples.split('\n').filter(line => line.trim());
}
