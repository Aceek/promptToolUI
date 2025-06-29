import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore, Workspace } from '../../../store/useAppStore';
import { workspaceFormSchema, WorkspaceFormData } from '../../../schemas/workspace.schema';
import { toastService } from '../../../services/toastService';

export const useWorkspacesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  const {
    workspaces,
    compositions,
    isLoading,
    error,
    loadWorkspaces,
    loadCompositions,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    showConfirmation
  } = useAppStore();

  // Configuration du formulaire avec React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: '',
      path: '',
      defaultCompositionId: '',
      projectInfo: '',
      ignorePatterns: '',
    }
  });

  // Chargement initial des données
  useEffect(() => {
    loadWorkspaces();
    loadCompositions();
  }, [loadWorkspaces, loadCompositions]);

  // Réinitialisation et fermeture du formulaire
  const resetForm = () => {
    setEditingWorkspace(null);
    reset();
    setIsFormOpen(false);
  };

  // Gestion de l'ouverture du formulaire pour un nouveau workspace
  const handleNew = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Gestion de l'édition d'un workspace existant
  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setValue('name', workspace.name);
    setValue('path', workspace.path);
    setValue('defaultCompositionId', workspace.defaultCompositionId || '');
    setValue('projectInfo', workspace.projectInfo || '');
    setValue('ignorePatterns', workspace.ignorePatterns?.join('\n') || '');
    setIsFormOpen(true);
  };

  // Soumission du formulaire
  const onSubmit = async (data: WorkspaceFormData) => {
    const workspaceData = {
      name: data.name,
      path: data.path,
      defaultCompositionId: data.defaultCompositionId || undefined,
      projectInfo: data.projectInfo || undefined,
      ignorePatterns: data.ignorePatterns 
        ? data.ignorePatterns.split('\n').filter(pattern => pattern.trim() !== '')
        : undefined,
    };
    
    let promise: Promise<void>;
    
    if (editingWorkspace) {
      promise = updateWorkspace(editingWorkspace.id, workspaceData);
    } else {
      promise = createWorkspace(workspaceData);
    }

    toastService.promise(promise, {
      loading: editingWorkspace ? 'Mise à jour en cours...' : 'Création en cours...',
      success: editingWorkspace 
        ? 'Espace de travail mis à jour avec succès !' 
        : 'Espace de travail créé avec succès !',
      error: 'Erreur lors de la sauvegarde de l\'espace de travail.',
    });
    
    try {
      await promise;
      resetForm();
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  // Suppression d'un workspace avec confirmation
  const handleDelete = (id: string, name: string) => {
    showConfirmation(
      `Supprimer "${name}" ?`,
      "Cette action est irréversible. L'espace de travail et toutes ses données seront définitivement supprimés.",
      async () => {
        const promise = deleteWorkspace(id);
        
        toastService.promise(promise, {
          loading: 'Suppression en cours...',
          success: 'Espace de travail supprimé avec succès !',
          error: 'Erreur lors de la suppression de l\'espace de travail.',
        });

        try {
          await promise;
        } catch (error) {
          console.error('Failed to delete workspace:', error);
        }
      }
    );
  };

  return {
    // État
    workspaces,
    compositions,
    isLoading,
    error,
    isFormOpen,
    editingWorkspace,
    
    // Formulaire
    register,
    handleSubmit,
    errors,
    isSubmitting,
    
    // Actions
    handleNew,
    handleEdit,
    handleDelete,
    resetForm,
    onSubmit,
  };
};