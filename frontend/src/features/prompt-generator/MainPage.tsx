import React from 'react';
import { useMainPage } from './hooks/useMainPage';
import { BlockLibrary } from './components/BlockLibrary';
import { CurrentComposition } from './components/CurrentComposition';
import { FileSelector } from './components/FileSelector';
import { GeneratedPromptModal } from './components/GeneratedPromptModal';

const MainPage = () => {
  const {
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
  } = useMainPage();

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
        <BlockLibrary
          blocks={Object.values(groupedBlocks).flat()}
          compositions={compositions}
          selectedCompositionId={selectedCompositionId}
          groupedBlocks={groupedBlocks}
          onAddBlock={addBlockToComposition}
          onLoadComposition={loadComposition}
        />

        {/* Panneau de droite - Zone d'assemblage */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Composition actuelle */}
          <CurrentComposition
            currentComposition={currentComposition}
            renderedComposition={renderedComposition}
            hasDynamicTaskBlock={hasDynamicTaskBlock}
            finalRequest={finalRequest}
            onFinalRequestChange={setFinalRequest}
            onClearComposition={clearComposition}
            onRemoveBlock={removeBlockFromComposition}
            onMoveBlock={moveBlockInComposition}
          />

          {/* Configuration et fichiers */}
          <FileSelector
            selectedWorkspace={selectedWorkspace}
            fileStructure={fileStructure}
            selectedFiles={selectedFiles}
            isLoadingStructure={isLoadingStructure}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onRefreshStructure={loadFileStructure}
            onSelectionChange={setSelectedFiles}
          />

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
      <GeneratedPromptModal
        isOpen={!!localGeneratedPrompt}
        prompt={localGeneratedPrompt}
        onCopy={copyToClipboard}
        onClose={closeGeneratedPromptModal}
      />
    </div>
  );
};

export default MainPage;