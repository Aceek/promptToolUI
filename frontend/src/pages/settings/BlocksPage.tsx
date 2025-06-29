import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PromptBlock } from '../../store/useAppStore';

const BLOCK_TYPES = [
  { value: 'STATIC', label: 'Statique', description: 'Bloc de texte simple' },
  { value: 'DYNAMIC_TASK', label: 'Tâche Dynamique', description: 'Injecte la demande utilisateur' },
  { value: 'PROJECT_STRUCTURE', label: 'Structure Projet', description: 'Génère l\'arborescence du projet' },
  { value: 'SELECTED_FILES_CONTENT', label: 'Contenu Fichiers', description: 'Injecte le contenu des fichiers sélectionnés' },
  { value: 'PROJECT_INFO', label: 'Info Projet', description: 'Injecte les informations du workspace' },
] as const;

const PREDEFINED_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function BlocksPage() {
  const { 
    blocks, 
    loadBlocks, 
    createBlock, 
    updateBlock, 
    deleteBlock, 
    isLoading, 
    error 
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PromptBlock | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: 'STATIC' as PromptBlock['type'],
    category: '',
    color: PREDEFINED_COLORS[0]
  });

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBlock) {
        await updateBlock(editingBlock.id, formData);
      } else {
        await createBlock(formData);
      }
      
      setIsModalOpen(false);
      setEditingBlock(null);
      setFormData({
        name: '',
        content: '',
        type: 'STATIC',
        category: '',
        color: PREDEFINED_COLORS[0]
      });
    } catch (error) {
      console.error('Failed to save block:', error);
    }
  };

  const handleEdit = (block: PromptBlock) => {
    setEditingBlock(block);
    setFormData({
      name: block.name,
      content: block.content,
      type: block.type,
      category: block.category || '',
      color: block.color || PREDEFINED_COLORS[0]
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bloc ?')) {
      await deleteBlock(id);
    }
  };

  const groupedBlocks = blocks.reduce((acc, block) => {
    const category = block.category || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {} as Record<string, PromptBlock[]>);

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Blocs</h1>
          <p className="text-gray-600">Créez et gérez vos blocs de prompt modulaires</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouveau Bloc
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
          <div key={category} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
              <p className="text-sm text-gray-600">{categoryBlocks.length} bloc(s)</p>
            </div>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: block.color || '#6B7280' }}
                        ></div>
                        <h3 className="font-medium text-gray-900 truncate">{block.name}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(block)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(block.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {BLOCK_TYPES.find(t => t.value === block.type)?.label || block.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {block.content.substring(0, 100)}
                      {block.content.length > 100 && '...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingBlock ? 'Modifier le bloc' : 'Nouveau bloc'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du bloc
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de bloc
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PromptBlock['type'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BLOCK_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Rôles, Instructions, Formats..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <div className="flex space-x-2">
                    {PREDEFINED_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenu du bloc
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contenu du bloc... Utilisez {{dynamic_task}} pour les blocs de type DYNAMIC_TASK"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingBlock(null);
                      setFormData({
                        name: '',
                        content: '',
                        type: 'STATIC',
                        category: '',
                        color: PREDEFINED_COLORS[0]
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingBlock ? 'Mettre à jour' : 'Créer'}
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