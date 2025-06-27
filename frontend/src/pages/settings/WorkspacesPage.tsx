import { useState, useEffect } from 'react';
import { useAppStore, Workspace } from '../../store/useAppStore';
import { workspaceApi, promptTemplateApi } from '../../services/api';

const initialFormState = {
  name: '',
  path: '',
  defaultFormatId: '',
  defaultRoleId: '',
  defaultPromptTemplateId: '',
  projectInfo: '',
};

const WorkspacesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [promptTemplates, setPromptTemplates] = useState<any[]>([]);

  const { workspaces, formats, roles, fetchWorkspaces, fetchFormats, fetchRoles } = useAppStore();

  useEffect(() => {
    fetchWorkspaces();
    fetchFormats();
    fetchRoles();
    fetchPromptTemplates();
  }, [fetchWorkspaces, fetchFormats, fetchRoles]);

  const fetchPromptTemplates = async () => {
    try {
      const data = await promptTemplateApi.getAll();
      setPromptTemplates(data);
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
    }
  };

  const resetForm = () => {
    setEditingWorkspace(null);
    setFormData(initialFormState);
    setIsFormOpen(false);
  };

  const handleNew = () => {
    setEditingWorkspace(null);
    setFormData(initialFormState);
    setIsFormOpen(true);
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      path: workspace.path,
      defaultFormatId: workspace.defaultFormatId || '',
      defaultRoleId: workspace.defaultRoleId || '',
      defaultPromptTemplateId: workspace.defaultPromptTemplateId || '',
      projectInfo: workspace.projectInfo || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingWorkspace) {
        // Update
        await workspaceApi.update(editingWorkspace.id, {
          ...formData,
          defaultFormatId: formData.defaultFormatId || undefined,
          defaultRoleId: formData.defaultRoleId || undefined,
          defaultPromptTemplateId: formData.defaultPromptTemplateId || undefined,
        });
      } else {
        // Create
        await workspaceApi.create({
          ...formData,
          defaultFormatId: formData.defaultFormatId || undefined,
          defaultRoleId: formData.defaultRoleId || undefined,
          defaultPromptTemplateId: formData.defaultPromptTemplateId || undefined,
        });
      }
      resetForm();
      fetchWorkspaces();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde de l\'espace de travail');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet espace de travail ?')) {
      return;
    }
    try {
      await workspaceApi.delete(id);
      fetchWorkspaces();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression de l\'espace de travail');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Espaces de travail</h1>
              <p className="text-gray-600">Gérez vos projets et leurs configurations</p>
            </div>
            <button
              className="btn-primary"
              onClick={handleNew}
            >
              + Nouvel espace de travail
            </button>
          </div>
        </div>

        <div className="card-content">
          {/* Formulaire de création/édition */}
          {isFormOpen && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                {editingWorkspace ? 'Modifier l\'espace de travail' : 'Nouvel espace de travail'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Mon projet" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chemin</label>
                    <input type="text" className="input" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder="/chemin/vers/projet" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format par défaut</label>
                    <select className="select" value={formData.defaultFormatId} onChange={(e) => setFormData({ ...formData, defaultFormatId: e.target.value })}>
                      <option value="">Aucun</option>
                      {formats.map((format) => (<option key={format.id} value={format.id}>{format.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rôle par défaut</label>
                    <select className="select" value={formData.defaultRoleId} onChange={(e) => setFormData({ ...formData, defaultRoleId: e.target.value })}>
                      <option value="">Aucun</option>
                      {roles.map((role) => (<option key={role.id} value={role.id}>{role.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template de Prompt par défaut</label>
                    <select className="select" value={formData.defaultPromptTemplateId} onChange={(e) => setFormData({ ...formData, defaultPromptTemplateId: e.target.value })}>
                      <option value="">Aucun</option>
                      {promptTemplates.map((template) => (<option key={template.id} value={template.id}>{template.name} {template.isDefault && '(Par défaut)'}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Informations sur le projet</label>
                  <textarea className="textarea" rows={5} value={formData.projectInfo} onChange={(e) => setFormData({ ...formData, projectInfo: e.target.value })} placeholder="Décrivez l'objectif du projet, les technologies utilisées, etc." />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button className="btn-secondary" onClick={resetForm}>Annuler</button>
                <button className="btn-primary" onClick={handleSave} disabled={!formData.name || !formData.path}>
                  {editingWorkspace ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          )}

          {/* Liste des espaces de travail */}
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-mono">{workspace.path}</p>
                    {workspace.projectInfo && (
                        <p className="text-sm text-gray-600 mt-2 border-l-2 border-gray-200 pl-2 italic">
                            {workspace.projectInfo.substring(0,150)}{workspace.projectInfo.length > 150 && '...'}
                        </p>
                    )}
                    <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                      {workspace.defaultFormat && (<span>Format: <span className='font-medium text-gray-700'>{workspace.defaultFormat.name}</span></span>)}
                      {workspace.defaultRole && (<span>Rôle: <span className='font-medium text-gray-700'>{workspace.defaultRole.name}</span></span>)}
                      {workspace.defaultPromptTemplate && (<span>Template: <span className='font-medium text-gray-700'>{workspace.defaultPromptTemplate.name}</span></span>)}
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button className="btn-secondary text-sm" onClick={() => handleEdit(workspace)}>Modifier</button>
                    <button className="btn-danger text-sm" onClick={() => handleDelete(workspace.id)}>Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {workspaces.length === 0 && !isFormOpen && (
            <div className="text-center py-8 text-gray-500">Aucun espace de travail configuré</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspacesPage;
