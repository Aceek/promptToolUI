import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, FileNode, PromptBlock } from '../../../store/useAppStore';
import { workspaceApi } from '../../../services/api';
import { websocketService } from '../../../services/websocket';
import { toastService } from '../../../services/toastService';

interface CompositionBlock {
  id: string;
  block: PromptBlock;
  order: number;
  uniqueId: string; // Unique identifier for rendering purposes
}

export const useMainPage = () => {
  // États locaux
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [finalRequest, setFinalRequest] = useState('');
  const [localGeneratedPrompt, setLocalGeneratedPrompt] = useState('');
  const [selectedCompositionId, setSelectedCompositionId] = useState<string | null>(null);
  const [renderedComposition, setRenderedComposition] = useState<CompositionBlock[]>([]);

  // Store Zustand
  const {
    workspaces,
    blocks,
    compositions,
    selectedWorkspace,
    selectedFiles,
    fileStructure,
    currentComposition,
    isLoading,
    error,
    setSelectedWorkspace,
    setFileStructure,
    setSelectedFiles,
    addBlockToCurrentComposition,
    removeBlockFromCurrentComposition,
    reorderCurrentComposition,
    clearCurrentComposition,
    loadCompositionIntoCurrentComposition,
    fetchWorkspaces,
    loadBlocks,
    loadCompositions,
    generatePrompt
  } = useAppStore();

  // Chargement de la structure de fichiers
  const loadFileStructure = useCallback(async () => {
    if (!selectedWorkspace) {
      setFileStructure([]);
      return;
    }

    setIsLoadingStructure(true);
    try {
      const structure = await workspaceApi.getStructure(selectedWorkspace.id);
      setFileStructure(structure);
    } catch (error) {
      console.error('Erreur lors du chargement de la structure:', error);
      setFileStructure([]);
    } finally {
      setIsLoadingStructure(false);
    }
  }, [selectedWorkspace, setFileStructure]);

  // Chargement initial des données
  useEffect(() => {
    fetchWorkspaces();
    loadBlocks();
    loadCompositions();
  }, [fetchWorkspaces, loadBlocks, loadCompositions]);

  // Chargement de la structure de fichiers quand le workspace change
  useEffect(() => {
    loadFileStructure();
  }, [loadFileStructure]);

  // Mise à jour de la composition rendue quand la composition actuelle change
  useEffect(() => {
    const newRenderedComposition = currentComposition
      .filter(compositionItem => compositionItem && compositionItem.block)
      .map((compositionItem, index) => ({
        id: compositionItem.block.id,
        block: compositionItem.block,
        order: index,
        uniqueId: compositionItem.instanceId
      }));
    setRenderedComposition(newRenderedComposition);
  }, [currentComposition]);

  // Détecter si la composition contient un bloc de tâche dynamique
  const hasDynamicTaskBlock = useMemo(() =>
    currentComposition.some(item => item.block.type === 'DYNAMIC_TASK'),
    [currentComposition]
  );

  // Gestion de la connexion WebSocket et surveillance des changements de fichiers
  useEffect(() => {
    const connectAndWatch = async () => {
      try {
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }
        
        if (selectedWorkspace) {
          await websocketService.watchWorkspace(selectedWorkspace.id);
        } else {
          websocketService.stopWatching();
        }
      } catch (error) {
        console.error("WebSocket connection/watch error:", error);
      }
    };
    connectAndWatch();

    const debouncedReload = (() => {
      let timer: any;
      return () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          loadFileStructure();
        }, 500);
      };
    })();

    const cleanup = websocketService.onFilesystemChange((event) => {
      if(event.workspaceId === selectedWorkspace?.id) {
         debouncedReload();
      }
    });

    return () => {
      cleanup();
    };
  }, [selectedWorkspace, loadFileStructure]);

  // Génération du prompt
  const handleGeneratePrompt = async () => {
    if (!selectedWorkspace) {
      toastService.error('Veuillez sélectionner un espace de travail');
      return;
    }

    if (currentComposition.length === 0) {
      toastService.error('Veuillez ajouter au moins un bloc à votre composition');
      return;
    }

    setIsGenerating(true);
    try {
      await workspaceApi.update(selectedWorkspace.id, {
        selectedFiles,
        lastFinalRequest: finalRequest,
      });

      const blockIds = currentComposition.map(item => item.block.id);

      const requestData = {
        workspaceId: selectedWorkspace.id,
        orderedBlockIds: blockIds,
        finalRequest: finalRequest && finalRequest.trim() !== '' ? finalRequest : undefined,
        selectedFilePaths: selectedFiles.length > 0 ? selectedFiles : undefined,
      };

      console.log('🔍 DEBUG - requestData envoyé:', requestData);

      const data = await generatePrompt(requestData);
      setLocalGeneratedPrompt(data.prompt);
      
      try {
        await navigator.clipboard.writeText(data.prompt);
        console.log('Prompt copié automatiquement dans le presse-papiers');
      } catch (error) {
        console.warn('Impossible de copier automatiquement le prompt:', error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toastService.error('Erreur lors de la génération du prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copie dans le presse-papiers
  const copyToClipboard = () => {
    navigator.clipboard.writeText(localGeneratedPrompt);
    toastService.success('Prompt copié dans le presse-papiers !');
  };

  // Gestion du changement de workspace
  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    setSelectedWorkspace(workspace || null);
  };

  // Gestion des blocs dans la composition
  const addBlockToComposition = (block: PromptBlock) => {
    addBlockToCurrentComposition(block);
  };

  const removeBlockFromComposition = (index: number) => {
    const instanceId = renderedComposition[index]?.uniqueId;
    if (instanceId) {
      removeBlockFromCurrentComposition(instanceId);
    }
  };

  const moveBlockInComposition = (fromIndex: number, toIndex: number) => {
    reorderCurrentComposition(fromIndex, toIndex);
  };

  // Gestion des compositions sauvegardées
  const loadComposition = (compositionId: string) => {
    loadCompositionIntoCurrentComposition(compositionId);
    setSelectedCompositionId(compositionId);
  };

  const clearComposition = () => {
    clearCurrentComposition();
    setSelectedCompositionId(null);
  };

  // Utilitaires pour la sélection de fichiers
  const getAllFilePaths = (nodes: FileNode[]): string[] => {
    let paths: string[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        paths.push(node.path);
      }
      if (node.children) {
        paths = paths.concat(getAllFilePaths(node.children));
      }
    }
    return paths;
  };

  const handleSelectAll = () => {
    setSelectedFiles(getAllFilePaths(fileStructure));
  };
  
  const handleDeselectAll = () => {
    setSelectedFiles([]);
  };

  // Groupement des blocs par catégorie
  const systemBlocks = blocks.filter(b => b.isSystemBlock);
  const customBlocks = blocks.filter(b => !b.isSystemBlock);
  
  const groupedCustomBlocks = customBlocks.reduce((acc, block) => {
    const category = block.category || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {} as Record<string, PromptBlock[]>);

  const groupedBlocks = {
    ...(systemBlocks.length > 0 && { 'Blocs Fondamentaux': systemBlocks }),
    ...groupedCustomBlocks
  };

  // Fermeture du modal de prompt généré
  const closeGeneratedPromptModal = () => {
    setLocalGeneratedPrompt('');
  };

  return {
    // États
    isGenerating,
    isLoadingStructure,
    finalRequest,
    localGeneratedPrompt,
    selectedCompositionId,
    renderedComposition,
    hasDynamicTaskBlock,
    groupedBlocks,
    
    // Store data
    workspaces,
    blocks,
    compositions,
    selectedWorkspace,
    selectedFiles,
    fileStructure,
    currentComposition,
    isLoading,
    error,
    
    // Actions
    setFinalRequest,
    handleGeneratePrompt,
    copyToClipboard,
    handleWorkspaceChange,
    addBlockToComposition,
    removeBlockFromComposition,
    moveBlockInComposition,
    loadComposition,
    clearComposition,
    handleSelectAll,
    handleDeselectAll,
    loadFileStructure,
    closeGeneratedPromptModal,
    setSelectedFiles,
  };
};