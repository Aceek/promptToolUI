import React from 'react';

interface GeneratedPromptModalProps {
  isOpen: boolean;
  prompt: string;
  onCopy: () => void;
  onClose: () => void;
}

export const GeneratedPromptModal: React.FC<GeneratedPromptModalProps> = ({
  isOpen,
  prompt,
  onCopy,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Prompt Généré</h2>
            <div className="flex space-x-2">
              <button
                onClick={onCopy}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 Copier
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-auto whitespace-pre-wrap max-h-96">
            {prompt}
          </pre>
        </div>
      </div>
    </div>
  );
};