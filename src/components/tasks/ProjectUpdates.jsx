import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProjectUpdates({ tasksApi, projectId }) {
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    if (tasksApi) loadUpdates();
    else setIsLoading(false);
  }, [projectId, tasksApi]);

  const loadUpdates = async () => {
    if (!tasksApi) return;
    try {
      setIsLoading(true);
      const data = await tasksApi.getProjectUpdates(projectId);
      setUpdates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des mises à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (update) => {
    if (update) {
      setEditingUpdate(update);
      setFormData({ title: update.title, content: update.content });
    } else {
      setEditingUpdate(null);
      setFormData({ title: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUpdate(null);
    setFormData({ title: '', content: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      if (editingUpdate) {
        await tasksApi.updateProjectUpdate(editingUpdate.id, formData);
        toast.success('Mise à jour modifiée');
      } else {
        await tasksApi.createProjectUpdate({ projectId, title: formData.title, content: formData.content });
        toast.success('Mise à jour créée');
      }
      handleCloseModal();
      loadUpdates();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!globalThis.confirm('Êtes-vous sûr de vouloir supprimer cette mise à jour ?')) return;
    try {
      await tasksApi.deleteProjectUpdate(id);
      toast.success('Mise à jour supprimée');
      loadUpdates();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-textSecondary">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark-text">Mises à jour du projet</h2>
        <button type="button" onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={16} />
          Nouvelle mise à jour
        </button>
      </div>
      {updates.length === 0 ? (
        <div className="bg-dark-surface rounded-lg p-8 border border-dark-border text-center">
          <p className="text-dark-textSecondary mb-4">Aucune mise à jour pour le moment</p>
          <button type="button" onClick={() => handleOpenModal()} className="text-blue-400 hover:text-blue-300">
            Créer la première mise à jour
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div key={update.id} className="bg-dark-surface rounded-lg p-6 border border-dark-border hover:border-blue-500/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-dark-text mb-2">{update.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-dark-textSecondary mb-3">
                    <Calendar size={14} />
                    <span>
                      {new Date(update.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleOpenModal(update)} className="p-2 hover:bg-dark-surfaceHover rounded transition-colors" title="Modifier">
                    <Edit size={16} className="text-dark-textSecondary" />
                  </button>
                  <button type="button" onClick={() => handleDelete(update.id)} className="p-2 hover:bg-red-500/20 rounded transition-colors" title="Supprimer">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
              <div className="text-dark-text whitespace-pre-wrap">{update.content}</div>
            </div>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface rounded-lg border border-dark-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h2 className="text-xl font-bold text-dark-text">{editingUpdate ? 'Modifier la mise à jour' : 'Nouvelle mise à jour'}</h2>
              <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-dark-surfaceHover rounded-lg transition-colors">
                <span className="text-dark-textSecondary text-xl">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-dark-surfaceHover border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Avancement du projet..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">Contenu *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={10}
                  className="w-full px-4 py-2 bg-dark-surfaceHover border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Décrivez les avancements..."
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-dark-border">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-dark-surfaceHover hover:bg-dark-border text-dark-text rounded-lg transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  {editingUpdate ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
