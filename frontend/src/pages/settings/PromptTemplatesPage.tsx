import React, { useState, useEffect } from 'react';
import { promptTemplateApi } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

// Définir le type PromptTemplate
interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const PromptTemplatesPage = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await promptTemplateApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (template: PromptTemplate) => {
    // Créer une copie pour éviter la mutation directe
    setEditingTemplate({ ...template });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    try {
      if (editingTemplate.id === 'new') { // Cas de la création
        await promptTemplateApi.create({ name: editingTemplate.name, content: editingTemplate.content });
      } else { // Cas de la mise à jour
        await promptTemplateApi.update(editingTemplate.id, { name: editingTemplate.name, content: editingTemplate.content });
      }
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await promptTemplateApi.delete(id);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleNew = () => {
    setEditingTemplate({ id: 'new', name: 'Nouveau Template', content: '', isDefault: false, createdAt: '', updatedAt: '' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Templates de Prompt</h1>
      
      {isLoading ? (
        <div className="text-center py-10">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Liste des Templates</h2>
              <button onClick={handleNew} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Nouveau
              </button>
            </div>
            <ul className="space-y-2">
              {templates.map(template => (
                <li key={template.id} className="border p-2 rounded flex justify-between items-center">
                  <div>
                    <span className="font-medium">{template.name}</span>
                    {template.isDefault && <span className="ml-2 text-sm text-green-500">(Par défaut)</span>}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(template)} className="text-blue-500 hover:text-blue-700">
                      Modifier
                    </button>
                    {!template.isDefault && (
                      <button onClick={() => handleDelete(template.id)} className="text-red-500 hover:text-red-700">
                        Supprimer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {editingTemplate && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-4">{editingTemplate.id === 'new' ? 'Nouveau Template' : 'Modifier Template'}</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Contenu</label>
                <textarea
                  value={editingTemplate.content}
                  onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-64 font-mono text-sm"
                  placeholder="Entrez le contenu du template avec les variables Nunjucks (ex: {{ variable }})"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setEditingTemplate(null)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                  Annuler
                </button>
                <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptTemplatesPage;
