import React from 'react';
import { useWorkspacesPage } from './hooks/useWorkspacesPage';
import { WorkspaceFormModal } from './components/WorkspaceFormModal';

const WorkspacesPage = () => {
  const {
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
  } = useWorkspacesPage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Espaces de Travail</h1>
          <p className="text-gray-600">Configurez vos projets et leurs paramètres par défaut</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouvel Espace de Travail
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Liste des workspaces */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(workspace)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(workspace.id, workspace.name)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Chemin:</span> {workspace.path}</p>
              
              {workspace.defaultComposition && (
                <p>
                  <span className="font-medium">Composition par défaut:</span>{' '}
                  <span className="text-blue-600">{workspace.defaultComposition.name}</span>
                </p>
              )}
              
              {workspace.projectInfo && (
                <p><span className="font-medium">Info projet:</span> {workspace.projectInfo.substring(0, 50)}...</p>
              )}
              
              {workspace.ignorePatterns && workspace.ignorePatterns.length > 0 && (
                <p><span className="font-medium">Patterns d'exclusion:</span> {workspace.ignorePatterns.length} défini(s)</p>
              )}
              
              <p className="text-xs text-gray-400">
                Créé le {new Date(workspace.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun espace de travail</h3>
          <p className="text-gray-600 mb-4">Créez votre premier espace de travail pour commencer</p>
          <button
            onClick={handleNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer un espace de travail
          </button>
        </div>
      )}

      {/* Modal de création/édition */}
      <WorkspaceFormModal
        isOpen={isFormOpen}
        editingWorkspace={editingWorkspace}
        compositions={compositions}
        register={register}
        handleSubmit={handleSubmit}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        onClose={resetForm}
      />
    </div>
  );
};

export default WorkspacesPage;