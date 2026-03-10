const { ipcMain } = require('electron');

function setupIpcTasksHandlers(db) {
  ipcMain.handle('get-projects', () => db.getProjects());
  ipcMain.handle('get-project', (_, id) => db.getProject(id));
  ipcMain.handle('create-project', (_, project) => {
    const created = db.createProject(project);
    if (created) {
      db.logActivity({ action: 'create', entityType: 'project', entityId: created.id, details: { name: project.name } });
    }
    return created;
  });
  ipcMain.handle('update-project', (_, id, project) => {
    const updated = db.updateProject(id, project);
    db.logActivity({ action: 'update', entityType: 'project', entityId: id, details: { name: project.name } });
    return updated;
  });
  ipcMain.handle('delete-project', (_, id) => {
    db.deleteProject(id);
    db.logActivity({ action: 'delete', entityType: 'project', entityId: id });
    return { success: true };
  });
  ipcMain.handle('archive-project', (_, id) => {
    db.archiveProject(id);
    db.logActivity({ action: 'archive', entityType: 'project', entityId: id });
    return { success: true };
  });
  ipcMain.handle('unarchive-project', (_, id) => {
    db.unarchiveProject(id);
    db.logActivity({ action: 'unarchive', entityType: 'project', entityId: id });
    return { success: true };
  });
  ipcMain.handle('duplicate-project', (_, id) => {
    const duplicated = db.duplicateProject(id);
    if (duplicated && duplicated.id) {
      db.logActivity({ action: 'duplicate', entityType: 'project', entityId: duplicated.id, details: { originalId: id } });
    }
    return duplicated;
  });

  ipcMain.handle('get-tasks', (_, projectId) => db.getTasks(projectId));
  ipcMain.handle('get-task', (_, id) => db.getTask(id));
  ipcMain.handle('create-task', (_, task) => {
    const created = db.createTask(task);
    if (created) {
      db.logActivity({ action: 'create', entityType: 'task', entityId: created.id, details: { title: task.title, projectId: task.projectId } });
    }
    return created;
  });
  ipcMain.handle('update-task', (_, id, task) => {
    const updated = db.updateTask(id, task);
    db.logActivity({ action: 'update', entityType: 'task', entityId: id, details: { title: task.title } });
    return updated;
  });
  ipcMain.handle('update-task-status', (_, id, status) => {
    db.updateTaskStatus(id, status);
    db.logActivity({ action: 'update', entityType: 'task', entityId: id, details: { status } });
    return { success: true };
  });
  ipcMain.handle('delete-task', (_, id) => {
    db.deleteTask(id);
    db.logActivity({ action: 'delete', entityType: 'task', entityId: id });
    return { success: true };
  });
  ipcMain.handle('get-task-stats', (_, projectId) => db.getTaskStatsByProject(projectId));

  ipcMain.handle('get-notes', (_, projectId) => db.getNotes(projectId));
  ipcMain.handle('update-notes', (_, projectId, content) => db.updateNotes(projectId, content));

  ipcMain.handle('get-project-updates', (_, projectId) => db.getProjectUpdates(projectId));
  ipcMain.handle('create-project-update', (_, update) => {
    const created = db.createProjectUpdate(update);
    if (created) {
      db.logActivity({ action: 'create', entityType: 'project_update', entityId: created.id, details: { projectId: update.projectId, title: update.title } });
    }
    return created;
  });
  ipcMain.handle('update-project-update', (_, id, update) => {
    const updated = db.updateProjectUpdate(id, update);
    db.logActivity({ action: 'update', entityType: 'project_update', entityId: id, details: { title: update.title } });
    return updated;
  });
  ipcMain.handle('delete-project-update', (_, id) => {
    db.deleteProjectUpdate(id);
    db.logActivity({ action: 'delete', entityType: 'project_update', entityId: id });
    return { success: true };
  });

  ipcMain.handle('get-activity-log', (_, limit) => db.getActivityLog(limit));
  ipcMain.handle('log-activity', (_, activity) => {
    db.logActivity(activity);
    return { success: true };
  });
}

module.exports = { setupIpcTasksHandlers };
