import * as fs from 'fs/promises';
import * as path from 'path';
import { minimatch } from 'minimatch';
import { FileNode, FileContent } from '../types';
import { logger } from '../logger';

export class FileService {
  /**
   * Génère la structure arborescente d'un répertoire
   */
  async generateStructure(sourcePath: string, ignorePatterns: string[] = []): Promise<FileNode[]> {
    try {
      const stats = await fs.stat(sourcePath);
      if (!stats.isDirectory()) {
        throw new Error('Le chemin source doit être un répertoire');
      }

      return await this.buildTree(sourcePath, '', ignorePatterns);
    } catch (error) {
      throw new Error(`Échec de la génération de structure: ${error}`);
    }
  }

  /**
   * Lit le contenu de plusieurs fichiers
   */
  async readFiles(basePath: string, relativePaths: string[]): Promise<FileContent[]> {
    const results: FileContent[] = [];
    
    for (const relativePath of relativePaths) {
      try {
        const fullPath = path.join(basePath, relativePath);
        const stats = await fs.stat(fullPath);
        
        if (stats.isFile()) {
          const content = await fs.readFile(fullPath, 'utf-8');
          results.push({
            path: relativePath,
            content
          });
        }
      } catch (error) {
        logger.warn(`Unable to read file ${relativePath}: ${error}`);
        // On continue avec les autres fichiers même si un fichier échoue
      }
    }
    
    return results;
  }

  /**
   * Vérifie si un chemin existe et est accessible
   */
  async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construit l'arbre de fichiers récursivement
   */
  private async buildTree(dirPath: string, relativePath: string, ignorePatterns: string[]): Promise<FileNode[]> {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const tree: FileNode[] = [];
    const directories: FileNode[] = [];
    const files: FileNode[] = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const itemRelativePath = path.join(relativePath, item.name).replace(/\\/g, '/');

      // Vérifier si cet élément doit être exclu
      if (this.isExcluded(itemRelativePath, ignorePatterns)) {
        continue;
      }

      if (item.isDirectory()) {
        try {
          const children = await this.buildTree(fullPath, itemRelativePath, ignorePatterns);
          directories.push({
            name: item.name,
            path: itemRelativePath,
            type: 'directory',
            children
          });
        } catch (error) {
          // Ignorer les répertoires qu'on ne peut pas lire
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

    // Trier les répertoires et fichiers alphabétiquement
    directories.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    // Retourner les répertoires d'abord, puis les fichiers
    return [...directories, ...files];
  }

  /**
   * Vérifie si un fichier doit être exclu selon les patterns d'ignore
   */
  private isExcluded(filePath: string, ignorePatterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of ignorePatterns) {
      let processedPattern = pattern;

      // Si le pattern ne contient pas de slash et ne commence pas par '**/,
      // le préfixer avec '**/' pour qu'il puisse correspondre à n'importe quel niveau
      if (!pattern.includes('/') && !pattern.startsWith('**/')) {
        processedPattern = `**/${pattern}`;
      }

      if (minimatch(normalizedPath, processedPattern)) {
        return true;
      }
    }

    return false;
  }
}