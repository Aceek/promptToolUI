import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
// Importez le service API
import { promptApi } from '../services/api';

const MainPage = () => {
  const [finalRequest, setFinalRequest] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    workspaces,
    formats,
    roles,
    selectedWorkspace,
    selectedFiles,
    selectedFormat,
    selectedRole,
    setSelectedWorkspace,
    setSelectedFormat,
    setSelectedRole,
    fetchWorkspaces,
    fetchFormats,
    fetchRoles
  } = useAppStore();

  useEffect(() => {
    fetchWorkspaces();
    fetchFormats();
    fetchRoles();
  }, [fetchWorkspaces, fetchFormats, fetchRoles]);

  const handleGeneratePrompt = async () => {
    if (!selectedWorkspace || !selectedFormat || !selectedRole) {
      alert('Veuillez sélectionner un espace de travail, un format et un rôle');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await promptApi.generate({
        workspaceId: selectedWorkspace.id,
        finalRequest,
        selectedFilePaths: selectedFiles,
        formatId: selectedFormat.id,
        roleId: selectedRole.id,
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
                onChange={(e) => {
                  const workspace = workspaces.find(w => w.id === e.target.value);
                  setSelectedWorkspace(workspace || null);
                }}
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
                onChange={(e) => {
                  setSelectedFormat(e.target.value || null);
                }}
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
                onChange={(e) => {
                  setSelectedRole(e.target.value || null);
                }}
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

          {/* Bouton de génération */}
          <div className="flex justify-center">
            <button
              className="btn-primary"
              onClick={handleGeneratePrompt}
              disabled={isGenerating || !selectedWorkspace || !selectedFormat || !selectedRole}
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