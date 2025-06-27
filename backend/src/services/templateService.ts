import * as path from 'path';
import * as fs from 'fs/promises';
import { Environment } from 'nunjucks';

export class TemplateService {
  private env: Environment;
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(process.cwd(), 'prompts');
    this.env = new Environment();
  }

  /**
   * Charge un template depuis le dossier prompts/
   */
  async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, templateName);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      return templateContent;
    } catch (error) {
      throw new Error(`Failed to load template ${templateName}: ${error}`);
    }
  }

  /**
   * Rend un template avec les données fournies
   */
  renderTemplate(templateContent: string, context: any): string {
    try {
      return this.env.renderString(templateContent, context);
    } catch (error) {
      throw new Error(`Failed to render template: ${error}`);
    }
  }

  /**
   * Liste tous les templates disponibles
   */
  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesPath);
      return files.filter(file => file.endsWith('.njk'));
    } catch (error) {
      throw new Error(`Failed to list templates: ${error}`);
    }
  }
}