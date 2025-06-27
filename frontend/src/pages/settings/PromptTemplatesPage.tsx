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
    if (!editingTemplate || !editingTemplate.name.trim()) {
      alert("Le nom ne peut pas être vide.");
      return;
    }
    
    try {
      // On ne sauvegarde que le nom et les champs personnalisables
      const dataToSave = {
        name: editingTemplate.name,
        role_intro: editingTemplate.role_intro || "You are an expert software engineer. Your persona:",
        task_header: editingTemplate.task_header || "DYNAMIC TASK - USER REQUEST",
        task_static_intro: editingTemplate.task_static_intro || "[The following is the specific task you need to accomplish. While the rest of this prompt provides static context and guidelines, this section represents the dynamic user request that changes with each prompt generation.]",
        task_format_reminder: editingTemplate.task_format_reminder || "Your response must strictly follow the format specified in the FORMAT INSTRUCTIONS section below. This format is crucial for proper processing of your response.",
        format_header: editingTemplate.format_header || "FORMAT INSTRUCTIONS",
        project_info_header: editingTemplate.project_info_header || "PROJECT INFORMATION",
        structure_header: editingTemplate.structure_header || "PROJECT STRUCTURE",
        code_content_header: editingTemplate.code_content_header || "CODE CONTENT",
        file_separator: editingTemplate.file_separator || "---------------------------------------------------------------------------"
      };
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
    setEditingTemplate({ 
      id: 'new', 
      name: 'Nouveau Template', 
      content: '', 
      isDefault: false, 
      createdAt: '', 
      updatedAt: '',
      role_intro: "You are an expert software engineer. Your persona:",
      task_header: "DYNAMIC TASK - USER REQUEST",
      task_static_intro: "[The following is the specific task you need to accomplish. While the rest of this prompt provides static context and guidelines, this section represents the dynamic user request that changes with each prompt generation.]",
      task_format_reminder: "Your response must strictly follow the format specified in the FORMAT INSTRUCTIONS section below. This format is crucial for proper processing of your response.",
      format_header: "FORMAT INSTRUCTIONS",
      project_info_header: "PROJECT INFORMATION",
      structure_header: "PROJECT STRUCTURE",
      code_content_header: "CODE CONTENT",
      file_separator: "---------------------------------------------------------------------------"
    });
  };

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
                  <div className="space-y-6">
                    {/* Bloc 1: Rôle */}
                    <fieldset className="border p-4 rounded-md">
                      <legend className="text-lg font-semibold px-2">Bloc : Rôle & Expertise</legend>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phrase d'introduction</label>
                      <textarea 
                        value={editingTemplate.role_intro || ""} 
                        onChange={e => setEditingTemplate({ ...editingTemplate, role_intro: e.target.value })} 
                        className="textarea h-20"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cette phrase précède la description du rôle (ex: "Vous êtes un expert...")</p>
                    </fieldset>

                    {/* Bloc 2: Tâche Dynamique */}
                    <fieldset className="border p-4 rounded-md">
                      <legend className="text-lg font-semibold px-2">Bloc : Tâche Dynamique</legend>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la section</label>
                          <input 
                            type="text" 
                            value={editingTemplate.task_header || ""} 
                            onChange={e => setEditingTemplate({ ...editingTemplate, task_header: e.target.value })} 
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Introduction statique</label>
                          <textarea 
                            value={editingTemplate.task_static_intro || ""} 
                            onChange={e => setEditingTemplate({ ...editingTemplate, task_static_intro: e.target.value })} 
                            className="textarea h-24"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rappel sur le format</label>
                          <textarea 
                            value={editingTemplate.task_format_reminder || ""} 
                            onChange={e => setEditingTemplate({ ...editingTemplate, task_format_reminder: e.target.value })} 
                            className="textarea h-24"
                          />
                        </div>
                      </div>
                    </fieldset>

                    {/* Bloc 3: Format Instructions */}
                    <fieldset className="border p-4 rounded-md">
                      <legend className="text-lg font-semibold px-2">Bloc : Instructions de Format</legend>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la section</label>
                      <input 
                        type="text" 
                        value={editingTemplate.format_header || ""} 
                        onChange={e => setEditingTemplate({ ...editingTemplate, format_header: e.target.value })} 
                        className="input"
                      />
                    </fieldset>

                    {/* Bloc 4: Project Information */}
                    <fieldset className="border p-4 rounded-md">
                      <legend className="text-lg font-semibold px-2">Bloc : Informations sur le Projet</legend>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la section</label>
                      <input 
                        type="text" 
                        value={editingTemplate.project_info_header || ""} 
                        onChange={e => setEditingTemplate({ ...editingTemplate, project_info_header: e.target.value })} 
                        className="input"
                      />
                    </fieldset>

                    {/* Bloc 5: Project Structure */}
                    <fieldset className="border p-4 rounded-md">
                      <legend className="text-lg font-semibold px-2">Bloc : Structure du Projet</legend>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la section</label>
                      <input 
                        type="text" 
                        value={editingTemplate.structure_header || ""} 
                        onChange={e => setEditingTemplate({ ...editingTemplate, structure_header: e.target.value })} 
                        className="input"
                      />
                    </fieldset>

                    {/* Bloc 6: Code Content */}
                    <fieldset className="border p-4 rounded-md">
                      <legend className="text-lg font-semibold px-2">Bloc : Contenu du Code</legend>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la section</label>
                          <input 
                            type="text" 
                            value={editingTemplate.code_content_header || ""} 
                            onChange={e => setEditingTemplate({ ...editingTemplate, code_content_header: e.target.value })} 
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Séparateur de fichier</label>
                          <input 
                            type="text" 
                            value={editingTemplate.file_separator || ""} 
                            onChange={e => setEditingTemplate({ ...editingTemplate, file_separator: e.target.value })} 
                            className="input"
                          />
                          <p className="text-xs text-gray-500 mt-1">Ligne utilisée pour séparer visuellement les fichiers dans le prompt</p>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
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
