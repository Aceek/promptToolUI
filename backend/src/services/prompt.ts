import * as path from 'path';
import { Environment } from 'nunjucks';
import { detectLanguage } from './structure.js';
import { AgentService } from './agentService.js';

export interface PromptGenerationOptions {
  workspace: {
    id: string;
    name: string;
    path: string;
    selectedFiles: string[];
    lastFinalRequest?: string | null;
    ignorePatterns: string[];
  };
  format: {
    id: string;
    name: string;
    instructions: string;
    examples: string;
  };
  role: {
    id: string;
    name: string;
    description: string;
  };
  finalRequest: string;
  selectedFilePaths: string[];
  ignorePatterns: string[];
}

export interface CodeFile {
  path: string;
  language: string;
  lines: Array<{ text: string }>;
}

export async function generatePrompt(options: PromptGenerationOptions): Promise<string> {
  const {
    workspace,
    format,
    role,
    finalRequest,
    selectedFilePaths,
    ignorePatterns
  } = options;

  try {
    // Read selected files content
    const codeFiles = await readSelectedFiles(workspace.path, selectedFilePaths, ignorePatterns);

    // Generate project structure
    const projectStructure = await generateProjectStructure(workspace.path, ignorePatterns);

    // Parse format instructions and examples
    const formatInstructions = parseFormatInstructions(format.instructions);
    const formatExamples = parseFormatExamples(format.examples);

    // Setup Nunjucks environment
    const env = new Environment();

    // Define the template
    const template = `
{%- if include_role_and_expertise %}
====================================
ROLE AND EXPERTISE
====================================
{{ role_description }}
{%- endif %}

{%- if include_final_request %}
====================================
DYNAMIC TASK - USER REQUEST
====================================
[The following is the specific task you need to accomplish. While the rest of this prompt provides static context and guidelines, this section represents the dynamic user request that changes with each prompt generation.]

{{ final_request }}

Your response must strictly follow the format specified in the FORMAT INSTRUCTIONS section below. This format is crucial for proper processing of your response.
{%- endif %}

{%- if include_format_instructions %}
====================================
FORMAT INSTRUCTIONS
====================================
Format: {{ format_name }}

Instructions:
{%- for instr in format_instructions %}
- {{ instr }}
{%- endfor %}

Examples:
{%- for ex in format_examples %}
{{ ex }}
{%- endfor %}
{%- endif %}

{%- if include_project_info %}
====================================
PROJECT INFORMATION
====================================
Project Name: {{ project_name }}
Workspace Path: {{ workspace_path }}
{%- endif %}

{%- if include_structure %}
====================================
PROJECT STRUCTURE
====================================
{{ project_structure }}
{%- endif %}

{%- if include_code_content %}
====================================
CODE CONTENT
====================================
{%- for file_item in code_files %}
File: {{ file_item.path }}
Language: {{ file_item.language }}

\`\`\`
{%- for line in file_item.lines %}
{{ line.text }}
{%- endfor %}
\`\`\`

{%- if not loop.last %}
---------------------------------------------------------------------------
{%- endif %}
{%- endfor %}
{%- endif %}
`.trim();

    // Prepare template context
    const templateContext = {
      // Prompt options - all enabled by default
      include_role_and_expertise: true,
      include_final_request: true,
      include_format_instructions: true,
      include_project_info: true,
      include_structure: true,
      include_code_content: true,

      // Data
      role_description: role.description,
      final_request: finalRequest,
      format_name: format.name,
      format_instructions: formatInstructions,
      format_examples: formatExamples,
      project_name: workspace.name,
      workspace_path: workspace.path,
      project_structure: projectStructure,
      code_files: codeFiles
    };

    // Render the template
    const prompt = env.renderString(template, templateContext);
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