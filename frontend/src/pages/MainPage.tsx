import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, FileNode, PromptBlock } from '../store/useAppStore';
import { workspaceApi } from '../services/api';
import { websocketService } from '../services/websocket';
import { FileTree } from '../components';

interface CompositionBlock {
  id: string;
  block: PromptBlock;
  order: number;
}

const MainPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [currentComposition, setCurrentComposition] = useState<CompositionBlock[]>([]);
  const [finalRequest, setFinalRequest] = useState('');
  const [localGeneratedPrompt, setLocalGeneratedPrompt] = useState('');
  const [selectedCompositionId, setSelectedCompositionId] = useState<string | null>(null);

  const {
    workspaces,
    blocks,
    compositions,
    selectedWorkspace,
    selectedFiles,
    fileStructure,
    includeProjectInfo,
    includeStructure,
    isLoading,
    error,
    setSelectedWorkspace,
    setFileStructure,
    setSelectedFiles,
    setIncludeProjectInfo,
    setIncludeStructure,
    fetchWorkspaces,
    loadBlocks,
    loadCompositions,
    generatePrompt
  } = useAppStore();

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

  useEffect(() => {
    fetchWorkspaces();
    loadBlocks();
    loadCompositions();
  }, [fetchWorkspaces, loadBlocks, loadCompositions]);

  useEffect(() => {
    loadFileStructure();
  }, [loadFileStructure]);

  // Gère la connexion WebSocket et l'abonnement aux changements de fichiers
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

  const handleGeneratePrompt = async () => {
    if (!selectedWorkspace) {
      alert('Veuillez sélectionner un espace de travail');
      return;
    }

    if (currentComposition.length === 0) {
      alert('Veuillez ajouter au moins un bloc à votre composition');
      return;
    }

    setIsGenerating(true);
    try {
      await workspaceApi.update(selectedWorkspace.id, {
        selectedFiles,
        lastFinalRequest: finalRequest,
      });

      const blockIds = currentComposition
        .sort((a, b) => a.order - b.order)
        .map(cb => cb.block.id);

      // 🪲 DEBUG: Logs pour diagnostiquer le problème
      console.log('🔍 DEBUG - currentComposition:', currentComposition);
      console.log('🔍 DEBUG - blockIds extraits:', blockIds);
      console.log('🔍 DEBUG - blockIds.length:', blockIds.length);

      const requestData = {
        workspaceId: selectedWorkspace.id,
        orderedBlockIds: blockIds, // 🔧 FIX: Correction du nom du paramètre
        includeProjectInfo,
        includeStructure,
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
      alert('Erreur lors de la génération du prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localGeneratedPrompt);
    alert('Prompt copié dans le presse-papiers !');
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    setSelectedWorkspace(workspace || null);
  };

  const addBlockToComposition = (block: PromptBlock) => {
    const newOrder = Math.max(...currentComposition.map(cb => cb.order), -1) + 1;
    const compositionBlock: CompositionBlock = {
      id: `${block.id}-${Date.now()}`,
      block,
      order: newOrder
    };
    setCurrentComposition([...currentComposition, compositionBlock]);
  };

  const removeBlockFromComposition = (compositionBlockId: string) => {
    setCurrentComposition(currentComposition.filter(cb => cb.id !== compositionBlockId));
  };

  const moveBlockInComposition = (fromIndex: number, toIndex: number) => {
    const newComposition = [...currentComposition];
    const [removed] = newComposition.splice(fromIndex, 1);
    newComposition.splice(toIndex, 0, removed);
    
    // Réorganiser les ordres
    newComposition.forEach((cb, index) => {
      cb.order = index;
    });
    
    setCurrentComposition(newComposition);
  };

  const loadComposition = (compositionId: string) => {
    const composition = compositions.find(c => c.id === compositionId);
    if (composition) {
      const compositionBlocks: CompositionBlock[] = composition.blocks
        .sort((a, b) => a.order - b.order)
        .map((cb, index) => ({
          id: `${cb.blockId}-${Date.now()}-${index}`,
          block: cb.block,
          order: index
        }));
      setCurrentComposition(compositionBlocks);
      setSelectedCompositionId(compositionId);
    }
  };

  const clearComposition = () => {
    setCurrentComposition([]);
    setSelectedCompositionId(null);
  };

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

  // Grouper les blocs par catégorie
  const groupedBlocks = blocks.reduce((acc, block) => {
    const category = block.category || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {} as Record<string, PromptBlock[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Générateur de Prompts Modulaire</h1>
            <p className="text-gray-600">Assemblez vos blocs pour créer des prompts personnalisés</p>
          </div>
          
          {/* Sélecteur de workspace */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Espace de travail
              </label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedWorkspace?.id || ''}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
              >
                <option value="">Sélectionner un espace de travail</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panneau de gauche - Bibliothèque de blocs */}
        <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bibliothèque de Blocs</h2>
              <span className="text-sm text-gray-500">{blocks.length} blocs</span>
            </div>

            {/* Compositions sauvegardées */}
            {compositions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Compositions sauvegardées</h3>
                <div className="space-y-1">
                  {compositions.map((composition) => (
                    <button
                      key={composition.id}
                      onClick={() => loadComposition(composition.id)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedCompositionId === composition.id
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{composition.name}</div>
                      <div className="text-xs text-gray-500">{composition.blocks.length} blocs</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Blocs par catégorie */}
            <div className="space-y-4">
              {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
                  <div className="space-y-1">
                    {categoryBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => addBlockToComposition(block)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: block.color || '#6B7280' }}
                          ></div>
                          <span className="font-medium text-sm">{block.name}</span>
                        </div>
                        {block.description && (
                          <p className="text-xs text-gray-500 mt-1">{block.description}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Type: {block.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panneau de droite - Zone d'assemblage */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Composition actuelle */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Composition Actuelle ({currentComposition.length} blocs)
              </h2>
              <button
                onClick={clearComposition}
                className="text-red-600 hover:text-red-800 text-sm"
                disabled={currentComposition.length === 0}
              >
                Vider
              </button>
            </div>

            {currentComposition.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p className="text-lg mb-2">Votre composition est vide</p>
                <p className="text-sm">Cliquez sur les blocs de gauche pour les ajouter à votre composition</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentComposition
                  .sort((a, b) => a.order - b.order)
                  .map((compositionBlock, index) => (
                    <div
                      key={compositionBlock.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: compositionBlock.block.color || '#6B7280' }}
                        ></div>
                        <div>
                          <span className="font-medium text-sm">{compositionBlock.block.name}</span>
                          {compositionBlock.block.description && (
                            <p className="text-xs text-gray-500">{compositionBlock.block.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {index > 0 && (
                          <button
                            onClick={() => moveBlockInComposition(index, index - 1)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ↑
                          </button>
                        )}
                        {index < currentComposition.length - 1 && (
                          <button
                            onClick={() => moveBlockInComposition(index, index + 1)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={() => removeBlockFromComposition(compositionBlock.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Configuration et fichiers */}
            {selectedWorkspace && (
              <div className="mt-6 space-y-4">
                {/* Options de configuration */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeProjectInfo"
                        checked={includeProjectInfo}
                        onChange={(e) => setIncludeProjectInfo(e.target.checked)}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="includeProjectInfo" className="text-sm text-gray-700">
                        Inclure les informations du projet
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeStructure"
                        checked={includeStructure}
                        onChange={(e) => setIncludeStructure(e.target.checked)}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="includeStructure" className="text-sm text-gray-700">
                        Inclure la structure du projet
                      </label>
                    </div>
                  </div>
                </div>

                {/* Demande finale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Demande finale
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Décrivez ce que vous voulez que l'IA fasse..."
                    value={finalRequest}
                    onChange={(e) => setFinalRequest(e.target.value)}
                  />
                </div>

                {/* Sélection de fichiers */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Fichiers à inclure ({selectedFiles.length} sélectionné{selectedFiles.length !== 1 ? 's' : ''})
                    </label>
                    <div className="flex items-center space-x-2">
                      <button onClick={handleSelectAll} className="text-blue-600 hover:text-blue-800 text-xs">Tout sél.</button>
                      <button onClick={handleDeselectAll} className="text-blue-600 hover:text-blue-800 text-xs">Tout désél.</button>
                      <button onClick={loadFileStructure} className="text-blue-600 hover:text-blue-800 text-xs" title="Rafraîchir l'arborescence">
                        {isLoadingStructure ? '...' : '🔄'}
                      </button>
                    </div>
                  </div>
                  
                  {isLoadingStructure ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      Chargement de la structure...
                    </div>
                  ) : fileStructure.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-auto bg-white">
                      <FileTree
                        nodes={fileStructure}
                        selectedFiles={selectedFiles}
                        onSelectionChange={setSelectedFiles}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                      Aucun fichier trouvé dans ce workspace
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer avec bouton de génération */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {currentComposition.length > 0 && (
                  <span>{currentComposition.length} bloc(s) dans la composition</span>
                )}
              </div>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={handleGeneratePrompt}
                disabled={isGenerating || !selectedWorkspace || currentComposition.length === 0}
              >
                {isGenerating ? 'Génération...' : 'Générer le Prompt'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de prompt généré */}
      {localGeneratedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Prompt Généré</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📋 Copier
                  </button>
                  <button
                    onClick={() => setLocalGeneratedPrompt('')}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-auto whitespace-pre-wrap max-h-96">
                {localGeneratedPrompt}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
