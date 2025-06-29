import { Workspace, PromptBlock, PromptComposition, FileNode } from '../store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    const errorMessage = errorBody.error || response.statusText;
    throw new ApiError(response.status, errorMessage);
  }

  // Handle empty responses for methods like DELETE
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Workspace API
export const workspaceApi = {
  getAll: (): Promise<Workspace[]> => 
    fetchApi('/api/workspaces'),

  getById: (id: string): Promise<Workspace> => 
    fetchApi(`/api/workspaces/${id}`),

  create: (data: {
    name: string;
    path: string;
    defaultCompositionId?: string;
    ignorePatterns?: string[];
    projectInfo?: string;
  }): Promise<Workspace> =>
    fetchApi('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    name?: string;
    path?: string;
    selectedFiles?: string[];
    lastFinalRequest?: string;
    defaultCompositionId?: string | null;
    ignorePatterns?: string[];
    projectInfo?: string;
  }): Promise<Workspace> =>
    fetchApi(`/api/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/api/workspaces/${id}`, {
      method: 'DELETE',
    }),

  getStructure: (id: string): Promise<FileNode[]> =>
    fetchApi(`/api/prompt/workspaces/${id}/structure`),
};

// PromptBlock API
export const blockApi = {
  getAll: (): Promise<PromptBlock[]> => 
    fetchApi('/api/blocks'),

  getById: (id: string): Promise<PromptBlock> => 
    fetchApi(`/api/blocks/${id}`),

  create: (data: {
    name: string;
    content: string;
    type: 'STATIC' | 'DYNAMIC_TASK' | 'PROJECT_STRUCTURE' | 'SELECTED_FILES_CONTENT' | 'PROJECT_INFO';
    category?: string;
    color?: string;
  }): Promise<PromptBlock> =>
    fetchApi('/api/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    name?: string;
    content?: string;
    type?: 'STATIC' | 'DYNAMIC_TASK' | 'PROJECT_STRUCTURE' | 'SELECTED_FILES_CONTENT' | 'PROJECT_INFO';
    category?: string;
    color?: string;
  }): Promise<PromptBlock> =>
    fetchApi(`/api/blocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/api/blocks/${id}`, {
      method: 'DELETE',
    }),

  getCategories: (): Promise<string[]> =>
    fetchApi('/api/blocks/categories'),
};

// PromptComposition API
export const compositionApi = {
  getAll: (): Promise<PromptComposition[]> => 
    fetchApi('/api/compositions'),

  getById: (id: string): Promise<PromptComposition> => 
    fetchApi(`/api/compositions/${id}`),

  create: (data: {
    name: string;
    blockIds: string[];
  }): Promise<PromptComposition> =>
    fetchApi('/api/compositions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    name?: string;
    blockIds?: string[];
  }): Promise<PromptComposition> =>
    fetchApi(`/api/compositions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/api/compositions/${id}`, {
      method: 'DELETE',
    }),
};

// Settings API
export const settingsApi = {
  get: (): Promise<{ id: number; globalIgnorePatterns: string[] }> =>
    fetchApi('/api/settings'),

  update: (data: {
    globalIgnorePatterns?: string[];
  }): Promise<{ id: number; globalIgnorePatterns: string[] }> =>
    fetchApi('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Prompt API - Nouvelle version modulaire
export const promptApi = {
  // Génération modulaire avec liste de blocs
  generate: (data: {
    workspaceId: string;
    orderedBlockIds: string[];
    finalRequest?: string;
    selectedFilePaths?: string[];
  }): Promise<{ prompt: string }> =>
    fetchApi('/api/prompt/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Génération depuis une composition sauvegardée
  generateFromComposition: (data: {
    workspaceId: string;
    compositionId: string;
    finalRequest?: string;
    selectedFilePaths?: string[];
  }): Promise<{ prompt: string; compositionName: string }> =>
    fetchApi('/api/prompt/generate-from-composition', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export { ApiError };