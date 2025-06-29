import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { workspaceApi, blockApi, compositionApi, settingsApi, promptApi } from '../api';

// Nouveaux types pour l'architecture modulaire
export interface PromptBlock {
  id: string;
  name: string;
  content: string;
  type: 'STATIC' | 'DYNAMIC_TASK' | 'PROJECT_STRUCTURE' | 'SELECTED_FILES_CONTENT' | 'PROJECT_INFO';
  isSystemBlock?: boolean;
  systemBehavior?: 'NONE' | 'SYSTEM' | 'INDELETABLE';
  category?: string;
  color?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptCompositionBlock {
  id: string;
  compositionId: string;
  blockId: string;
  order: number;
  block: PromptBlock;
}

export interface PromptComposition {
  id: string;
  name: string;
  blocks: PromptCompositionBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface CurrentCompositionItem {
  instanceId: string; // Un ID unique pour cette instance dans la liste
  block: PromptBlock;
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  selectedFiles: string[];
  lastFinalRequest?: string | null;
  ignorePatterns: string[];
  projectInfo?: string | null;
  defaultCompositionId?: string | null;
  defaultComposition?: PromptComposition | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

interface Settings {
  globalIgnorePatterns: string[];
}

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AppState {
  // État des workspaces
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  fileStructure: FileNode[];
  
  // État des blocs et compositions
  blocks: PromptBlock[];
  compositions: PromptComposition[];
  currentComposition: CurrentCompositionItem[]; // Composition en cours de création
  
  // État des settings
  settings: Settings | null;
  
  // État de l'interface
  selectedFiles: string[];
  isLoading: boolean;
  error: string | null;
  
  // État de confirmation
  confirmation: ConfirmationState;
  
  // Actions pour les workspaces
  fetchWorkspaces: () => Promise<void>;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (data: { name: string; path: string; defaultCompositionId?: string; ignorePatterns?: string[]; projectInfo?: string }) => Promise<void>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  loadFileStructure: (workspaceId: string) => Promise<void>;
  setFileStructure: (structure: FileNode[]) => void;
  
  // Actions pour les blocs
  loadBlocks: () => Promise<void>;
  createBlock: (data: { name: string; content: string; type: PromptBlock['type']; category?: string; color?: string }) => Promise<void>;
  updateBlock: (id: string, data: Partial<PromptBlock>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  
  // Actions pour les compositions
  loadCompositions: () => Promise<void>;
  createComposition: (data: { name: string; blockIds: string[] }) => Promise<void>;
  updateComposition: (id: string, data: { name?: string; blockIds?: string[] }) => Promise<void>;
  deleteComposition: (id: string) => Promise<void>;
  
  // Actions pour la composition en cours
  addBlockToCurrentComposition: (block: PromptBlock) => void;
  removeBlockFromCurrentComposition: (instanceId: string) => void;
  reorderCurrentComposition: (fromIndex: number, toIndex: number) => void;
  clearCurrentComposition: () => void;
  loadCompositionIntoCurrentComposition: (compositionId: string) => void;
  
  // Actions pour la génération de prompt
  setSelectedFiles: (files: string[]) => void;
  generatePrompt: (data: { workspaceId: string; orderedBlockIds: string[]; finalRequest?: string; selectedFilePaths?: string[] }) => Promise<any>;
  
  // Actions utilitaires
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions pour les settings
  loadSettings: () => Promise<void>;
  updateSettings: (data: { globalIgnorePatterns: string[] }) => Promise<void>;
  
  // Actions de confirmation
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirmation: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // État initial
      workspaces: [],
      selectedWorkspace: null,
      fileStructure: [],
      blocks: [],
      compositions: [],
      currentComposition: [],
      settings: null,
      selectedFiles: [],
      isLoading: false,
      error: null,
      
      // État de confirmation initial
      confirmation: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
      },

      // Actions pour les workspaces
      fetchWorkspaces: async () => {
        try {
          set({ isLoading: true, error: null });
          const workspaces = await workspaceApi.getAll();
          set({ workspaces, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load workspaces', isLoading: false });
          throw error;
        }
      },

      setSelectedWorkspace: (workspace) => {
        set({
          selectedWorkspace: workspace,
          selectedFiles: workspace?.selectedFiles || []
        });
      },

      setFileStructure: (structure) => {
        set({ fileStructure: structure });
      },

      createWorkspace: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const newWorkspace = await workspaceApi.create(data);
          const workspaces = [...get().workspaces, newWorkspace];
          set({ workspaces, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create workspace', isLoading: false });
          throw error;
        }
      },

      updateWorkspace: async (id, data) => {
        try {
          set({ isLoading: true, error: null });
          const updatedWorkspace = await workspaceApi.update(id, data as any);
          const workspaces = get().workspaces.map(w => w.id === id ? updatedWorkspace : w);
          const selectedWorkspace = get().selectedWorkspace?.id === id ? updatedWorkspace : get().selectedWorkspace;
          set({ workspaces, selectedWorkspace, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update workspace', isLoading: false });
          throw error;
        }
      },

      deleteWorkspace: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await workspaceApi.delete(id);
          const workspaces = get().workspaces.filter(w => w.id !== id);
          const selectedWorkspace = get().selectedWorkspace?.id === id ? null : get().selectedWorkspace;
          set({ workspaces, selectedWorkspace, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete workspace', isLoading: false });
          throw error;
        }
      },

      loadFileStructure: async (workspaceId) => {
        try {
          set({ isLoading: true, error: null });
          const fileStructure = await workspaceApi.getStructure(workspaceId);
          set({ fileStructure, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load file structure', isLoading: false });
          throw error;
        }
      },

      // Actions pour les blocs
      loadBlocks: async () => {
        try {
          set({ isLoading: true, error: null });
          const blocks = await blockApi.getAll();
          set({ blocks, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load blocks', isLoading: false });
          throw error;
        }
      },

      createBlock: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const newBlock = await blockApi.create(data);
          const blocks = [...get().blocks, newBlock];
          set({ blocks, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create block', isLoading: false });
          throw error;
        }
      },

      updateBlock: async (id, data) => {
        try {
          set({ isLoading: true, error: null });
          const updatedBlock = await blockApi.update(id, data);
          const blocks = get().blocks.map(b => b.id === id ? updatedBlock : b);
          set({ blocks, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update block', isLoading: false });
          throw error;
        }
      },

      deleteBlock: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await blockApi.delete(id);
          const blocks = get().blocks.filter(b => b.id !== id);
          set({ blocks, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete block', isLoading: false });
          throw error;
        }
      },

      // Actions pour les compositions
      loadCompositions: async () => {
        try {
          set({ isLoading: true, error: null });
          const compositions = await compositionApi.getAll();
          set({ compositions, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load compositions', isLoading: false });
          throw error;
        }
      },

      createComposition: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const newComposition = await compositionApi.create(data);
          const compositions = [...get().compositions, newComposition];
          set({ compositions, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create composition', isLoading: false });
          throw error;
        }
      },

      updateComposition: async (id, data) => {
        try {
          set({ isLoading: true, error: null });
          const updatedComposition = await compositionApi.update(id, data);
          const compositions = get().compositions.map(c => c.id === id ? updatedComposition : c);
          set({ compositions, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update composition', isLoading: false });
          throw error;
        }
      },

      deleteComposition: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await compositionApi.delete(id);
          const compositions = get().compositions.filter(c => c.id !== id);
          set({ compositions, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete composition', isLoading: false });
          throw error;
        }
      },

      // Actions pour la composition en cours
      addBlockToCurrentComposition: (block) => {
        const instanceId = crypto.randomUUID();
        const currentComposition = [...get().currentComposition, { instanceId, block }];
        set({ currentComposition });
      },

      removeBlockFromCurrentComposition: (instanceId) => {
        const currentComposition = get().currentComposition.filter(item => item.instanceId !== instanceId);
        set({ currentComposition });
      },

      reorderCurrentComposition: (fromIndex, toIndex) => {
        const currentComposition = [...get().currentComposition];
        const [removed] = currentComposition.splice(fromIndex, 1);
        currentComposition.splice(toIndex, 0, removed);
        set({ currentComposition });
      },

      clearCurrentComposition: () => {
        set({ currentComposition: [] });
      },

      loadCompositionIntoCurrentComposition: (compositionId) => {
        const composition = get().compositions.find(c => c.id === compositionId);
        if (composition) {
          const currentComposition = composition.blocks
            .sort((a, b) => a.order - b.order)
            .map(cb => ({
              instanceId: crypto.randomUUID(),
              block: cb.block
            }));
          set({ currentComposition });
        }
      },

      // Actions pour la génération de prompt
      setSelectedFiles: (files) => {
        set({ selectedFiles: files });
      },

      generatePrompt: async (data: { workspaceId: string; orderedBlockIds: string[]; finalRequest?: string; selectedFilePaths?: string[] }) => {
        try {
          set({ isLoading: true, error: null });
          
          const result = await promptApi.generate(data);
          set({ isLoading: false });
          return result;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to generate prompt', isLoading: false });
          throw error;
        }
      },

      // Actions pour les settings
      loadSettings: async () => {
        try {
          set({ isLoading: true, error: null });
          const settings = await settingsApi.get();
          set({ settings: { globalIgnorePatterns: settings.globalIgnorePatterns }, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load settings', isLoading: false });
          throw error;
        }
      },

      updateSettings: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const updatedSettings = await settingsApi.update(data);
          set({ settings: { globalIgnorePatterns: updatedSettings.globalIgnorePatterns }, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update settings', isLoading: false });
          throw error;
        }
      },

      // Actions utilitaires
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Actions de confirmation
      showConfirmation: (title, message, onConfirm) => {
        set({
          confirmation: {
            isOpen: true,
            title,
            message,
            onConfirm,
          },
        });
      },
      
      hideConfirmation: () => {
        set({
          confirmation: {
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {},
          },
        });
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        selectedWorkspace: state.selectedWorkspace,
        selectedFiles: state.selectedFiles,
        currentComposition: state.currentComposition,
        settings: state.settings,
      }),
    }
  )
);
