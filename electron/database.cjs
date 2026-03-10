const DatabaseLib = require('better-sqlite3');
const path = require('path');

class AppDatabase {
  constructor(userDataPath) {
    const dbPath = path.join(userDataPath, 'velysion-tasks.db');
    this.db = new DatabaseLib(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        client_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        due_date DATE,
        status TEXT DEFAULT 'draft',
        priority TEXT DEFAULT 'normal',
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    try {
      this.db.exec('ALTER TABLE projects ADD COLUMN client_id INTEGER');
    } catch (_) {}

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'normal',
        due_date DATE,
        checklist TEXT,
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL UNIQUE,
        content TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    const userExists = this.db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userExists.count === 0) {
      this.db.prepare('INSERT INTO users (id, name) VALUES (1, ?)').run('Utilisateur Principal');
    }
  }

  getProjects() {
    return this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  }

  getProject(id) {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  createProject(project) {
    const stmt = this.db.prepare(`
      INSERT INTO projects (user_id, client_id, name, description, start_date, due_date, status, priority, tags)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const clientId = project.clientId != null && project.clientId !== '' ? Number(project.clientId) : null;
    const result = stmt.run(
      clientId,
      project.name,
      project.description || null,
      project.startDate || null,
      project.dueDate || null,
      project.status || 'draft',
      project.priority || 'normal',
      project.tags ? JSON.stringify(project.tags) : null
    );
    const created = this.getProject(result.lastInsertRowid);
    if (created) {
      this.createProjectUpdate({
        projectId: created.id,
        title: 'Projet créé',
        content: `Le projet "${project.name}" a été créé${project.description ? ` avec la description : ${project.description}` : ''}.`,
      });
    }
    return created;
  }

  updateProject(id, project) {
    const oldProject = this.getProject(id);
    const clientId = project.clientId != null && project.clientId !== '' ? Number(project.clientId) : null;
    const stmt = this.db.prepare(`
      UPDATE projects
      SET client_id = ?, name = ?, description = ?, start_date = ?, due_date = ?,
          status = ?, priority = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      clientId,
      project.name,
      project.description || null,
      project.startDate || null,
      project.dueDate || null,
      project.status || 'draft',
      project.priority || 'normal',
      project.tags ? JSON.stringify(project.tags) : null,
      id
    );
    const updated = this.getProject(id);
    if (oldProject && updated) {
      const changes = [];
      if (oldProject.name !== updated.name) changes.push(`Nom : "${oldProject.name}" → "${updated.name}"`);
      if (oldProject.status !== updated.status) changes.push(`Statut : "${oldProject.status}" → "${updated.status}"`);
      if (oldProject.priority !== updated.priority) changes.push(`Priorité : "${oldProject.priority}" → "${updated.priority}"`);
      if (oldProject.due_date !== updated.due_date) changes.push('Date limite modifiée');
      if (changes.length > 0) {
        this.createProjectUpdate({
          projectId: id,
          title: 'Projet modifié',
          content: `Modifications apportées :\n${changes.join('\n')}`,
        });
      }
    }
    return updated;
  }

  deleteProject(id) {
    return this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  archiveProject(id) {
    return this.db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('archived', id);
  }

  unarchiveProject(id) {
    return this.db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('active', id);
  }

  duplicateProject(id) {
    const project = this.getProject(id);
    if (!project) return null;
    const newProject = {
      name: `${project.name} (Copie)`,
      description: project.description,
      startDate: project.start_date,
      dueDate: project.due_date,
      status: 'draft',
      priority: project.priority,
      tags: project.tags ? JSON.parse(project.tags) : null,
    };
    const created = this.createProject(newProject);
    if (!created) return null;
    const tasks = this.getTasks(id);
    tasks.forEach((task) => {
      this.createTask({
        projectId: created.id,
        title: task.title,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        dueDate: task.due_date,
        checklist: task.checklist,
      });
    });
    return created;
  }

  getTasks(projectId) {
    if (projectId) {
      return this.db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC, created_at DESC').all(projectId);
    }
    return this.db.prepare('SELECT * FROM tasks ORDER BY position ASC, created_at DESC').all();
  }

  getTask(id) {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  }

  createTask(task) {
    const maxPosition = this.db.prepare('SELECT MAX(position) as max FROM tasks WHERE project_id = ?').get(task.projectId);
    const position = ((maxPosition && maxPosition.max != null) ? maxPosition.max : -1) + 1;
    const stmt = this.db.prepare(`
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, checklist, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      task.projectId,
      task.title,
      task.description || null,
      task.status || 'todo',
      task.priority || 'normal',
      task.dueDate || null,
      task.checklist ? JSON.stringify(task.checklist) : null,
      position
    );
    return this.getTask(result.lastInsertRowid);
  }

  updateTask(id, task) {
    const stmt = this.db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?,
          due_date = ?, checklist = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      task.title,
      task.description || null,
      task.status || 'todo',
      task.priority || 'normal',
      task.dueDate || null,
      task.checklist ? JSON.stringify(task.checklist) : null,
      id
    );
    return this.getTask(id);
  }

  updateTaskStatus(id, status) {
    return this.db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  }

  deleteTask(id) {
    return this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  getTaskStatsByProject(projectId) {
    const stats = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM tasks WHERE project_id = ?
      GROUP BY status
    `).all(projectId);
    const result = { todo: 0, in_progress: 0, pending: 0, done: 0, total: 0 };
    stats.forEach((stat) => {
      if (stat.status in result) result[stat.status] = stat.count;
      result.total += stat.count;
    });
    return result;
  }

  getNotes(projectId) {
    const row = this.db.prepare('SELECT * FROM notes WHERE project_id = ?').get(projectId);
    return row || { project_id: projectId, content: '' };
  }

  updateNotes(projectId, content) {
    const exists = this.db.prepare('SELECT COUNT(*) as count FROM notes WHERE project_id = ?').get(projectId);
    if (exists.count > 0) {
      this.db.prepare('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE project_id = ?').run(content, projectId);
    } else {
      this.db.prepare('INSERT INTO notes (project_id, content) VALUES (?, ?)').run(projectId, content);
    }
    return this.getNotes(projectId);
  }

  getProjectUpdates(projectId) {
    return this.db.prepare('SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
  }

  getProjectUpdate(id) {
    return this.db.prepare('SELECT * FROM project_updates WHERE id = ?').get(id);
  }

  createProjectUpdate(update) {
    const stmt = this.db.prepare('INSERT INTO project_updates (project_id, title, content) VALUES (?, ?, ?)');
    const result = stmt.run(update.projectId, update.title, update.content);
    return this.getProjectUpdate(result.lastInsertRowid);
  }

  updateProjectUpdate(id, update) {
    this.db.prepare('UPDATE project_updates SET title = ?, content = ? WHERE id = ?').run(update.title, update.content, id);
    return this.getProjectUpdate(id);
  }

  deleteProjectUpdate(id) {
    return this.db.prepare('DELETE FROM project_updates WHERE id = ?').run(id);
  }

  getActivityLog(limit = 100) {
    return this.db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?').all(limit);
  }

  logActivity(activity) {
    const stmt = this.db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
      VALUES (1, ?, ?, ?, ?)
    `);
    stmt.run(
      activity.action,
      activity.entityType,
      activity.entityId || null,
      activity.details ? JSON.stringify(activity.details) : null
    );
  }

  close() {
    this.db.close();
  }
}

module.exports = { AppDatabase };
