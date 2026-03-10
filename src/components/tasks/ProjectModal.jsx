import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { safeJsonParse } from '../../utils/safeJsonParse';

export default function ProjectModal({ project, onClose, onSave, clients = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft',
    priority: 'normal',
    startDate: '',
    dueDate: '',
    tags: [],
    clientId: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'draft',
        priority: project.priority || 'normal',
        startDate: project.start_date ? project.start_date.split('T')[0] : '',
        dueDate: project.due_date ? project.due_date.split('T')[0] : '',
        tags: safeJsonParse(project.tags, []),
        clientId: project.client_id ?? project.clientId ?? '',
      });
    } else {
      setFormData((prev) => ({ ...prev, clientId: '' }));
    }
  }, [project]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-lg border border-dark-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-dark-text">
            {project ? 'Modifier le projet' : 'Nouveau projet'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-dark-surfaceHover rounded-lg transition-colors">
            <X size={20} className="text-dark-textSecondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="label">Nom du projet *</label>
            <input
              type="text"
              autoComplete="off"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Client</label>
            <select
              value={String(formData.clientId ?? '')}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="input"
            >
              <option value="">— Aucun client —</option>
              {(Array.isArray(clients) ? clients : []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company || c.name || 'Sans nom'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              autoComplete="off"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="input resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date de début</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Date limite</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="draft">Brouillon</option>
                <option value="active">Actif</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            <div>
              <label className="label">Priorité</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                autoComplete="off"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Ajouter un tag"
                className="input flex-1"
              />
              <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-400" aria-label={`Supprimer le tag ${tag}`} title="Supprimer">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-dark-border">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-dark-surfaceHover hover:bg-dark-border text-dark-text rounded-lg transition-colors">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              {project ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
