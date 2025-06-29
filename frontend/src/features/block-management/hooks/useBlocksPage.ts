import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore, PromptBlock } from '../../../store/useAppStore';
import { blockFormSchema, BlockFormData } from '../../../schemas/block.schema';
import { toastService } from '../../../services/toastService';
import { RESERVED_COLORS, DYNAMIC_TASK_BLOCK_COLOR } from '../../../constants';

const PREDEFINED_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

type BlockCreationType = 'text' | 'dynamic_task';
interface DynamicTaskContent { prefix: string; suffix: string; }

export const useBlocksPage = () => {
  const { blocks, loadBlocks, createBlock, updateBlock, deleteBlock, isLoading, error, showConfirmation } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PromptBlock | null>(null);
  const [creationType, setCreationType] = useState<BlockCreationType>('text');
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [dynamicTaskData, setDynamicTaskData] = useState<DynamicTaskContent>({ prefix: '', suffix: '' });

  const form = useForm<BlockFormData>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: { name: '', content: '', type: 'STATIC', category: '', color: PREDEFINED_COLORS[0] }
  });

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const resetFullForm = () => {
    form.reset({ name: '', content: '', type: 'STATIC', category: '', color: PREDEFINED_COLORS[0] });
    setDynamicTaskData({ prefix: '', suffix: '' });
    setCreationType('text');
    setShowTypeSelection(false);
    setEditingBlock(null);
  };
  
  const openNewBlockModal = () => {
    resetFullForm();
    setShowTypeSelection(true);
    setIsModalOpen(true);
  };

  const openEditBlockModal = (block: PromptBlock) => {
    resetFullForm();
    setEditingBlock(block);
    
    if (block.type === 'DYNAMIC_TASK') {
      try {
        const taskContent: DynamicTaskContent = JSON.parse(block.content);
        setDynamicTaskData({ prefix: taskContent.prefix || '', suffix: taskContent.suffix || '' });
        setCreationType('dynamic_task');
      } catch (e) {
        form.setValue('content', block.content);
        setCreationType('text');
      }
    } else {
      setCreationType('text');
    }
    
    form.setValue('name', block.name);
    form.setValue('content', block.type === 'DYNAMIC_TASK' ? '' : block.content);
    form.setValue('type', block.type);
    form.setValue('category', block.category || '');
    form.setValue('color', block.color || PREDEFINED_COLORS[0]);
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetFullForm();
  };

  const handleTypeSelection = (type: BlockCreationType) => {
    setCreationType(type);
    setShowTypeSelection(false);
    if (type === 'dynamic_task') {
      form.setValue('type', 'DYNAMIC_TASK');
      form.setValue('category', 'Tâche');
      form.setValue('color', DYNAMIC_TASK_BLOCK_COLOR);
    } else {
      form.setValue('type', 'STATIC');
    }
  };

  const handleDeleteBlock = (id: string, name: string) => {
    showConfirmation(`Supprimer "${name}" ?`, "Cette action est irréversible.", async () => {
      const promise = deleteBlock(id);
      toastService.promise(promise, {
        loading: 'Suppression...',
        success: 'Bloc supprimé !',
        error: 'Erreur lors de la suppression.',
      });
      await promise.catch(() => {});
    });
  };

  const onSubmit = async (data: BlockFormData) => {
    let finalFormData = { ...data };
    if (data.type === 'DYNAMIC_TASK') {
      finalFormData.content = JSON.stringify(dynamicTaskData);
    }
    
    const promise = editingBlock
      ? updateBlock(editingBlock.id, finalFormData)
      : createBlock(finalFormData);

    toastService.promise(promise, {
      loading: 'Sauvegarde...',
      success: `Bloc ${editingBlock ? 'mis à jour' : 'créé'} !`,
      error: 'Erreur de sauvegarde.',
    });

    try {
      await promise;
      closeModal();
    } catch (e) {}
  };

  const groupedBlocks = useMemo(() => {
    const systemBlocks = blocks.filter(b => b.isSystemBlock);
    const customBlocks = blocks.filter(b => !b.isSystemBlock);
    const groupedCustom = customBlocks.reduce((acc, block) => {
      const category = block.category || 'Sans catégorie';
      if (!acc[category]) acc[category] = [];
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
    blocks,
    isLoading,
    error,
    groupedBlocks,
    isModalOpen,
    editingBlock,
    creationType,
    showTypeSelection,
    dynamicTaskData,
    PREDEFINED_COLORS,
    RESERVED_COLORS,
    DYNAMIC_TASK_BLOCK_COLOR,
    // Methods
    form,
    setDynamicTaskData,
    openNewBlockModal,
    openEditBlockModal,
    closeModal,
    handleDeleteBlock,
    handleTypeSelection,
    onSubmit,
  };
};