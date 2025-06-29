import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '../../store/useAppStore';
import { PromptComposition, PromptBlock } from '../../store/useAppStore';
import { compositionFormSchema, CompositionFormData } from '../../schemas/composition.schema';
import { toastService } from '../../services/toastService';

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
    error,
    showConfirmation
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposition, setEditingComposition] = useState<PromptComposition | null>(null);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CompositionFormData>({
    resolver: zodResolver(compositionFormSchema),
    defaultValues: {
      name: '',
      selectedBlockIds: []
    }
  });

  const watchedSelectedBlockIds = watch('selectedBlockIds');

  useEffect(() => {
    loadCompositions();
    loadBlocks();
  }, [loadCompositions, loadBlocks]);

  const onSubmit: SubmitHandler<CompositionFormData> = async (data) => {
    const promise = editingComposition
      ? updateComposition(editingComposition.id, {
          name: data.name,
          blockIds: data.selectedBlockIds
        })
      : createComposition({
          name: data.name,
          blockIds: data.selectedBlockIds
        });

    toastService.promise(promise, {
      loading: 'Sauvegarde en cours...',
      success: editingComposition 
        ? 'Composition mise à jour avec succès !' 
        : 'Composition créée avec succès !',
      error: 'Erreur lors de la sauvegarde de la composition.',
    });

    try {
      await promise;
      setIsModalOpen(false);
      setEditingComposition(null);
      reset();
    } catch (error) {
      // L'erreur est déjà gérée par toastService.promise
    }
  };

  const handleEdit = (composition: PromptComposition) => {
    setEditingComposition(composition);
    const selectedBlockIds = composition.blocks
      .sort((a, b) => a.order - b.order)
      .map(cb => cb.blockId);
    
    setValue('name', composition.name);
    setValue('selectedBlockIds', selectedBlockIds);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    showConfirmation(
      `Supprimer "${name}" ?`,
      "Cette action est irréversible. La composition sera définitivement supprimée.",
      async () => {
        const promise = deleteComposition(id);
        toastService.promise(promise, {
          loading: 'Suppression en cours...',
          success: 'Composition supprimée avec succès !',
          error: 'Erreur lors de la suppression de la composition.',
        });
        await promise;
      }
    );
  };

  const handleBlockToggle = (blockId: string) => {
    const currentSelectedBlockIds = watchedSelectedBlockIds || [];
    const isSelected = currentSelectedBlockIds.includes(blockId);
    
    if (isSelected) {
      setValue('selectedBlockIds', currentSelectedBlockIds.filter(id => id !== blockId));
    } else {
      setValue('selectedBlockIds', [...currentSelectedBlockIds, blockId]);
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const currentSelectedBlockIds = [...(watchedSelectedBlockIds || [])];
    const [removed] = currentSelectedBlockIds.splice(fromIndex, 1);
    currentSelectedBlockIds.splice(toIndex, 0, removed);
    setValue('selectedBlockIds', currentSelectedBlockIds);
  };

  const getBlockById = (id: string) => blocks.find(b => b.id === id);

  // Séparer les blocs système des blocs personnalisés
  const systemBlocks = blocks.filter(b => b.isSystemBlock);
  const customBlocks = blocks.filter(b => !b.isSystemBlock);
  
  // Grouper les blocs personnalisés par catégorie
  const groupedCustomBlocks = customBlocks.reduce((acc, block) => {
    const category = block.category || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {} as Record<string, PromptBlock[]>);

  // Créer l'objet final avec les blocs système en premier
  const groupedBlocks = {
    ...(systemBlocks.length > 0 && { 'Blocs Fondamentaux': systemBlocks }),
    ...groupedCustomBlocks
  };

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
          onClick={() => {
            setEditingComposition(null);
            reset();
            setIsModalOpen(true);
          }}
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
                  onClick={() => handleEdit(composition)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(composition.id, composition.name)}
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

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingComposition ? 'Modifier la composition' : 'Nouvelle composition'}
              </h2>
              
              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
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
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingComposition(null);
                      reset();
                    }}
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
      )}
    </div>
  );
}