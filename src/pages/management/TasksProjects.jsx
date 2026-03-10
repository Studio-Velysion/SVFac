import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Archive, Copy, Trash2, Edit, MoreVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import ProjectModal from '../../components/tasks/ProjectModal';
import { safeJsonParse } from '../../utils/safeJsonParse';

export default function TasksProjects({ tasksApi }) {
  const [projects, setProjects] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (tasksApi) loadProjects();
  }, [tasksApi]);

  const loadProjects = async () => {
    if (!tasksApi) return;
    try {
      const data = await tasksApi.getProjects();
      setProjects(Array.isArray(data) ? data : []);
      const stats = {};
      for (const project of Array.isArray(data) ? data : []) {
        try {
          stats[project.id] = await tasksApi.getTaskStats(project.id);
        } catch {
          stats[project.id] = { todo: 0, in_progress: 0, pending: 0, done: 0, total: 0 };
        }
      }
      setTaskStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des projets');
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!globalThis.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    try {
      await tasksApi.deleteProject(id);
      toast.success('Projet supprimé');
      loadProjects();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleArchive = async (id) => {
    try {
      await tasksApi.archiveProject(id);
      toast.success('Projet archivé');
      loadProjects();
    } catch (error) {
      toast.error("Erreur lors de l'archivage");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await tasksApi.duplicateProject(id);
      toast.success('Projet dupliqué');
      loadProjects();
    } catch (error) {
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleSave = async (projectData) => {
    try {
      if (editingProject) {
        await tasksApi.updateProject(editingProject.id, projectData);
        toast.success('Projet modifié');
      } else {
        await tasksApi.createProject(projectData);
        toast.success('Projet créé');
      }
      setIsModalOpen(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'all') return p.status !== 'archived';
    if (filter === 'archived') return p.status === 'archived';
    return p.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'normal': return 'bg-blue-500/20 text-blue-400';
      case 'low': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const statusLabel = (s) => ({ active: 'Actif', in_progress: 'En cours', completed: 'Terminé', draft: 'Brouillon', archived: 'Archivé' }[s] || s);
  const priorityLabel = (p) => ({ high: 'Haute', normal: 'Normale', low: 'Basse' }[p] || p);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-text">Projets</h1>
        <button type="button" onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={20} />
          Nouveau projet
        </button>
      </div>
      <div className="flex gap-2">
        {['all', 'active', 'in_progress', 'completed', 'archived'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === status ? 'bg-blue-600 text-white' : 'bg-dark-surfaceHover text-dark-textSecondary hover:text-dark-text'}`}
          >
            {status === 'all' ? 'Tous' : statusLabel(status)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const tags = safeJsonParse(project.tags, []);
          return (
            <div key={project.id} className="bg-dark-surface rounded-lg p-6 border border-dark-border hover:border-dark-border/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <Link to={`/management/projects/${project.id}`} className="flex-1">
                  <h3 className="text-lg font-semibold text-dark-text mb-2 hover:text-blue-400 transition-colors">{project.name}</h3>
                </Link>
                <div className="relative group">
                  <button type="button" className="p-1 hover:bg-dark-surfaceHover rounded" aria-label="Options" title="Options">
                    <MoreVertical size={16} className="text-dark-textSecondary" />
                  </button>
                  <div className="absolute right-0 top-8 bg-dark-surface border border-dark-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[150px]">
                    <button type="button" onClick={() => handleEdit(project)} className="w-full text-left px-4 py-2 hover:bg-dark-surfaceHover flex items-center gap-2 text-dark-text">
                      <Edit size={16} /> Modifier
                    </button>
                    <button type="button" onClick={() => handleDuplicate(project.id)} className="w-full text-left px-4 py-2 hover:bg-dark-surfaceHover flex items-center gap-2 text-dark-text">
                      <Copy size={16} /> Dupliquer
                    </button>
                    <button type="button" onClick={() => handleArchive(project.id)} className="w-full text-left px-4 py-2 hover:bg-dark-surfaceHover flex items-center gap-2 text-dark-text">
                      <Archive size={16} /> Archiver
                    </button>
                    <button type="button" onClick={() => handleDelete(project.id)} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-2">
                      <Trash2 size={16} /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
              {project.description && <p className="text-sm text-dark-textSecondary mb-4 line-clamp-2">{project.description}</p>}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}>{statusLabel(project.status)}</span>
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(project.priority)}`}>{priorityLabel(project.priority)}</span>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-dark-surfaceHover text-dark-textSecondary rounded">{tag}</span>
                  ))}
                </div>
              )}
              {taskStats[project.id] && taskStats[project.id].total > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-dark-surfaceHover rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-400">{taskStats[project.id].todo}</div>
                    <div className="text-xs text-dark-textSecondary">À faire</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-400">{taskStats[project.id].in_progress}</div>
                    <div className="text-xs text-dark-textSecondary">En cours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-400">{taskStats[project.id].pending}</div>
                    <div className="text-xs text-dark-textSecondary">En attente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">{taskStats[project.id].done}</div>
                    <div className="text-xs text-dark-textSecondary">Terminé</div>
                  </div>
                </div>
              )}
              {project.due_date && <p className="text-xs text-dark-textSecondary">Échéance: {new Date(project.due_date).toLocaleDateString('fr-FR')}</p>}
            </div>
          );
        })}
      </div>
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-dark-textSecondary">
          <p>Aucun projet trouvé</p>
        </div>
      )}
      {isModalOpen && (
        <ProjectModal
          project={editingProject}
          clients={tasksApi.getClients?.() ?? []}
          onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
