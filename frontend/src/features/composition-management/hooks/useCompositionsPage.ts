import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore, PromptComposition, PromptBlock } from '../../../store/useAppStore';
import { compositionFormSchema, CompositionFormData } from '../../../schemas/composition.schema';
import { toastService } from '../../../services/toastService';

export const useCompositionsPage = () => {
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

  const form = useForm<CompositionFormData>({
    resolver: zodResolver(compositionFormSchema),
    defaultValues: {
      name: '',
      selectedBlockIds: []
    }
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = form;
  const watchedSelectedBlockIds = watch('selectedBlockIds');

  useEffect(() => {
    loadCompositions();
    loadBlocks();
  }, [loadCompositions, loadBlocks]);

  const onSubmit = async (data: CompositionFormData) => {
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
      closeModal();
    } catch (error) {
      // L'erreur est déjà gérée par toastService.promise
    }
  };

  const openNewCompositionModal = () => {
    setEditingComposition(null);
    reset();
    setIsModalOpen(true);
  };

  const openEditCompositionModal = (composition: PromptComposition) => {
    setEditingComposition(composition);
    const selectedBlockIds = composition.blocks
      .sort((a, b) => a.order - b.order)
      .map(cb => cb.blockId);
    
    setValue('name', composition.name);
    setValue('selectedBlockIds', selectedBlockIds);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingComposition(null);
    reset();
  };

  const handleDeleteComposition = (id: string, name: string) => {
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
        await promise.catch(() => {});
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

  const groupedBlocks = useMemo(() => {
    const systemBlocks = blocks.filter(b => b.isSystemBlock);
    const customBlocks = blocks.filter(b => !b.isSystemBlock);
    
    const groupedCustom = customBlocks.reduce((acc, block) => {
      const category = block.category || 'Sans catégorie';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(block);
      return acc;
    }, {} as Record<string, PromptBlock[]>);

    return {
      ...(systemBlocks.length > 0 && { 'Blocs Fondamentaux': systemBlocks }),
      ...groupedCustom
    };
  }, [blocks]);

  return {
    // State
    compositions,
    blocks,
    isLoading,
    error,
    isModalOpen,
    editingComposition,
    groupedBlocks,
    watchedSelectedBlockIds,
    // Form
    form,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    // Methods
    onSubmit,
    openNewCompositionModal,
    openEditCompositionModal,
    closeModal,
    handleDeleteComposition,
    handleBlockToggle,
    moveBlock,
    getBlockById,
  };
};