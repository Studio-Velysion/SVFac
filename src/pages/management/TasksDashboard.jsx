import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, AlertCircle, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { toast } from 'react-toastify';

function StatCard({ title, value, total, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };
  return (
    <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
      <div className="flex items-center justify-between mb-2">
        <Icon size={24} className={colorClasses[color]} />
        <span className="text-3xl font-bold text-dark-text">{value}</span>
      </div>
      <p className="text-sm text-dark-textSecondary">{title}</p>
      {total !== undefined && <p className="text-xs text-dark-textSecondary mt-1">sur {total}</p>}
    </div>
  );
}

export default function TasksDashboard({ tasksApi }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    urgentTasks: 0,
  });

  useEffect(() => {
    if (tasksApi) loadData();
  }, [tasksApi]);

  const loadData = async () => {
    if (!tasksApi) return;
    try {
      const [projectsData, tasksData] = await Promise.all([tasksApi.getProjects(), tasksApi.getTasks()]);
      const safeProjects = Array.isArray(projectsData) ? projectsData : [];
      const safeTasks = Array.isArray(tasksData) ? tasksData : [];
      setProjects(safeProjects);
      setTasks(safeTasks);
      const now = new Date();
      const activeProjects = safeProjects.filter((p) => p.status === 'active' || p.status === 'in_progress');
      const completedTasks = safeTasks.filter((t) => t.status === 'done');
      const overdueTasks = safeTasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done');
      const urgentTasks = safeTasks.filter((t) => t.priority === 'high' && t.status !== 'done');
      setStats({
        totalProjects: safeProjects.length,
        activeProjects: activeProjects.length,
        totalTasks: safeTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        urgentTasks: urgentTasks.length,
      });
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'in_progress').slice(0, 5);
  const urgentTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').slice(0, 5);
  const overdueTasks = tasks.filter((t) => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).slice(0, 5);
  const upcomingDeadlines = tasks
    .filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      const diffDays = Math.ceil((new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);
  const progressPercentage = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-dark-text">Tâches</h1>
        <div className="flex items-center gap-2">
          <Link to="/management/projects" className="flex items-center gap-2 px-4 py-2 bg-dark-surfaceHover hover:bg-dark-border border border-dark-border text-dark-text rounded-lg transition-colors">
            <FolderKanban size={20} />
            Gérer projets
          </Link>
          <Link to="/management/projects" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={20} />
            Nouveau projet
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Projets actifs" value={stats.activeProjects} total={stats.totalProjects} icon={CheckCircle2} color="blue" />
        <StatCard title="Tâches terminées" value={stats.completedTasks} total={stats.totalTasks} icon={CheckCircle2} color="green" />
        <StatCard title="Tâches en retard" value={stats.overdueTasks} icon={AlertCircle} color="red" />
        <StatCard title="Tâches urgentes" value={stats.urgentTasks} icon={Clock} color="orange" />
      </div>
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-dark-text">Progression globale</h3>
          <span className="text-2xl font-bold text-dark-text">{progressPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-dark-surfaceHover rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} role="progressbar" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
          <h3 className="text-lg font-semibold text-dark-text mb-4">Projets actifs</h3>
          {activeProjects.length > 0 ? (
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <Link key={project.id} to={`/management/projects/${project.id}`} className="block p-3 bg-dark-surfaceHover rounded-lg hover:bg-dark-border transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-dark-text">{project.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${project.priority === 'high' ? 'bg-red-500/20 text-red-400' : project.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {project.priority}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-dark-textSecondary">Aucun projet actif</p>
          )}
        </div>
        <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
          <h3 className="text-lg font-semibold text-dark-text mb-4">Tâches urgentes</h3>
          {urgentTasks.length > 0 ? (
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <div key={task.id} className="p-3 bg-dark-surfaceHover rounded-lg">
                  <span className="font-medium text-dark-text">{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-textSecondary">Aucune tâche urgente</p>
          )}
        </div>
        {overdueTasks.length > 0 && (
          <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Tâches en retard
            </h3>
            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <div key={task.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="font-medium text-dark-text">{task.title}</span>
                  {task.due_date && <p className="text-xs text-red-400 mt-1">Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {upcomingDeadlines.length > 0 && (
          <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Prochaines échéances
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.map((task) => (
                <div key={task.id} className="p-3 bg-dark-surfaceHover rounded-lg">
                  <span className="font-medium text-dark-text">{task.title}</span>
                  {task.due_date && <p className="text-xs text-dark-textSecondary mt-1">{new Date(task.due_date).toLocaleDateString('fr-FR')}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
