import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createTasksApi } from '../tasksApi';
import TasksDashboard from './management/TasksDashboard';
import TasksProjects from './management/TasksProjects';
import TasksProjectDetail from './management/TasksProjectDetail';
import TasksAllTasks from './management/TasksAllTasks';

/**
 * Section Tâches — code intégré du Studio Velysion Project Manager.
 * Utilise Electron (SQLite) si disponible, sinon le store (localStorage).
 */
export default function Management({ store }) {
  const tasksApi = useMemo(() => (store ? createTasksApi(store) : null), [store]);
  if (!tasksApi) return <div className="empty-state">Chargement...</div>;
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="tasks-section">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TasksDashboard tasksApi={tasksApi} />} />
          <Route path="projects" element={<TasksProjects tasksApi={tasksApi} />} />
          <Route path="projects/:id" element={<TasksProjectDetail tasksApi={tasksApi} />} />
          <Route path="tasks" element={<TasksAllTasks tasksApi={tasksApi} />} />
        </Routes>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="toast-app"
      />
    </DndProvider>
  );
}
