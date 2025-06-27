import * as fs from 'fs/promises';
import * as path from 'path';
import { minimatch } from 'minimatch';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export async function generateStructure(sourcePath: string, ignorePatterns: string[]): Promise<FileNode[]> {
  try {
    const stats = await fs.stat(sourcePath);
    if (!stats.isDirectory()) {
      throw new Error('Source path must be a directory');
    }

    return await buildTree(sourcePath, '', ignorePatterns);
  } catch (error) {
    throw new Error(`Failed to generate structure: ${error}`);
  }
}

async function buildTree(dirPath: string, relativePath: string, ignorePatterns: string[]): Promise<FileNode[]> {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const tree: FileNode[] = [];
  const directories: FileNode[] = [];
  const files: FileNode[] = [];

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    const itemRelativePath = path.join(relativePath, item.name).replace(/\\/g, '/');

    // Check if this item should be excluded
    if (isExcluded(itemRelativePath, ignorePatterns)) {
      continue;
    }

    if (item.isDirectory()) {
      try {
        const children = await buildTree(fullPath, itemRelativePath, ignorePatterns);
        directories.push({
          name: item.name,
          path: itemRelativePath,
          type: 'directory',
          children
        });
      } catch (error) {
        // Skip directories we can't read
        continue;
      }
    } else {
      files.push({
        name: item.name,
        path: itemRelativePath,
        type: 'file'
      });
    }
  }

  // Sort directories and files alphabetically
  directories.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  // Return directories first, then files
  return [...directories, ...files];
}

function isExcluded(filePath: string, ignorePatterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const pattern of ignorePatterns) {
    let processedPattern = pattern;

    // If the pattern doesn't contain a slash and doesn't start with '**/,
    // prefix it with '**/' so it can match at any level
    if (!pattern.includes('/') && !pattern.startsWith('**/')) {
      processedPattern = `**/${pattern}`;
    }

    if (minimatch(normalizedPath, processedPattern)) {
      return true;
    }
  }

  return false;
}

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