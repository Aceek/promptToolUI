import React from 'react';
import { useBlocksPage } from './hooks/useBlocksPage';
import { BlockFormModal } from './components/BlockFormModal';

const BLOCK_TYPES = [
  { value: 'STATIC', label: 'Statique', description: 'Bloc de texte simple' },
  { value: 'DYNAMIC_TASK', label: 'Tâche Dynamique', description: 'Injecte la demande utilisateur' },
  { value: 'PROJECT_STRUCTURE', label: 'Structure Projet', description: 'Génère l\'arborescence du projet' },
  { value: 'SELECTED_FILES_CONTENT', label: 'Contenu Fichiers', description: 'Injecte le contenu des fichiers sélectionnés' },
  { value: 'PROJECT_INFO', label: 'Info Projet', description: 'Injecte les informations du workspace' },
] as const;

interface DynamicTaskContent {
  prefix: string;
  suffix: string;
}

export default function BlocksPage() {
  const hookData = useBlocksPage();
  const {
    isLoading,
    error,
    groupedBlocks,
    openNewBlockModal,
    openEditBlockModal,
    handleDeleteBlock,
    isModalOpen,
    closeModal,
  } = hookData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Blocs</h1>
          <p className="text-gray-600">Créez et gérez vos blocs de prompt modulaires</p>
        </div>
        <button
          onClick={openNewBlockModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouveau Bloc
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => {
          const isSystemCategory = category === 'Blocs Fondamentaux';
          return (
            <div
              key={category}
              className={`rounded-lg shadow ${
                isSystemCategory
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'
                  : 'bg-white'
              }`}
            >
              <div className={`px-6 py-4 border-b ${
                isSystemCategory ? 'border-blue-200' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {isSystemCategory && <span className="text-blue-600">⚙️</span>}
                  <h2 className={`text-lg font-semibold ${
                    isSystemCategory ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {category}
                  </h2>
                  {isSystemCategory && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Système
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  isSystemCategory ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {categoryBlocks.length} bloc(s)
                  {isSystemCategory && ' - Blocs essentiels non supprimables'}
                </p>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {block.isSystemBlock && (
                            <span className="text-gray-500" title="Bloc Système">⚙️</span>
                          )}
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: block.color || '#6B7280' }}
                          ></div>
                          <h3 className="font-medium text-gray-900 truncate">{block.name}</h3>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => openEditBlockModal(block)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Modifier
                          </button>
                          {block.systemBehavior !== 'INDELETABLE' && (
                            <button
                              onClick={() => handleDeleteBlock(block.id, block.name)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {BLOCK_TYPES.find(t => t.value === block.type)?.label || block.type}
                        </span>
                        {block.isSystemBlock && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-2">
                            Système
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {block.type === 'DYNAMIC_TASK' ? (
                          (() => {
                            try {
                              const taskContent: DynamicTaskContent = JSON.parse(block.content);
                              return `${taskContent.prefix} [TÂCHE UTILISATEUR] ${taskContent.suffix}`.substring(0, 100);
                            } catch (e) {
                              return block.content.substring(0, 100);
                            }
                          })()
                        ) : (
                          block.content.substring(0, 100)
                        )}
                        {block.content.length > 100 && '...'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* La modale est maintenant un composant séparé */}
      <BlockFormModal {...hookData} isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}