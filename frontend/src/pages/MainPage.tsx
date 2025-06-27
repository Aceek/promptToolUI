import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { promptApi, workspaceApi } from '../services/api';
import { FileTree } from '../components';

const MainPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);

  const {
    workspaces,
    formats,
    roles,
    selectedWorkspace,
    selectedFiles,
    selectedFormat,
    selectedRole,
    finalRequest,
    generatedPrompt,
    fileStructure,
    setSelectedWorkspace,
    setSelectedFormat,
    setSelectedRole,
    setFinalRequest,
    setGeneratedPrompt,
    setFileStructure,
    setSelectedFiles,
    fetchWorkspaces,
    fetchFormats,
    fetchRoles,
    getSelectedFormat,
    getSelectedRole
  } = useAppStore();

  useEffect(() => {
    fetchWorkspaces();
    fetchFormats();
    fetchRoles();
  }, [fetchWorkspaces, fetchFormats, fetchRoles]);

  // Charger la structure de fichiers quand un workspace est sélectionné
  useEffect(() => {
    const loadFileStructure = async () => {
      if (!selectedWorkspace) {
        setFileStructure([]);
        return;
      }

      setIsLoadingStructure(true);
      try {
        const structure = await workspaceApi.getStructure(selectedWorkspace.id);
        setFileStructure(structure);
      } catch (error) {
        console.error('Erreur lors du chargement de la structure:', error);
        setFileStructure([]);
      } finally {
        setIsLoadingStructure(false);
      }
    };

    loadFileStructure();
  }, [selectedWorkspace, setFileStructure]);

  const handleGeneratePrompt = async () => {
    const currentFormat = getSelectedFormat();
    const currentRole = getSelectedRole();
    
    if (!selectedWorkspace || !currentFormat || !currentRole) {
      alert('Veuillez sélectionner un espace de travail, un format et un rôle');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Veuillez sélectionner au moins un fichier');
      return;
    }

    setIsGenerating(true);
    try {
      // Sauvegarder les sélections dans le workspace
      await workspaceApi.update(selectedWorkspace.id, {
        selectedFiles,
        lastFinalRequest: finalRequest,
      });

      const data = await promptApi.generate({
        workspaceId: selectedWorkspace.id,
        finalRequest,
        selectedFilePaths: selectedFiles,
        formatId: currentFormat.id,
        roleId: currentRole.id,
      });
      setGeneratedPrompt(data.prompt);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération du prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    alert('Prompt copié dans le presse-papiers !');
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    setSelectedWorkspace(workspace || null);
  };

  const handleFormatChange = (formatId: string) => {
    setSelectedFormat(formatId || null);
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId || null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Générateur de Prompts IA</h1>
          <p className="text-gray-600">Créez des prompts contextuels pour vos projets</p>
        </div>

        <div className="card-content space-y-6">
          {/* Sélecteurs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Espace de travail
              </label>
              <select
                className="select"
                value={selectedWorkspace?.id || ''}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
              >
                <option value="">Sélectionner un espace de travail</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format de réponse
              </label>
              <select
                className="select"
                value={selectedFormat?.id || ''}
                onChange={(e) => handleFormatChange(e.target.value)}
              >
                <option value="">Sélectionner un format</option>
                {formats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle de l'IA
              </label>
              <select
                className="select"
                value={selectedRole?.id || ''}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Demande finale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demande finale
            </label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Décrivez ce que vous voulez que l'IA fasse..."
              value={finalRequest}
              onChange={(e) => setFinalRequest(e.target.value)}
            />
          </div>

          {/* Sélection de fichiers */}
          {selectedWorkspace && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichiers à inclure ({selectedFiles.length} sélectionné{selectedFiles.length !== 1 ? 's' : ''})
              </label>
              {isLoadingStructure ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  Chargement de la structure...
                </div>
              ) : fileStructure.length > 0 ? (
                <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-auto bg-gray-50">
                  <FileTree
                    nodes={fileStructure}
                    selectedFiles={selectedFiles}
                    onSelectionChange={setSelectedFiles}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-md">
                  Aucun fichier trouvé dans ce workspace
                </div>
              )}
            </div>
          )}

          {!selectedWorkspace && (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-md">
              Sélectionnez un espace de travail pour voir les fichiers
            </div>
          )}

          {/* Bouton de génération */}
          <div className="flex justify-center">
            <button
              className="btn-primary"
              onClick={handleGeneratePrompt}
              disabled={isGenerating || !selectedWorkspace || !selectedFormat || !selectedRole || selectedFiles.length === 0}
            >
              {isGenerating ? 'Génération...' : 'Générer le Prompt'}
            </button>
          </div>

          {/* Prompt généré */}
          {generatedPrompt && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Prompt généré
                </label>
                <button
                  className="btn-secondary text-sm"
                  onClick={copyToClipboard}
                >
                  📋 Copier
                </button>
              </div>
              <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;