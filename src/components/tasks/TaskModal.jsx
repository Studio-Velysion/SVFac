import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { safeJsonParse } from '../../utils/safeJsonParse';

export default function TaskModal({ task, projectId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'normal',
    dueDate: '',
    checklist: [],
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (task) {
      const parsedChecklist = safeJsonParse(task.checklist, []);
      const checklistWithIds = parsedChecklist.map((item, index) => ({
        id: item.id || `item-${index}-${Date.now()}`,
        text: item.text,
        checked: item.checked || false,
      }));
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'normal',
        dueDate: task.due_date ? task.due_date.split('T')[0] : '',
        checklist: checklistWithIds,
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        checklist: [...formData.checklist, { id: String(Date.now()), text: newChecklistItem.trim(), checked: false }],
      });
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklistItem = (id) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    });
  };

  const handleRemoveChecklistItem = (id) => {
    setFormData({ ...formData, checklist: formData.checklist.filter((item) => item.id !== id) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-lg border border-dark-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-dark-text">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-dark-surfaceHover rounded-lg transition-colors">
            <X size={20} className="text-dark-textSecondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="label">Titre *</label>
            <input
              type="text"
              autoComplete="off"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="input"
            />
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
              <label className="label">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="pending">En attente</option>
                <option value="done">Terminé</option>
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
            <label className="label">Date limite</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Checklist</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                autoComplete="off"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                placeholder="Ajouter un élément"
                className="input flex-1"
              />
              <button type="button" onClick={handleAddChecklistItem} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {formData.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-dark-surfaceHover rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleChecklistItem(item.id)}
                    className="w-4 h-4 rounded border-dark-border bg-dark-surface text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`flex-1 ${item.checked ? 'line-through text-dark-textSecondary' : 'text-dark-text'}`}>{item.text}</span>
                  <button type="button" onClick={() => handleRemoveChecklistItem(item.id)} className="p-1 hover:bg-red-500/20 rounded" aria-label={`Supprimer ${item.text}`} title="Supprimer">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-dark-border">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-dark-surfaceHover hover:bg-dark-border text-dark-text rounded-lg transition-colors">
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              {task ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
