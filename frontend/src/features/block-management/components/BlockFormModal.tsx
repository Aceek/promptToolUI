import React from 'react';
import { useBlocksPage } from '../hooks/useBlocksPage';

const BLOCK_TYPES = [
  { value: 'STATIC', label: 'Statique', description: 'Bloc de texte simple' },
  { value: 'DYNAMIC_TASK', label: 'Tâche Dynamique', description: 'Injecte la demande utilisateur' },
  { value: 'PROJECT_STRUCTURE', label: 'Structure Projet', description: 'Génère l\'arborescence du projet' },
  { value: 'SELECTED_FILES_CONTENT', label: 'Contenu Fichiers', description: 'Injecte le contenu des fichiers sélectionnés' },
  { value: 'PROJECT_INFO', label: 'Info Projet', description: 'Injecte les informations du workspace' },
] as const;

type BlockFormModalProps = ReturnType<typeof useBlocksPage> & {
  isOpen: boolean;
  onClose: () => void;
};

export const BlockFormModal: React.FC<BlockFormModalProps> = ({
  isOpen,
  onClose,
  form,
  onSubmit,
  editingBlock,
  showTypeSelection,
  handleTypeSelection,
  creationType,
  dynamicTaskData,
  setDynamicTaskData,
  PREDEFINED_COLORS,
  RESERVED_COLORS,
  DYNAMIC_TASK_BLOCK_COLOR,
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = form;
  const watchedColor = watch('color');
  
  if (!isOpen) return null;

  return (
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
                  onClick={onClose}
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
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du bloc
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
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
                      {...register('type')}
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
                    <>
                      <input
                        type="hidden"
                        {...register('category')}
                        value="Blocs Fondamentaux"
                      />
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500">
                        Blocs Fondamentaux
                      </div>
                    </>
                  ) : (
                    <input
                      type="text"
                      {...register('category')}
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
                    <>
                      <input
                        type="hidden"
                        {...register('color')}
                        value={DYNAMIC_TASK_BLOCK_COLOR}
                      />
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: DYNAMIC_TASK_BLOCK_COLOR }}
                        />
                        <span className="text-sm text-gray-600">Couleur automatique pour les blocs de tâche</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex space-x-2">
                      {((editingBlock && editingBlock.systemBehavior !== 'NONE') ? PREDEFINED_COLORS : PREDEFINED_COLORS.filter(c => !RESERVED_COLORS.includes(c))).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setValue('color', color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            watchedColor === color ? 'border-gray-800' : 'border-gray-300'
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
                          {...register('content')}
                          rows={8}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Contenu du bloc..."
                        />
                        {errors.content && (
                          <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  {!editingBlock?.isSystemBlock && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sauvegarde...' : (editingBlock ? 'Mettre à jour' : 'Créer')}
                    </button>
                  )}
                  {editingBlock?.isSystemBlock && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sauvegarde...' : 'Mettre à jour'}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};