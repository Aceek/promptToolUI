import React from 'react';
import { PromptBlock, PromptComposition } from '../../../store/useAppStore';

interface BlockLibraryProps {
  blocks: PromptBlock[];
  compositions: PromptComposition[];
  selectedCompositionId: string | null;
  groupedBlocks: Record<string, PromptBlock[]>;
  onAddBlock: (block: PromptBlock) => void;
  onLoadComposition: (compositionId: string) => void;
}

export const BlockLibrary: React.FC<BlockLibraryProps> = ({
  blocks,
  compositions,
  selectedCompositionId,
  groupedBlocks,
  onAddBlock,
  onLoadComposition,
}) => {
  return (
    <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bibliothèque de Blocs</h2>
          <span className="text-sm text-gray-500">{blocks.length} blocs</span>
        </div>

        {/* Compositions sauvegardées */}
        {compositions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Compositions sauvegardées</h3>
            <div className="space-y-1">
              {compositions.map((composition) => (
                <button
                  key={composition.id}
                  onClick={() => onLoadComposition(composition.id)}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    selectedCompositionId === composition.id
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="font-medium">{composition.name}</div>
                  <div className="text-xs text-gray-500">{composition.blocks.length} blocs</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Blocs par catégorie */}
        <div className="space-y-4">
          {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => {
            const isSystemCategory = category === 'Blocs Fondamentaux';
            return (
              <div key={category}>
                <div className="flex items-center space-x-2 mb-2">
                  {isSystemCategory && <span className="text-blue-600">⚙️</span>}
                  <h3 className={`text-sm font-medium ${
                    isSystemCategory ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {category}
                  </h3>
                  {isSystemCategory && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Système
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {categoryBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onAddBlock(block)}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: block.color || '#6B7280' }}
                        ></div>
                        <span className="font-medium text-sm">{block.name}</span>
                      </div>
                      {block.description && (
                        <p className="text-xs text-gray-500 mt-1">{block.description}</p>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Type: {block.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};