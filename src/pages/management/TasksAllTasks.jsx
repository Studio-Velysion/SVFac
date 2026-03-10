import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TasksAllTasks({ tasksApi }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    if (tasksApi) loadData();
  }, [tasksApi]);

  const loadData = async () => {
    if (!tasksApi) return;
    try {
      const [tasksData, projectsData] = await Promise.all([tasksApi.getTasks(), tasksApi.getProjects()]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      const map = {};
      (Array.isArray(projectsData) ? projectsData : []).forEach((p) => { map[p.id] = p; });
      setProjects(map);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-500/20 text-gray-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'done': return 'bg-green-500/20 text-green-400';
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

  const statusLabel = (s) => ({ todo: 'À faire', in_progress: 'En cours', done: 'Terminé' }[s] || s);
  const priorityLabel = (p) => ({ high: 'Haute', normal: 'Normale', low: 'Basse' }[p] || p);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-text">Toutes les tâches</h1>
      </div>
      <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une tâche..."
              className="w-full pl-10 pr-4 py-2 bg-dark-surfaceHover border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-dark-surfaceHover border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Terminé</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 bg-dark-surfaceHover border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="high">Haute</option>
              <option value="normal">Normale</option>
              <option value="low">Basse</option>
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Link
            key={task.id}
            to={`/management/projects/${task.project_id}`}
            className="block bg-dark-surface rounded-lg p-4 border border-dark-border hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-dark-text mb-1">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-dark-textSecondary line-clamp-2 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3">
                  {projects[task.project_id] && (
                    <span className="text-xs text-blue-400">{projects[task.project_id].name}</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>{statusLabel(task.status)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>{priorityLabel(task.priority)}</span>
                  {task.due_date && (
                    <span className="text-xs text-dark-textSecondary">{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-dark-textSecondary">
          <p>Aucune tâche trouvée</p>
        </div>
      )}
    </div>
  );
}
