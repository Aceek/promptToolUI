import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PromptBlock } from '../../store/useAppStore';
import { RESERVED_COLORS, DYNAMIC_TASK_BLOCK_COLOR } from '../../constants';

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

type BlockCreationType = 'text' | 'dynamic_task';

interface DynamicTaskContent {
  prefix: string;
  suffix: string;
}

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
  const [creationType, setCreationType] = useState<BlockCreationType>('text');
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: 'STATIC' as PromptBlock['type'],
    category: '',
    color: PREDEFINED_COLORS[0]
  });

  // État spécifique pour les blocs de tâche dynamique
  const [dynamicTaskData, setDynamicTaskData] = useState({
    prefix: '',
    suffix: ''
  });

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      type: 'STATIC',
      category: '',
      color: PREDEFINED_COLORS[0]
    });
    setDynamicTaskData({
      prefix: '',
      suffix: ''
    });
    setCreationType('text');
    setShowTypeSelection(false);
  };

  const handleNewBlock = () => {
    resetForm();
    setEditingBlock(null);
    setShowTypeSelection(true);
    setIsModalOpen(true);
  };

  const handleTypeSelection = (type: BlockCreationType) => {
    setCreationType(type);
    setShowTypeSelection(false);
    
    if (type === 'dynamic_task') {
      setFormData(prev => ({
        ...prev,
        type: 'DYNAMIC_TASK',
        category: 'Tâche',
        color: DYNAMIC_TASK_BLOCK_COLOR
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        type: 'STATIC'
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let finalFormData = { ...formData };
      
      // Si c'est un bloc de tâche dynamique, construire le JSON
      if (formData.type === 'DYNAMIC_TASK') {
        finalFormData.content = JSON.stringify({
          prefix: dynamicTaskData.prefix,
          suffix: dynamicTaskData.suffix
        });
      }
      
      if (editingBlock) {
        await updateBlock(editingBlock.id, finalFormData);
      } else {
        await createBlock(finalFormData);
      }
      
      setIsModalOpen(false);
      setEditingBlock(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save block:', error);
    }
  };

  const handleEdit = (block: PromptBlock) => {
    setEditingBlock(block);
    setShowTypeSelection(false);
    
    // Si c'est un bloc de tâche dynamique, parser le JSON
    if (block.type === 'DYNAMIC_TASK') {
      try {
        const taskContent: DynamicTaskContent = JSON.parse(block.content);
        setDynamicTaskData({
          prefix: taskContent.prefix || '',
          suffix: taskContent.suffix || ''
        });
        setCreationType('dynamic_task');
      } catch (e) {
        // Fallback pour l'ancien format
        setFormData(prev => ({ ...prev, content: block.content }));
        setCreationType('text');
      }
    } else {
      setCreationType('text');
      setFormData({
        name: block.name,
        content: block.content,
        type: block.type,
        category: block.category || '',
        color: block.color || PREDEFINED_COLORS[0]
      });
    }
    
    setFormData({
      name: block.name,
      content: block.type === 'DYNAMIC_TASK' ? '' : block.content,
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

  // Séparer les blocs système des blocs personnalisés
  const systemBlocks = blocks.filter(b => b.isSystemBlock);
  const customBlocks = blocks.filter(b => !b.isSystemBlock);
  
  // Grouper les blocs personnalisés par catégorie
  const groupedCustomBlocks = customBlocks.reduce((acc, block) => {
    const category = block.category || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {} as Record<string, PromptBlock[]>);

  // Créer l'objet final avec les blocs système en premier
  const groupedBlocks = {
    ...(systemBlocks.length > 0 && { 'Blocs Fondamentaux': systemBlocks }),
    ...groupedCustomBlocks
  };

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
          onClick={handleNewBlock}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouveau Bloc
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => {
          const isSystemCategory = category === 'Blocs Fondamentaux';
          return (
            <div
              key={category}
              className={`rounded-lg shadow ${
                isSystemCategory
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'
                  : 'bg-white'
              }`}
            >
              <div className={`px-6 py-4 border-b ${
                isSystemCategory ? 'border-blue-200' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {isSystemCategory && <span className="text-blue-600">⚙️</span>}
                  <h2 className={`text-lg font-semibold ${
                    isSystemCategory ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {category}
                  </h2>
                  {isSystemCategory && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Système
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  isSystemCategory ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {categoryBlocks.length} bloc(s)
                  {isSystemCategory && ' - Blocs essentiels non supprimables'}
                </p>
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
                        {block.isSystemBlock && (
                          <span className="text-gray-500" title="Bloc Système">⚙️</span>
                        )}
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
                        {block.systemBehavior !== 'INDELETABLE' && (
                          <button
                            onClick={() => handleDelete(block.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {BLOCK_TYPES.find(t => t.value === block.type)?.label || block.type}
                      </span>
                      {block.isSystemBlock && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-2">
                          Système
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {block.type === 'DYNAMIC_TASK' ? (
                        (() => {
                          try {
                            const taskContent: DynamicTaskContent = JSON.parse(block.content);
                            return `${taskContent.prefix} [TÂCHE UTILISATEUR] ${taskContent.suffix}`.substring(0, 100);
                          } catch (e) {
                            return block.content.substring(0, 100);
                          }
                        })()
                      ) : (
                        block.content.substring(0, 100)
                      )}
                      {block.content.length > 100 && '...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {showTypeSelection ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Quel type de bloc voulez-vous créer ?</h2>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleTypeSelection('text')}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          🧱
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Bloc de Texte</h3>
                          <p className="text-sm text-gray-600">Pour les rôles, instructions, formats, etc.</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleTypeSelection('dynamic_task')}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          ⚡
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Bloc de Tâche Utilisateur</h3>
                          <p className="text-sm text-gray-600">Pour la tâche dynamique avec texte d'introduction et de conclusion</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
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

                    {editingBlock?.isSystemBlock && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          ⚙️ Ce bloc est un bloc système. Vous pouvez modifier son nom, sa catégorie et sa couleur, mais pas son type ou son contenu.
                        </p>
                      </div>
                    )}

                    {/* Type selector hidden during creation */}
                    {editingBlock && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de bloc
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as PromptBlock['type'] })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!!editingBlock}
                        >
                          {BLOCK_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label} - {type.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie
                      </label>
                      {creationType === 'dynamic_task' ? (
                        <div className="hidden">
                          <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500">
                            Blocs Fondamentaux
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ex: Rôles, Instructions, Formats..."
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Couleur
                      </label>
                      {creationType === 'dynamic_task' ? (
                        <div className="hidden">
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
                      ) : (
                        <div className="flex space-x-2">
                          {((editingBlock && editingBlock.systemBehavior !== 'NONE') ? PREDEFINED_COLORS : PREDEFINED_COLORS.filter(c => !RESERVED_COLORS.includes(c))).map((color) => (
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
                      )}
                    </div>

                    {!editingBlock?.isSystemBlock && (
                      <>
                        {creationType === 'dynamic_task' ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Texte d'introduction (optionnel)
                              </label>
                              <textarea
                                value={dynamicTaskData.prefix}
                                onChange={(e) => setDynamicTaskData({ ...dynamicTaskData, prefix: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ex: TASK TO ACCOMPLISH:"
                              />
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <p className="text-sm text-gray-600 text-center italic">
                                [La tâche saisie par l'utilisateur apparaîtra ici]
                              </p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Texte de conclusion (optionnel)
                              </label>
                              <textarea
                                value={dynamicTaskData.suffix}
                                onChange={(e) => setDynamicTaskData({ ...dynamicTaskData, suffix: e.target.value })}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ex: Please analyze the provided code and project structure to accomplish this task effectively."
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Contenu du bloc
                            </label>
                            <textarea
                              value={formData.content}
                              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                              rows={8}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Contenu du bloc..."
                              required
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingBlock(null);
                          resetForm();
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                      {!editingBlock?.isSystemBlock && (
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {editingBlock ? 'Mettre à jour' : 'Créer'}
                        </button>
                      )}
                      {editingBlock?.isSystemBlock && (
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Mettre à jour
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
