import React from 'react';
import { UseFormRegister, FieldErrors, UseFormHandleSubmit } from 'react-hook-form';
import { WorkspaceFormData } from '../../../schemas/workspace.schema';
import { PromptComposition, Workspace } from '../../../store/useAppStore';

interface WorkspaceFormModalProps {
  isOpen: boolean;
  editingWorkspace: Workspace | null;
  compositions: PromptComposition[];
  register: UseFormRegister<WorkspaceFormData>;
  handleSubmit: UseFormHandleSubmit<WorkspaceFormData>;
  errors: FieldErrors<WorkspaceFormData>;
  isSubmitting: boolean;
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  onClose: () => void;
}

export const WorkspaceFormModal: React.FC<WorkspaceFormModalProps> = ({
  isOpen,
  editingWorkspace,
  compositions,
  register,
  handleSubmit,
  errors,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingWorkspace ? 'Modifier l\'espace de travail' : 'Nouvel espace de travail'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'espace de travail
              </label>
              <input
                type="text"
                {...register('name')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chemin du projet
              </label>
              <input
                type="text"
                {...register('path')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.path ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="/chemin/vers/votre/projet"
              />
              {errors.path && (
                <p className="text-red-500 text-sm mt-1">{errors.path.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Composition par défaut (optionnel)
              </label>
              <select
                {...register('defaultCompositionId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucune composition par défaut</option>
                {compositions.map((composition) => (
                  <option key={composition.id} value={composition.id}>
                    {composition.name}
                  </option>
                ))}
              </select>
              {errors.defaultCompositionId && (
                <p className="text-red-500 text-sm mt-1">{errors.defaultCompositionId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Informations du projet (optionnel)
              </label>
              <textarea
                {...register('projectInfo')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Description du projet, technologies utilisées, etc."
              />
              {errors.projectInfo && (
                <p className="text-red-500 text-sm mt-1">{errors.projectInfo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patterns d'exclusion (un par ligne)
              </label>
              <textarea
                {...register('ignorePatterns')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="node_modules&#10;.git&#10;*.log&#10;dist"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fichiers et dossiers à exclure de la structure du projet
              </p>
              {errors.ignorePatterns && (
                <p className="text-red-500 text-sm mt-1">{errors.ignorePatterns.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? 'Sauvegarde...' 
                  : editingWorkspace 
                    ? 'Mettre à jour' 
                    : 'Créer'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};