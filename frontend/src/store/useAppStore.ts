import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Workspace {
  id: string;
  name: string;
  path: string;
  selectedFiles: string[];
  lastFinalRequest?: string | null;
  ignorePatterns: string[];
  defaultFormatId?: string | null;
  defaultRoleId?: string | null;
  defaultFormat?: Format | null;
  defaultRole?: Role | null;
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
  generatedPrompt: string;
  
  // Data
  workspaces: Workspace[];
  formats: Format[];
  roles: Role[];
  
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
  setGeneratedPrompt: (prompt: string) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setFormats: (formats: Format[]) => void;
  setRoles: (roles: Role[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  fetchWorkspaces: () => Promise<void>;
  fetchFormats: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  
  // Computed
  getSelectedFormat: () => Format | null;
  getSelectedRole: () => Role | null;
  
  // Aliases for compatibility
  selectedWorkspace: Workspace | null;
  selectedFormat: Format | null;
  selectedRole: Role | null;
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
      generatedPrompt: '',
      workspaces: [],
      formats: [],
      roles: [],
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
          selectedRoleId: workspace?.defaultRoleId || null
        });
      },
      
      setFileStructure: (structure) => set({ fileStructure: structure }),
      
      setSelectedFiles: (files) => set({ selectedFiles: files }),
      
      setFinalRequest: (request) => set({ finalRequest: request }),
      
      setSelectedFormat: (formatId) => set({ selectedFormatId: formatId }),
      
      setSelectedRole: (roleId) => set({ selectedRoleId: roleId }),
      
      setGeneratedPrompt: (prompt) => set({ generatedPrompt: prompt }),
      
      setWorkspaces: (workspaces) => set({ workspaces }),
      
      setFormats: (formats) => set({ formats }),
      
      setRoles: (roles) => set({ roles }),
      
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
      
      // API Actions
      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/workspaces');
          if (response.ok) {
            const workspaces = await response.json();
            set({ workspaces, isLoading: false });
          } else {
            set({ error: 'Failed to fetch workspaces', isLoading: false });
          }
        } catch (error) {
          set({ error: 'Network error', isLoading: false });
        }
      },
      
      fetchFormats: async () => {
        try {
          const response = await fetch('/api/formats');
          if (response.ok) {
            const formats = await response.json();
            set({ formats });
          }
        } catch (error) {
          console.error('Failed to fetch formats:', error);
        }
      },
      
      fetchRoles: async () => {
        try {
          const response = await fetch('/api/roles');
          if (response.ok) {
            const roles = await response.json();
            set({ roles });
          }
        } catch (error) {
          console.error('Failed to fetch roles:', error);
        }
      },
      
      // Computed aliases for compatibility
      get selectedWorkspace() {
        return get().activeWorkspace;
      },
      
      get selectedFormat() {
        return get().getSelectedFormat();
      },
      
      get selectedRole() {
        return get().getSelectedRole();
      },
      
      setSelectedWorkspace: (workspace) => {
        get().setActiveWorkspace(workspace);
      },
    }),
    {
      name: 'ai-prompt-tool-storage',
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        finalRequest: state.finalRequest,
        selectedFormatId: state.selectedFormatId,
        selectedRoleId: state.selectedRoleId,
      }),
    }
  )
);