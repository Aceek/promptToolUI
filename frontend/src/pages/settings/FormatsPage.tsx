import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

const FormatsPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFormat, setEditingFormat] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    examples: ''
  });

  const { formats, fetchFormats } = useAppStore();

  useEffect(() => {
    fetchFormats();
  }, [fetchFormats]);

  const resetForm = () => {
    setFormData({
      name: '',
      instructions: '',
      examples: ''
    });
    setIsCreating(false);
    setEditingFormat(null);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/formats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchFormats();
      } else {
        alert('Erreur lors de la création du format');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du format');
    }
  };

  const handleUpdate = async () => {
    if (!editingFormat) return;

    try {
      const response = await fetch(`/api/formats/${editingFormat}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchFormats();
      } else {
        alert('Erreur lors de la mise à jour du format');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du format');
    }
  };

  const handleEdit = (format: any) => {
    setFormData({
      name: format.name,
      instructions: format.instructions,
      examples: format.examples
    });
    setEditingFormat(format.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce format ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/formats/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFormats();
      } else {
        alert('Erreur lors de la suppression du format');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du format');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Formats de réponse</h1>
              <p className="text-gray-600">Définissez comment l'IA doit structurer ses réponses</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setIsCreating(true)}
            >
              + Nouveau format
            </button>
          </div>
        </div>

        <div className="card-content">
          {/* Formulaire de création/édition */}
          {isCreating && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingFormat ? 'Modifier le format' : 'Nouveau format'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom du format"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    className="textarea"
                    rows={6}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Instructions pour structurer la réponse..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exemples
                  </label>
                  <textarea
                    className="textarea"
                    rows={6}
                    value={formData.examples}
                    onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                    placeholder="Exemples de réponses formatées..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="btn-secondary"
                  onClick={resetForm}
                >
                  Annuler
                </button>
                <button
                  className="btn-primary"
                  onClick={editingFormat ? handleUpdate : handleCreate}
                  disabled={!formData.name || !formData.instructions}
                >
                  {editingFormat ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          )}

          {/* Liste des formats */}
          <div className="space-y-4">
            {formats.map((format) => (
              <div key={format.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{format.name}</h3>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                      {format.instructions.substring(0, 200)}
                      {format.instructions.length > 200 && '...'}
                    </p>
                    {format.examples && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-500">Exemples:</span>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {format.examples.substring(0, 150)}
                          {format.examples.length > 150 && '...'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      className="btn-secondary text-sm"
                      onClick={() => handleEdit(format)}
                    >
                      Modifier
                    </button>
                    <button
                      className="btn-danger text-sm"
                      onClick={() => handleDelete(format.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {formats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun format configuré
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormatsPage;