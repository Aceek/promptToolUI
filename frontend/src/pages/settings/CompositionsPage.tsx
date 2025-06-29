import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PromptComposition, PromptBlock } from '../../store/useAppStore';

export default function CompositionsPage() {
  const { 
    compositions, 
    blocks,
    loadCompositions, 
    loadBlocks,
    createComposition, 
    updateComposition, 
    deleteComposition, 
    isLoading, 
    error 
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposition, setEditingComposition] = useState<PromptComposition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    selectedBlockIds: [] as string[]
  });

  useEffect(() => {
    loadCompositions();
    loadBlocks();
  }, [loadCompositions, loadBlocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingComposition) {
        await updateComposition(editingComposition.id, {
          name: formData.name,
          blockIds: formData.selectedBlockIds
        });
      } else {
        await createComposition({
          name: formData.name,
          blockIds: formData.selectedBlockIds
        });
      }
      
      setIsModalOpen(false);
      setEditingComposition(null);
      setFormData({
        name: '',
        selectedBlockIds: []
      });
    } catch (error) {
      console.error('Failed to save composition:', error);
    }
  };

  const handleEdit = (composition: PromptComposition) => {
    setEditingComposition(composition);
    setFormData({
      name: composition.name,
      selectedBlockIds: composition.blocks
        .sort((a, b) => a.order - b.order)
        .map(cb => cb.blockId)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette composition ?')) {
      await deleteComposition(id);
    }
  };

  const handleBlockToggle = (blockId: string) => {
    const isSelected = formData.selectedBlockIds.includes(blockId);
    if (isSelected) {
      setFormData({
        ...formData,
        selectedBlockIds: formData.selectedBlockIds.filter(id => id !== blockId)
      });
    } else {
      setFormData({
        ...formData,
        selectedBlockIds: [...formData.selectedBlockIds, blockId]
      });
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newSelectedBlockIds = [...formData.selectedBlockIds];
    const [removed] = newSelectedBlockIds.splice(fromIndex, 1);
    newSelectedBlockIds.splice(toIndex, 0, removed);
    setFormData({
      ...formData,
      selectedBlockIds: newSelectedBlockIds
    });
  };

  const getBlockById = (id: string) => blocks.find(b => b.id === id);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Compositions</h1>
          <p className="text-gray-600">Créez et gérez vos assemblages de blocs sauvegardés</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouvelle Composition
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {compositions.map((composition) => (
          <div
            key={composition.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{composition.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(composition)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(composition.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {composition.blocks.length} bloc(s)
              </p>
              
              <div className="space-y-1">
                {composition.blocks
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 3)
                  .map((cb, index) => (
                    <div key={cb.id} className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{index + 1}.</span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cb.block.color || '#6B7280' }}
                      ></div>
                      <span className="text-sm text-gray-700 truncate">
                        {cb.block.name}
                      </span>
                    </div>
                  ))}
                {composition.blocks.length > 3 && (
                  <p className="text-xs text-gray-500">
                    ... et {composition.blocks.length - 3} autre(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingComposition ? 'Modifier la composition' : 'Nouvelle composition'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la composition
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Blocs disponibles */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Blocs disponibles</h3>
                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
                        <div key={category} className="border-b border-gray-100 last:border-b-0">
                          <div className="bg-gray-50 px-3 py-2">
                            <h4 className="text-sm font-medium text-gray-700">{category}</h4>
                          </div>
                          <div className="p-2 space-y-1">
                            {categoryBlocks.map((block) => (
                              <div
                                key={block.id}
                                className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                  formData.selectedBlockIds.includes(block.id) ? 'bg-blue-50 border border-blue-200' : ''
                                }`}
                                onClick={() => handleBlockToggle(block.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.selectedBlockIds.includes(block.id)}
                                  onChange={() => handleBlockToggle(block.id)}
                                  className="rounded border-gray-300"
                                />
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: block.color || '#6B7280' }}
                                ></div>
                                <span className="text-sm text-gray-900 flex-1">{block.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Composition actuelle */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Composition ({formData.selectedBlockIds.length} blocs)
                    </h3>
                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      {formData.selectedBlockIds.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          Sélectionnez des blocs pour créer votre composition
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {formData.selectedBlockIds.map((blockId, index) => {
                            const block = getBlockById(blockId);
                            if (!block) return null;
                            
                            return (
                              <div
                                key={`${blockId}-${index}`}
                                className="flex items-center space-x-2 p-2 bg-gray-50 rounded border"
                              >
                                <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: block.color || '#6B7280' }}
                                ></div>
                                <span className="text-sm text-gray-900 flex-1">{block.name}</span>
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
                                  {index < formData.selectedBlockIds.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => moveBlock(index, index + 1)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      ↓
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleBlockToggle(blockId)}
                                    className="text-red-400 hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingComposition(null);
                      setFormData({
                        name: '',
                        selectedBlockIds: []
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={formData.selectedBlockIds.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {editingComposition ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}