export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
}

export interface FileContentRequest {
  basePath: string;
  files: string[];
}

export interface AgentConfig {
  port: number;
  host: string;
  corsOrigins: string[];
}