import React from 'react';
import { useCompositionsPage } from './hooks/useCompositionsPage';
import { CompositionFormModal } from './components/CompositionFormModal';

export default function CompositionsPage() {
  const hookData = useCompositionsPage();
  const {
    compositions,
    isLoading,
    error,
    isModalOpen,
    openNewCompositionModal,
    openEditCompositionModal,
    handleDeleteComposition,
    closeModal,
    getBlockById,
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Compositions</h1>
          <p className="text-gray-600">Créez et gérez vos compositions de blocs</p>
        </div>
        <button
          onClick={openNewCompositionModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvelle Composition
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {compositions.map((composition) => (
          <div
            key={composition.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-gray-900">{composition.name}</h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => openEditCompositionModal(composition)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteComposition(composition.id, composition.name)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {composition.blocks.length} bloc(s)
            </div>
            
            <div className="mt-3 space-y-1">
              {composition.blocks
                .sort((a, b) => a.order - b.order)
                .slice(0, 3)
                .map((cb) => {
                  const block = getBlockById(cb.blockId);
                  return block ? (
                    <div key={cb.blockId} className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: block.color || '#6B7280' }}
                      ></div>
                      <span className="text-xs text-gray-600 truncate">{block.name}</span>
                    </div>
                  ) : null;
                })}
              {composition.blocks.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{composition.blocks.length - 3} autres blocs...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* La modale est maintenant un composant séparé */}
      <CompositionFormModal {...hookData} isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}