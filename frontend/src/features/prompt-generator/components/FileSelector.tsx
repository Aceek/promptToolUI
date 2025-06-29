import React from 'react';
import { FileTree } from '../../../components';
import { FileNode, Workspace } from '../../../store/useAppStore';

interface FileSelectorProps {
  selectedWorkspace: Workspace | null;
  fileStructure: FileNode[];
  selectedFiles: string[];
  isLoadingStructure: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRefreshStructure: () => void;
  onSelectionChange: (files: string[]) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  selectedWorkspace,
  fileStructure,
  selectedFiles,
  isLoadingStructure,
  onSelectAll,
  onDeselectAll,
  onRefreshStructure,
  onSelectionChange,
}) => {
  if (!selectedWorkspace) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Sélection de fichiers */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Fichiers à inclure ({selectedFiles.length} sélectionné{selectedFiles.length !== 1 ? 's' : ''})
          </label>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onSelectAll} 
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Tout sél.
            </button>
            <button 
              onClick={onDeselectAll} 
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Tout désél.
            </button>
            <button 
              onClick={onRefreshStructure} 
              className="text-blue-600 hover:text-blue-800 text-xs" 
              title="Rafraîchir l'arborescence"
            >
              {isLoadingStructure ? '...' : '🔄'}
            </button>
          </div>
        </div>
        
        {isLoadingStructure ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            Chargement de la structure...
          </div>
        ) : fileStructure.length > 0 ? (
          <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-auto bg-white">
            <FileTree
              nodes={fileStructure}
              selectedFiles={selectedFiles}
              onSelectionChange={onSelectionChange}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
            Aucun fichier trouvé dans ce workspace
          </div>
        )}
      </div>
    </div>
  );
};