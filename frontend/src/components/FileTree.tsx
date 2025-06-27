import { useState } from 'react';
import { FileNode } from '../store/useAppStore';

interface FileTreeProps {
  nodes: FileNode[];
  selectedFiles: string[];
  onSelectionChange: (files: string[]) => void;
  level?: number;
}

interface FileTreeNodeProps {
  node: FileNode;
  selectedFiles: string[];
  onSelectionChange: (files: string[]) => void;
  level: number;
}

const FileTreeNode = ({ node, selectedFiles, onSelectionChange, level }: FileTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  
  const isSelected = selectedFiles.includes(node.path);
  const isDirectory = node.type === 'directory';
  
  // Check if all children are selected (for directories)
  const getChildrenSelectionState = () => {
    if (!isDirectory || !node.children) return { allSelected: false, someSelected: false };
    
    const allFiles = getAllFilesInNode(node);
    const selectedCount = allFiles.filter(file => selectedFiles.includes(file)).length;
    
    return {
      allSelected: selectedCount === allFiles.length && allFiles.length > 0,
      someSelected: selectedCount > 0 && selectedCount < allFiles.length
    };
  };

  const getAllFilesInNode = (node: FileNode): string[] => {
    if (node.type === 'file') {
      return [node.path];
    }
    
    if (!node.children) return [];
    
    return node.children.flatMap(child => getAllFilesInNode(child));
  };

  const handleToggle = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    if (isDirectory) {
      // For directories, select/deselect all files within
      const allFiles = getAllFilesInNode(node);
      const { allSelected } = getChildrenSelectionState();
      
      if (allSelected) {
        // Deselect all files in this directory
        const newSelection = selectedFiles.filter(file => !allFiles.includes(file));
        onSelectionChange(newSelection);
      } else {
        // Select all files in this directory
        const newSelection = [...new Set([...selectedFiles, ...allFiles])];
        onSelectionChange(newSelection);
      }
    } else {
      // For files, toggle selection
      if (isSelected) {
        onSelectionChange(selectedFiles.filter(file => file !== node.path));
      } else {
        onSelectionChange([...selectedFiles, node.path]);
      }
    }
  };

  const { allSelected, someSelected } = isDirectory ? getChildrenSelectionState() : { allSelected: false, someSelected: false };
  const indentStyle = { paddingLeft: `${level * 20}px` };

  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer ${
          isSelected ? 'bg-blue-50' : ''
        }`}
        style={indentStyle}
        onClick={handleToggle}
      >
        {/* Expand/Collapse icon for directories */}
        {isDirectory && (
          <span className="mr-1 text-gray-500 w-4 text-center">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        
        {/* Checkbox */}
        <input
          type="checkbox"
          className="mr-2"
          checked={isDirectory ? allSelected : isSelected}
          ref={(input) => {
            if (input && isDirectory && someSelected && !allSelected) {
              input.indeterminate = true;
            }
          }}
          onChange={handleSelection}
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Icon */}
        <span className="mr-2">
          {isDirectory ? '📁' : '📄'}
        </span>
        
        {/* Name */}
        <span className={`text-sm ${isDirectory ? 'font-medium' : ''}`}>
          {node.name}
        </span>
      </div>
      
      {/* Children */}
      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selectedFiles={selectedFiles}
              onSelectionChange={onSelectionChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ nodes, selectedFiles, onSelectionChange, level = 0 }: FileTreeProps) => {
  return (
    <div className="file-tree">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedFiles={selectedFiles}
          onSelectionChange={onSelectionChange}
          level={level}
        />
      ))}
    </div>
  );
};

export default FileTree;