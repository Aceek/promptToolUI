import React from 'react';
import { useIgnorePatternsPage } from './hooks/useIgnorePatternsPage';

const IgnorePatternsPage = () => {
  const {
    patterns,
    newPattern,
    isLoading,
    defaultPatterns,
    setNewPattern,
    addPattern,
    removePattern,
    addDefaultPattern,
    saveSettings,
  } = useIgnorePatternsPage();

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Patterns d'exclusion globaux</h1>
          <p className="text-gray-600">
            Définissez les fichiers et dossiers à ignorer lors de l'analyse des projets
          </p>
        </div>

        <div className="card-content space-y-6">
          {/* Ajouter un nouveau pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ajouter un pattern
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="input flex-1"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="ex: *.log, node_modules/**, .env*"
                onKeyPress={(e) => e.key === 'Enter' && addPattern()}
              />
              <button
                className="btn-primary"
                onClick={addPattern}
                disabled={!newPattern.trim()}
              >
                Ajouter
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Utilisez ** pour les dossiers récursifs, * pour les wildcards
            </p>
          </div>

          {/* Patterns suggérés */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Patterns suggérés</h3>
            <div className="flex flex-wrap gap-2">
              {defaultPatterns.map((pattern) => (
                <button
                  key={pattern}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    patterns.includes(pattern)
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                  onClick={() => addDefaultPattern(pattern)}
                  disabled={patterns.includes(pattern)}
                >
                  {pattern}
                  {patterns.includes(pattern) && ' ✓'}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des patterns actuels */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Patterns configurés ({patterns.length})
            </h3>
            {patterns.length > 0 ? (
              <div className="space-y-2">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <code className="text-sm text-gray-800">{pattern}</code>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm"
                      onClick={() => removePattern(index)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                Aucun pattern configuré
              </div>
            )}
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={saveSettings}
            >
              Sauvegarder les paramètres
            </button>
          </div>

          {/* Aide */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Aide</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><code>*.log</code> - Ignore tous les fichiers .log</li>
              <li><code>node_modules/**</code> - Ignore tout le dossier node_modules</li>
              <li><code>.env*</code> - Ignore tous les fichiers commençant par .env</li>
              <li><code>dist/</code> - Ignore le dossier dist</li>
              <li><code>**/*.tmp</code> - Ignore tous les fichiers .tmp dans tous les sous-dossiers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IgnorePatternsPage;