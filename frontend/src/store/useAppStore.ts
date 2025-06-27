import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Importez vos services API
import { workspaceApi, formatApi, roleApi, promptTemplateApi } from '../services/api';
// Les types Workspace, Format, Role, FileNode sont déjà définis dans ce fichier, pas besoin de les importer.

export interface Workspace {
  id: string;
  name: string;
  path: string;
  selectedFiles: string[];
  lastFinalRequest?: string | null;
  ignorePatterns: string[];
  projectInfo?: string | null;
  defaultFormatId?: string | null;
  defaultRoleId?: string | null;
  defaultPromptTemplateId?: string | null;
  defaultFormat?: Format | null;
  defaultRole?: Role | null;
  defaultPromptTemplate?: PromptTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export interface Format {
  id: string;
  name: string;
  instructions: string;
  examples: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface AppState {
  // Current workspace
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  
  // File structure
  fileStructure: FileNode[];
  selectedFiles: string[];
  
  // Prompt generation
  finalRequest: string;
  selectedFormatId: string | null;
  selectedRoleId: string | null;
  selectedPromptTemplateId: string | null;
  generatedPrompt: string;
  includeProjectInfo: boolean;
  includeStructure: boolean;
  
  // Data
  workspaces: Workspace[];
  formats: Format[];
  roles: Role[];
  promptTemplates: PromptTemplate[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setFileStructure: (structure: FileNode[]) => void;
  setSelectedFiles: (files: string[]) => void;
  setFinalRequest: (request: string) => void;
  setSelectedFormat: (formatId: string | null) => void;
  setSelectedRole: (roleId: string | null) => void;
  setSelectedPromptTemplate: (templateId: string | null) => void;
  setGeneratedPrompt: (prompt: string) => void;
  setIncludeProjectInfo: (value: boolean) => void;
  setIncludeStructure: (value: boolean) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setFormats: (formats: Format[]) => void;
  setRoles: (roles: Role[]) => void;
  setPromptTemplates: (templates: PromptTemplate[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  fetchWorkspaces: () => Promise<void>;
  fetchFormats: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchPromptTemplates: () => Promise<void>;
  
  // Computed
  getSelectedFormat: () => Format | null;
  getSelectedRole: () => Role | null;
  getSelectedPromptTemplate: () => PromptTemplate | null;
  
  // Aliases for compatibility
  selectedWorkspace: Workspace | null;
  selectedFormat: Format | null;
  selectedRole: Role | null;
  selectedPromptTemplate: PromptTemplate | null;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeWorkspaceId: null,
      activeWorkspace: null,
      fileStructure: [],
      selectedFiles: [],
      finalRequest: '',
      selectedFormatId: null,
      selectedRoleId: null,
      selectedPromptTemplateId: null,
      generatedPrompt: '',
      includeProjectInfo: true,
      includeStructure: true,
      workspaces: [],
      formats: [],
      roles: [],
      promptTemplates: [],
      isLoading: false,
      error: null,
      
      // Actions
      setActiveWorkspace: (workspace) => {
        set({
          activeWorkspace: workspace,
          activeWorkspaceId: workspace?.id || null,
          selectedFiles: workspace?.selectedFiles || [],
          finalRequest: workspace?.lastFinalRequest || '',
          selectedFormatId: workspace?.defaultFormatId || null,
          selectedRoleId: workspace?.defaultRoleId || null,
          selectedPromptTemplateId: workspace?.defaultPromptTemplateId || null,
          selectedWorkspace: workspace
        });
      },
      
      setFileStructure: (structure) => set({ fileStructure: structure }),
      
      setSelectedFiles: (files) => set({ selectedFiles: files }),
      
      setFinalRequest: (request) => set({ finalRequest: request }),
      
      setSelectedFormat: (formatId) => {
        const { formats } = get();
        const format = formats.find(f => f.id === formatId) || null;
        set({ selectedFormatId: formatId, selectedFormat: format });
      },
      
      setSelectedRole: (roleId) => {
        const { roles } = get();
        const role = roles.find(r => r.id === roleId) || null;
        set({ selectedRoleId: roleId, selectedRole: role });
      },
      
      setSelectedPromptTemplate: (templateId) => {
        const { promptTemplates } = get();
        const template = promptTemplates.find(t => t.id === templateId) || null;
        set({ selectedPromptTemplateId: templateId, selectedPromptTemplate: template });
      },
      
      setGeneratedPrompt: (prompt) => set({ generatedPrompt: prompt }),

      setIncludeProjectInfo: (value) => set({ includeProjectInfo: value }),
      setIncludeStructure: (value) => set({ includeStructure: value }),
      
      setWorkspaces: (workspaces) => set({ workspaces }),
      
      setFormats: (formats) => {
        const { selectedFormatId } = get();
        const selectedFormat = formats.find(f => f.id === selectedFormatId) || null;
        set({ formats, selectedFormat });
      },
      
      setRoles: (roles) => {
        const { selectedRoleId } = get();
        const selectedRole = roles.find(r => r.id === selectedRoleId) || null;
        set({ roles, selectedRole });
      },
      
      setPromptTemplates: (templates) => {
        const { selectedPromptTemplateId } = get();
        const selectedPromptTemplate = templates.find(t => t.id === selectedPromptTemplateId) || null;
        set({ promptTemplates: templates, selectedPromptTemplate });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      // Computed
      getSelectedFormat: () => {
        const { formats, selectedFormatId } = get();
        return formats.find(f => f.id === selectedFormatId) || null;
      },
      
      getSelectedRole: () => {
        const { roles, selectedRoleId } = get();
        return roles.find(r => r.id === selectedRoleId) || null;
      },
      
      getSelectedPromptTemplate: () => {
        const { promptTemplates, selectedPromptTemplateId } = get();
        return promptTemplates.find(t => t.id === selectedPromptTemplateId) || null;
      },
      
      // API Actions
      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          // Utilisez le service API
          const workspaces = await workspaceApi.getAll();
          set({ workspaces, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch workspaces:', error);
          set({ error: 'Failed to fetch workspaces', isLoading: false });
        }
      },
      
      fetchFormats: async () => {
        try {
          // Utilisez le service API
          const formats = await formatApi.getAll();
          set({ formats });
        } catch (error) {
          // Affichez l'erreur pour un meilleur débogage
          console.error('Failed to fetch formats:', error);
        }
      },
      
      fetchRoles: async () => {
        try {
          // Utilisez le service API
          const roles = await roleApi.getAll();
          set({ roles });
        } catch (error) {
           // Affichez l'erreur pour un meilleur débogage
          console.error('Failed to fetch roles:', error);
        }
      },
      
      fetchPromptTemplates: async () => {
        try {
          // Utilisez le service API
          const templates = await promptTemplateApi.getAll();
          set({ promptTemplates: templates });
        } catch (error) {
          // Affichez l'erreur pour un meilleur débogage
          console.error('Failed to fetch prompt templates:', error);
        }
      },
      
      // Computed aliases for compatibility
      selectedWorkspace: null as Workspace | null,
      selectedFormat: null as Format | null,
      selectedRole: null as Role | null,
      selectedPromptTemplate: null as PromptTemplate | null,
      
      setSelectedWorkspace: (workspace) => {
        set({
          activeWorkspace: workspace,
          activeWorkspaceId: workspace?.id || null,
          selectedFiles: workspace?.selectedFiles || [],
          finalRequest: workspace?.lastFinalRequest || '',
          selectedFormatId: workspace?.defaultFormatId || null,
          selectedRoleId: workspace?.defaultRoleId || null,
          selectedPromptTemplateId: workspace?.defaultPromptTemplateId || null,
          selectedWorkspace: workspace
        });
      },
    }),
    {
      name: 'ai-prompt-tool-storage',
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        finalRequest: state.finalRequest,
        selectedFormatId: state.selectedFormatId,
        selectedRoleId: state.selectedRoleId,
        selectedPromptTemplateId: state.selectedPromptTemplateId,
        includeProjectInfo: state.includeProjectInfo,
        includeStructure: state.includeStructure,
      }),
    }
  )
);
