import React from 'react';
import { useCompositionsPage } from '../hooks/useCompositionsPage';

type CompositionFormModalProps = ReturnType<typeof useCompositionsPage> & {
  isOpen: boolean;
  onClose: () => void;
};

export const CompositionFormModal: React.FC<CompositionFormModalProps> = ({
  isOpen,
  onClose,
  handleSubmit,
  onSubmit,
  register,
  errors,
  isSubmitting,
  editingComposition,
  groupedBlocks,
  watchedSelectedBlockIds,
  handleBlockToggle,
  moveBlock,
  getBlockById,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingComposition ? 'Modifier la composition' : 'Nouvelle composition'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la composition
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: Prompt Expert React"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sélection des blocs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Blocs disponibles</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => {
                    const isSystemCategory = category === 'Blocs Fondamentaux';
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className={`text-sm font-medium ${
                          isSystemCategory ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          {isSystemCategory && '⚙️ '}{category}
                        </h4>
                        <div className="space-y-1">
                          {categoryBlocks.map((block) => (
                            <div
                              key={block.id}
                              className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                                (watchedSelectedBlockIds || []).includes(block.id) ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                              onClick={() => handleBlockToggle(block.id)}
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={(watchedSelectedBlockIds || []).includes(block.id)}
                                  onChange={() => handleBlockToggle(block.id)}
                                  className="rounded"
                                />
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: block.color || '#6B7280' }}
                                ></div>
                                <span className="text-sm font-medium">{block.name}</span>
                                {block.isSystemBlock && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                    Système
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {block.content.substring(0, 100)}
                                {block.content.length > 100 && '...'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Aperçu de la composition */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Composition ({(watchedSelectedBlockIds || []).length} blocs)
                </h3>
                <div className="border border-gray-200 rounded-lg p-4 min-h-96 max-h-96 overflow-y-auto">
                  {(watchedSelectedBlockIds || []).length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Sélectionnez des blocs pour créer votre composition</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(watchedSelectedBlockIds || []).map((blockId, index) => {
                        const block = getBlockById(blockId);
                        if (!block) return null;
                        
                        return (
                          <div
                            key={blockId}
                            className="border border-gray-200 rounded p-3 bg-gray-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: block.color || '#6B7280' }}
                                ></div>
                                <span className="text-sm font-medium">{block.name}</span>
                              </div>
                              <div className="flex space-x-1">
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => moveBlock(index, index - 1)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    ↑
                                  </button>
                                )}
                                {index < (watchedSelectedBlockIds || []).length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => moveBlock(index, index + 1)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    ↓
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {block.content.substring(0, 150)}
                              {block.content.length > 150 && '...'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {errors.selectedBlockIds && (
                  <p className="text-red-500 text-sm mt-1">{errors.selectedBlockIds.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (watchedSelectedBlockIds || []).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sauvegarde...' : (editingComposition ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};