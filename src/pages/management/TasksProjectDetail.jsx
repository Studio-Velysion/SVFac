import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import KanbanBoard from '../../components/tasks/KanbanBoard';
import NotesEditor from '../../components/tasks/NotesEditor';
import ProjectUpdates from '../../components/tasks/ProjectUpdates';
import ProjectModal from '../../components/tasks/ProjectModal';
import TaskModal from '../../components/tasks/TaskModal';
import { safeJsonParse } from '../../utils/safeJsonParse';

export default function TasksProjectDetail({ tasksApi }) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('kanban');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (id && tasksApi) {
      loadProject();
      loadTasks();
    }
  }, [id, tasksApi]);

  const loadProject = async () => {
    if (!id || !tasksApi) return;
    try {
      const data = await tasksApi.getProject(parseInt(id));
      setProject(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du projet');
    }
  };

  const loadTasks = async () => {
    if (!id || !tasksApi) return;
    try {
      const data = await tasksApi.getTasks(parseInt(id));
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        await tasksApi.updateTask(editingTask.id, taskData);
        toast.success('Tâche modifiée');
      } else {
        await tasksApi.createTask({ ...taskData, projectId: parseInt(id) });
        toast.success('Tâche créée');
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleUpdateProject = async (projectData) => {
    if (!id || !tasksApi) return;
    try {
      await tasksApi.updateProject(parseInt(id), projectData);
      toast.success('Projet modifié');
      setIsProjectModalOpen(false);
      loadProject();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-dark-textSecondary">Chargement...</div>
      </div>
    );
  }

  const tags = safeJsonParse(project.tags, []);
  const statusLabel = (s) => ({ active: 'Actif', in_progress: 'En cours', completed: 'Terminé', draft: 'Brouillon', archived: 'Archivé' }[s] || s);
  const priorityLabel = (p) => ({ high: 'Haute', normal: 'Normale', low: 'Basse' }[p] || p);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/management/projects" className="p-2 hover:bg-dark-surfaceHover rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-dark-textSecondary" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-dark-text">{project.name}</h1>
            {project.description && <p className="text-dark-textSecondary mt-1">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-dark-surfaceHover hover:bg-dark-border text-dark-text rounded-lg transition-colors">
            <Edit size={16} />
            Modifier
          </button>
          <button type="button" onClick={handleCreateTask} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={20} />
            Nouvelle tâche
          </button>
        </div>
      </div>
      <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-sm text-dark-textSecondary">Statut:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${project.status === 'active' || project.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : project.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {statusLabel(project.status)}
            </span>
          </div>
          <div>
            <span className="text-sm text-dark-textSecondary">Priorité:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${project.priority === 'high' ? 'bg-red-500/20 text-red-400' : project.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {priorityLabel(project.priority)}
            </span>
          </div>
          {project.start_date && (
            <div>
              <span className="text-sm text-dark-textSecondary">Début:</span>
              <span className="ml-2 text-sm text-dark-text">{new Date(project.start_date).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          {project.due_date && (
            <div>
              <span className="text-sm text-dark-textSecondary">Échéance:</span>
              <span className="ml-2 text-sm text-dark-text">{new Date(project.due_date).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-dark-surfaceHover text-dark-textSecondary rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 border-b border-dark-border">
        <button
          type="button"
          onClick={() => setActiveTab('kanban')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'kanban' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-dark-textSecondary hover:text-dark-text'}`}
        >
          Tâches
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'notes' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-dark-textSecondary hover:text-dark-text'}`}
        >
          Notes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'updates' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-dark-textSecondary hover:text-dark-text'}`}
        >
          Mises à jour
        </button>
      </div>
      {activeTab === 'kanban' && <KanbanBoard tasksApi={tasksApi} tasks={tasks} onTaskUpdate={loadTasks} onEditTask={handleEditTask} />}
      {activeTab === 'notes' && <NotesEditor tasksApi={tasksApi} projectId={parseInt(id)} />}
      {activeTab === 'updates' && <ProjectUpdates tasksApi={tasksApi} projectId={parseInt(id)} />}
      {isProjectModalOpen && (
        <ProjectModal
          project={project}
          clients={tasksApi.getClients?.() ?? []}
          onClose={() => setIsProjectModalOpen(false)}
          onSave={handleUpdateProject}
        />
      )}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          projectId={parseInt(id)}
          onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}
