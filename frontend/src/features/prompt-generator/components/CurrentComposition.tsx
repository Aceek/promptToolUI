import React from 'react';
import { CurrentCompositionItem } from '../../../store/useAppStore';

interface CompositionBlock {
  id: string;
  block: any;
  order: number;
  uniqueId: string;
}

interface CurrentCompositionProps {
  currentComposition: CurrentCompositionItem[];
  renderedComposition: CompositionBlock[];
  hasDynamicTaskBlock: boolean;
  finalRequest: string;
  onFinalRequestChange: (value: string) => void;
  onClearComposition: () => void;
  onRemoveBlock: (index: number) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
}

export const CurrentComposition: React.FC<CurrentCompositionProps> = ({
  currentComposition,
  renderedComposition,
  hasDynamicTaskBlock,
  finalRequest,
  onFinalRequestChange,
  onClearComposition,
  onRemoveBlock,
  onMoveBlock,
}) => {
  // Fonction pour rendre un bloc de tâche dynamique avec le textarea intégré
  const renderDynamicTaskBlock = (compBlock: CompositionBlock, index: number) => {
    let taskContent = { prefix: '', suffix: '' };
    try {
      taskContent = JSON.parse(compBlock.block.content);
    } catch (e) {
      // Fallback pour l'ancien format
    }

    return (
      <div
        key={compBlock.uniqueId}
        className="bg-white border border-gray-200 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: compBlock.block.color || '#6B7280' }}
            ></div>
            <div>
              <span className="font-medium text-sm">{compBlock.block.name}</span>
              <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded ml-2">
                Tâche Dynamique
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {index > 0 && (
              <button
                onClick={() => onMoveBlock(index, index - 1)}
                className="text-gray-400 hover:text-gray-600"
              >
                ↑
              </button>
            )}
            {index < renderedComposition.length - 1 && (
              <button
                onClick={() => onMoveBlock(index, index + 1)}
                className="text-gray-400 hover:text-gray-600"
              >
                ↓
              </button>
            )}
            <button
              onClick={() => onRemoveBlock(index)}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenu du bloc avec textarea intégré */}
        <div className="space-y-3">
          {taskContent.prefix && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{taskContent.prefix}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demande finale
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
              rows={3}
              placeholder="Décrivez ce que vous voulez que l'IA fasse..."
              value={finalRequest}
              onChange={(e) => onFinalRequestChange(e.target.value)}
            />
          </div>
          
          {taskContent.suffix && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{taskContent.suffix}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Fonction pour rendre un bloc normal
  const renderNormalBlock = (compBlock: CompositionBlock, index: number) => (
    <div
      key={compBlock.uniqueId}
      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
    >
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: compBlock.block.color || '#6B7280' }}
        ></div>
        <div>
          <span className="font-medium text-sm">{compBlock.block.name}</span>
          {compBlock.block.isSystemBlock && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-2">
              ⚙️ Système
            </span>
          )}
          {compBlock.block.description && (
            <p className="text-xs text-gray-500">{compBlock.block.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {index > 0 && (
          <button
            onClick={() => onMoveBlock(index, index - 1)}
            className="text-gray-400 hover:text-gray-600"
          >
            ↑
          </button>
        )}
        {index < renderedComposition.length - 1 && (
          <button
            onClick={() => onMoveBlock(index, index + 1)}
            className="text-gray-400 hover:text-gray-600"
          >
            ↓
          </button>
        )}
        <button
          onClick={() => onRemoveBlock(index)}
          className="text-red-400 hover:text-red-600"
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Composition Actuelle ({currentComposition.length} blocs)
        </h2>
        <button
          onClick={onClearComposition}
          className="text-red-600 hover:text-red-800 text-sm"
          disabled={currentComposition.length === 0}
        >
          Vider
        </button>
      </div>

      {currentComposition.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          <p className="text-lg mb-2">Votre composition est vide</p>
          <p className="text-sm">Cliquez sur les blocs de gauche pour les ajouter à votre composition</p>
        </div>
      ) : (
        <div className="space-y-2">
          {renderedComposition.map((compBlock, index) =>
            compBlock.block.type === 'DYNAMIC_TASK'
              ? renderDynamicTaskBlock(compBlock, index)
              : renderNormalBlock(compBlock, index)
          )}
        </div>
      )}

      {/* Guidage contextuel pour ajouter une tâche */}
      {!hasDynamicTaskBlock && currentComposition.length > 0 && (
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-blue-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-blue-800">Comment ajouter votre tâche ?</p>
              <p className="text-sm text-blue-700">Pour spécifier votre demande, ajoutez un bloc "Tâche Utilisateur" (ou un autre bloc de type Tâche Dynamique) depuis la bibliothèque à votre composition.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};