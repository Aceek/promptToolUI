import { Workspace, Format, Role, FileNode } from '../store/useAppStore';

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
    defaultFormatId?: string;
    defaultRoleId?: string;
    defaultPromptTemplateId?: string;
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
    defaultFormatId?: string | null;
    defaultRoleId?: string | null;
    defaultPromptTemplateId?: string | null;
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

// Format API
export const formatApi = {
  getAll: (): Promise<Format[]> => 
    fetchApi('/api/formats'),

  getById: (id: string): Promise<Format> => 
    fetchApi(`/api/formats/${id}`),

  create: (data: {
    name: string;
    instructions: string;
    examples: string;
  }): Promise<Format> =>
    fetchApi('/api/formats', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    name?: string;
    instructions?: string;
    examples?: string;
  }): Promise<Format> =>
    fetchApi(`/api/formats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/api/formats/${id}`, {
      method: 'DELETE',
    }),
};

// Role API
export const roleApi = {
  getAll: (): Promise<Role[]> => 
    fetchApi('/api/roles'),

  getById: (id: string): Promise<Role> => 
    fetchApi(`/api/roles/${id}`),

  create: (data: {
    name: string;
    description: string;
  }): Promise<Role> =>
    fetchApi('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    name?: string;
    description?: string;
  }): Promise<Role> =>
    fetchApi(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/api/roles/${id}`, {
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

// Prompt API
export const promptApi = {
  generate: (data: {
    workspaceId: string;
    finalRequest?: string;
    selectedFilePaths?: string[];
    formatId?: string;
    roleId?: string;
    includeProjectInfo: boolean;
    includeStructure: boolean;
    promptTemplateId?: string;
  }): Promise<{ prompt: string }> =>
    fetchApi('/api/prompt/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Prompt Template API
export const promptTemplateApi = {
  getAll: (): Promise<any[]> => 
    fetchApi('/api/prompt-templates'),

  getById: (id: string): Promise<any> => 
    fetchApi(`/api/prompt-templates/${id}`),

  create: (data: {
    name: string;
    content: string;
  }): Promise<any> =>
    fetchApi('/api/prompt-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    name?: string;
    content?: string;
  }): Promise<any> =>
    fetchApi(`/api/prompt-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/api/prompt-templates/${id}`, {
      method: 'DELETE',
    }),
};

export { ApiError };
