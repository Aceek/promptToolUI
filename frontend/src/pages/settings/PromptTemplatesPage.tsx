import React, { useState, useEffect } from 'react';
import { promptTemplateApi } from '../../services/api';
import { useAppStore, PromptTemplate } from '../../store/useAppStore';

const PromptTemplatesPage = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { fetchPromptTemplates: fetchStoreTemplates } = useAppStore();

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await promptTemplateApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Erreur lors de la récupération des templates.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate({ ...template });
  };

  const handleSave = async () => {
    if (!editingTemplate || !editingTemplate.name.trim() || !editingTemplate.content.trim()) {
      alert("Le nom et le contenu ne peuvent pas être vides.");
      return;
    }
    
    try {
      const dataToSave = { name: editingTemplate.name, content: editingTemplate.content };
      if (editingTemplate.id === 'new') {
        await promptTemplateApi.create(dataToSave);
      } else {
        await promptTemplateApi.update(editingTemplate.id, dataToSave);
      }
      setEditingTemplate(null);
      await fetchTemplates();
      await fetchStoreTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Erreur lors de la sauvegarde du template.');
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      alert("Vous ne pouvez pas supprimer le template par défaut.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) {
      try {
        await promptTemplateApi.delete(id);
        await fetchTemplates();
        await fetchStoreTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Erreur lors de la suppression du template.');
      }
    }
  };

  const handleNew = () => {
    setEditingTemplate({ id: 'new', name: 'Nouveau Template', content: '', isDefault: false, createdAt: '', updatedAt: '' });
  };

  const VariableButton = ({ variable }: { variable: string }) => (
    <button
      onClick={() => {
        if (editingTemplate) {
          const newContent = `${editingTemplate.content}{{ ${variable} }}`;
          setEditingTemplate({ ...editingTemplate, content: newContent });
        }
      }}
      className="btn-secondary text-xs py-1 px-2"
      title={`Insérer la variable {{ ${variable} }}`}
    >
      {`{{ ${variable} }}`}
    </button>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Templates de Prompt</h1>
              <p className="text-gray-600">Gérez et personnalisez vos prompts système.</p>
            </div>
            {!editingTemplate && (
              <button onClick={handleNew} className="btn-primary">
                + Nouveau Template
              </button>
            )}
          </div>
        </div>

        <div className="card-content">
          {isLoading ? (
            <div className="text-center py-10">Chargement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className={`border p-3 rounded-lg flex justify-between items-center bg-white shadow-sm transition-all ${editingTemplate?.id === template.id ? 'ring-2 ring-primary-500' : ''}`}>
                    <div>
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && <span className="ml-2 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Défaut</span>}
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(template)} className="btn-secondary text-sm py-1 px-2">
                        Modifier
                      </button>
                      {!template.isDefault && (
                        <button onClick={() => handleDelete(template.id, template.isDefault)} className="btn-danger text-sm py-1 px-2">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {editingTemplate ? (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h2 className="text-lg font-semibold mb-4">{editingTemplate.id === 'new' ? 'Nouveau Template' : 'Modifier le Template'}</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Template</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du Template</label>
                    <textarea
                      value={editingTemplate.content}
                      onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                      className="textarea w-full h-80 font-mono text-sm resize-y scrollbar-thin"
                      placeholder="Entrez le contenu du template avec les variables Nunjucks (ex: {{ variable }})"
                    />
                  </div>
                   <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="text-sm font-bold text-blue-800 mb-2">Insérer une variable :</h4>
                      <div className="flex flex-wrap gap-2">
                          <VariableButton variable="final_request" />
                          <VariableButton variable="role_description" />
                          <VariableButton variable="project_name" />
                          <VariableButton variable="project_info" />
                          <VariableButton variable="project_structure" />
                          <VariableButton variable="code_files" />
                          <VariableButton variable="format_name" />
                          <VariableButton variable="format_instructions" />
                          <VariableButton variable="format_examples" />
                      </div>
                   </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditingTemplate(null)} className="btn-secondary">
                      Annuler
                    </button>
                    <button onClick={handleSave} className="btn-primary">
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed h-full text-gray-500">
                  <p>Sélectionnez un template à modifier ou créez-en un nouveau.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptTemplatesPage;
