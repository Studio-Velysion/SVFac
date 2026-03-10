import { useDrop, useDrag } from 'react-dnd';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { safeJsonParse } from '../../utils/safeJsonParse';

const statuses = [
  { id: 'todo', label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'pending', label: 'En attente' },
  { id: 'done', label: 'Terminé' },
];

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'high': return 'kanban-badge kanban-badge-priority-high';
    case 'normal': return 'kanban-badge kanban-badge-priority-normal';
    case 'low': return 'kanban-badge kanban-badge-priority-low';
    default: return 'kanban-badge kanban-badge-priority-low';
  }
}

function TaskCard({ task, onEdit, onDelete }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const checklist = safeJsonParse(task.checklist, []);
  const completedChecklistItems = checklist.filter((item) => item.checked).length;

  return (
    <div
      ref={drag}
      className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="kanban-card-title flex-1">{task.title}</h4>
      </div>
      {task.description && (
        <p className="kanban-card-desc">{task.description}</p>
      )}
      <div className="kanban-card-meta">
        <span className={getPriorityBadgeClass(task.priority)}>
          {task.priority === 'high' ? 'Haute' : task.priority === 'normal' ? 'Normale' : 'Basse'}
        </span>
        {checklist.length > 0 && (
          <span>{completedChecklistItems}/{checklist.length}</span>
        )}
        {task.due_date && (
          <span>{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
        )}
      </div>
      <div className="kanban-card-actions">
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label="Modifier" title="Modifier">
          <Edit size={14} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Supprimer" title="Supprimer">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function Column({ status, tasks, onDrop, onEditTask, onDeleteTask }) {
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item) => {
      if (item.status !== status.id) onDrop(item.id);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop}
      className={`kanban-column kanban-column-${status.id} ${isOver ? 'is-over' : ''}`}
    >
      <div className="kanban-column-header">
        <span>{status.label}</span>
        <span className="kanban-count">{tasks.length}</span>
      </div>
      <div className="kanban-column-body">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task)} onDelete={() => onDeleteTask(task.id)} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasksApi, tasks, onTaskUpdate, onEditTask }) {
  const handleDrop = async (taskId, newStatus) => {
    if (!tasksApi) return;
    try {
      await tasksApi.updateTaskStatus(taskId, newStatus);
      toast.success('Tâche déplacée');
      onTaskUpdate();
    } catch (error) {
      toast.error('Erreur lors du déplacement');
    }
  };

  const handleDelete = async (taskId) => {
    if (!globalThis.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    if (!tasksApi) return;
    try {
      await tasksApi.deleteTask(taskId);
      toast.success('Tâche supprimée');
      onTaskUpdate();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    pending: tasks.filter((t) => t.status === 'pending'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="kanban-board">
      {statuses.map((status) => (
        <Column
          key={status.id}
          status={status}
          tasks={tasksByStatus[status.id] || []}
          onDrop={(taskId) => handleDrop(taskId, status.id)}
          onEditTask={onEditTask}
          onDeleteTask={handleDelete}
        />
      ))}
    </div>
  );
}
