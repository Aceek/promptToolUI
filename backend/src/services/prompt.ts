import * as fs from 'fs/promises';
import * as path from 'path';
import { Environment } from 'nunjucks';
import { detectLanguage } from './structure.js';

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
  const codeFiles: CodeFile[] = [];

  for (const relativePath of selectedFilePaths) {
    try {
      const fullPath = path.join(workspacePath, relativePath);
      const stats = await fs.stat(fullPath);

      if (stats.isFile()) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n').map(text => ({ text }));
        const extension = path.extname(relativePath);
        const language = detectLanguage(extension);

        codeFiles.push({
          path: relativePath,
          language,
          lines
        });
      }
    } catch (error) {
      // Skip files that can't be read
      console.warn(`Warning: Could not read file ${relativePath}: ${error}`);
    }
  }

  return codeFiles;
}

async function generateProjectStructure(workspacePath: string, ignorePatterns: string[]): Promise<string> {
  try {
    const structure = await buildStructureText(workspacePath, '', ignorePatterns, 0);
    return `Project Root: ${path.basename(workspacePath) || '.'}\n${structure}`;
  } catch (error) {
    return `Error generating project structure: ${error}`;
  }
}

async function buildStructureText(
  dirPath: string,
  relativePath: string,
  ignorePatterns: string[],
  level: number
): Promise<string> {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const lines: string[] = [];
  const indent = '  '.repeat(level);

  const directories: string[] = [];
  const files: string[] = [];

  for (const item of items) {
    const itemRelativePath = path.join(relativePath, item.name).replace(/\\/g, '/');

    // Skip ignored items
    if (isIgnored(itemRelativePath, ignorePatterns)) {
      continue;
    }

    if (item.isDirectory()) {
      directories.push(item.name);
    } else {
      files.push(item.name);
    }
  }

  // Add files first
  for (const file of files.sort()) {
    lines.push(`${indent}  - ${file}`);
  }

  // Add directories and their contents
  for (const dir of directories.sort()) {
    lines.push(`${indent}Directory: ${dir}/`);
    try {
      const subDirPath = path.join(dirPath, dir);
      const subRelativePath = path.join(relativePath, dir);
      const subStructure = await buildStructureText(subDirPath, subRelativePath, ignorePatterns, level + 1);
      if (subStructure) {
        lines.push(subStructure);
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  return lines.join('\n');
}

function isIgnored(filePath: string, ignorePatterns: string[]): boolean {
  // Simple pattern matching - could be enhanced with minimatch
  for (const pattern of ignorePatterns) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(filePath)) {
        return true;
      }
    } else if (filePath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function parseFormatInstructions(instructions: string): string[] {
  return instructions.split('\n').filter(line => line.trim()).map(line => line.trim());
}

function parseFormatExamples(examples: string): string[] {
  return examples.split('\n').filter(line => line.trim());
}