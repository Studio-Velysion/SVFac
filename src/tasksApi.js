// API Taches: Electron (SQLite) si disponible, sinon store (localStorage). Format snake_case pour l'UI.

function toProjectRow(p) {
  return {
    id: p.id,
    name: p.name || '',
    description: p.description ?? null,
    status: p.status || 'draft',
    priority: p.priority || 'normal',
    start_date: p.start_date ?? p.startDate ?? null,
    due_date: p.due_date ?? p.dueDate ?? null,
    tags: p.tags ?? null,
    client_id: p.client_id ?? p.clientId ?? null,
  };
}

function toTaskRow(t) {
  return {
    id: t.id,
    project_id: t.project_id ?? t.projectId,
    title: t.title || '',
    description: t.description ?? null,
    status: t.status || 'todo',
    priority: t.priority || 'normal',
    due_date: t.due_date ?? t.dueDate ?? null,
    checklist: t.checklist ?? null,
  };
}

function toProjectPayload(data) {
  return {
    name: data.name,
    description: data.description ?? '',
    startDate: data.startDate ?? data.start_date ?? '',
    dueDate: data.dueDate ?? data.due_date ?? '',
    status: data.status || 'draft',
    priority: data.priority || 'normal',
    tags: data.tags ?? [],
    clientId: (data.clientId !== undefined && data.clientId !== '' && data.clientId != null) ? data.clientId : null,
  };
}

function toTaskPayload(data) {
  return {
    title: data.title,
    description: data.description ?? '',
    status: data.status || 'todo',
    priority: data.priority || 'normal',
    dueDate: data.dueDate ?? data.due_date ?? '',
    checklist: data.checklist ?? [],
  };
}

export function createTasksApi(store) {
  const api = typeof window !== 'undefined' && window.electronAPI;
  const state = () => store.state;
  let useElectronTasks = null; // null = pas encore testé, true = utiliser IPC, false = utiliser store uniquement
  async function probeElectron() {
    if (useElectronTasks !== null) return useElectronTasks;
    if (!api || typeof api.getProjects !== 'function') {
      useElectronTasks = false;
      return false;
    }
    try {
      await api.getProjects();
      useElectronTasks = true;
      return true;
    } catch (_) {
      useElectronTasks = false;
      return false;
    }
  }
  const projects = () => (state().managementProjects || []).map((p) => toProjectRow({ ...p, id: Number(p.id) }));
  const tasks = (projectId) => {
    const list = (state().managementTasks || []).filter(
      (t) => String(t.project_id ?? t.projectId) === String(projectId)
    );
    return list.map((t) => toTaskRow({ ...t, id: Number(t.id) }));
  };
  const allTasks = () => (state().managementTasks || []).map((t) => toTaskRow({ ...t, id: Number(t.id) }));

  return {
    getClients() {
      return state().clients || [];
    },
    async getProjects() {
      const useElectron = await probeElectron();
      if (!useElectron) return projects();
      try {
        return await api.getProjects();
      } catch (_) {
        return projects();
      }
    },

    async getProject(id) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        const p = (state().managementProjects || []).find((x) => Number(x.id) === Number(id));
        return p ? toProjectRow(p) : null;
      }
      try {
        return await api.getProject(Number(id));
      } catch (_) {
        const p = (state().managementProjects || []).find((x) => Number(x.id) === Number(id));
        return p ? toProjectRow(p) : null;
      }
    },

    async createProject(data) {
      const payload = toProjectPayload(data);
      const useElectron = await probeElectron();
      if (!useElectron) {
        const id = store.addManagementProject({
          ...payload,
          startDate: payload.startDate || null,
          dueDate: payload.dueDate || null,
          tags: Array.isArray(payload.tags) ? payload.tags : [],
        });
        return toProjectRow({ id, ...payload, start_date: payload.startDate, due_date: payload.dueDate });
      }
      try {
        const created = await api.createProject(payload);
        if (created && created.id) return created;
      } catch (_) {}
      const id = store.addManagementProject({
        ...payload,
        startDate: payload.startDate || null,
        dueDate: payload.dueDate || null,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
      });
      return toProjectRow({ id, ...payload, start_date: payload.startDate, due_date: payload.dueDate });
    },

    async updateProject(id, data) {
      const payload = toProjectPayload(data);
      const useElectron = await probeElectron();
      if (!useElectron) {
        store.updateManagementProject(Number(id), payload);
        return toProjectRow({ id, ...payload, start_date: payload.startDate, due_date: payload.dueDate });
      }
      try {
        const updated = await api.updateProject(Number(id), payload);
        if (updated) return updated;
      } catch (_) {}
      store.updateManagementProject(Number(id), payload);
      return toProjectRow({ id, ...payload, start_date: payload.startDate, due_date: payload.dueDate });
    },

    async deleteProject(id) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        store.deleteManagementProject(Number(id));
        return;
      }
      try {
        await api.deleteProject(Number(id));
        return;
      } catch (_) {}
      store.deleteManagementProject(Number(id));
    },

    async archiveProject(id) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        store.updateManagementProject(Number(id), { status: 'archived' });
        return;
      }
      try {
        await api.archiveProject(Number(id));
        return;
      } catch (_) {}
      store.updateManagementProject(Number(id), { status: 'archived' });
    },

    async duplicateProject(id) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        const p = (state().managementProjects || []).find((x) => Number(x.id) === Number(id));
        if (!p) return null;
        const payload = toProjectPayload({
          name: `${p.name || 'Projet'} (Copie)`,
          description: p.description,
          startDate: p.start_date ?? p.startDate,
          dueDate: p.due_date ?? p.dueDate,
          status: 'draft',
          priority: p.priority,
          tags: p.tags,
          clientId: p.client_id ?? p.clientId,
        });
        const newId = store.addManagementProject(payload);
        const projectTasks = (state().managementTasks || []).filter(
          (t) => Number(t.project_id || t.projectId) === Number(id)
        );
        projectTasks.forEach((t) => {
          store.addManagementTask({
            projectId: newId,
            title: t.title,
            description: t.description,
            status: 'todo',
            priority: t.priority,
            dueDate: t.due_date ?? t.dueDate,
            checklist: t.checklist,
          });
        });
        return toProjectRow({ id: newId, ...payload, start_date: payload.startDate, due_date: payload.dueDate });
      }
      try {
        return await api.duplicateProject(Number(id));
      } catch (_) {}
      const p = (state().managementProjects || []).find((x) => Number(x.id) === Number(id));
      if (!p) return null;
      const payload = toProjectPayload({
        name: `${p.name || 'Projet'} (Copie)`,
        description: p.description,
        startDate: p.start_date ?? p.startDate,
        dueDate: p.due_date ?? p.dueDate,
        status: 'draft',
        priority: p.priority,
        tags: p.tags,
        clientId: p.client_id ?? p.clientId,
      });
      const newId = store.addManagementProject(payload);
      const projectTasks = (state().managementTasks || []).filter(
        (t) => Number(t.project_id || t.projectId) === Number(id)
      );
      projectTasks.forEach((t) => {
        store.addManagementTask({
          projectId: newId,
          title: t.title,
          description: t.description,
          status: 'todo',
          priority: t.priority,
          dueDate: t.due_date ?? t.dueDate,
          checklist: t.checklist,
        });
      });
      return toProjectRow({ id: newId, ...payload, start_date: payload.startDate, due_date: payload.dueDate });
    },

    async getTasks(projectId) {
      const useElectron = await probeElectron();
      if (!useElectron) return projectId != null ? tasks(projectId) : allTasks();
      try {
        const list = projectId != null ? await api.getTasks(Number(projectId)) : await api.getTasks();
        return list || [];
      } catch (_) {
        return projectId != null ? tasks(projectId) : allTasks();
      }
    },

    async getTask(id) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        const t = (state().managementTasks || []).find((x) => Number(x.id) === Number(id));
        return t ? toTaskRow(t) : null;
      }
      try {
        return await api.getTask(Number(id));
      } catch (_) {
        const t = (state().managementTasks || []).find((x) => Number(x.id) === Number(id));
        return t ? toTaskRow(t) : null;
      }
    },

    async createTask(data) {
      const payload = { ...toTaskPayload(data), projectId: data.projectId };
      const useElectron = await probeElectron();
      if (!useElectron) {
        const id = store.addManagementTask(payload);
        return toTaskRow({ id, ...payload, project_id: payload.projectId, due_date: payload.dueDate });
      }
      try {
        const created = await api.createTask(payload);
        if (created && created.id) return created;
      } catch (_) {}
      const id = store.addManagementTask(payload);
      return toTaskRow({ id, ...payload, project_id: payload.projectId, due_date: payload.dueDate });
    },

    async updateTask(id, data) {
      const payload = toTaskPayload(data);
      const useElectron = await probeElectron();
      if (!useElectron) {
        store.updateManagementTask(Number(id), payload);
        return toTaskRow({ id, ...payload, due_date: payload.dueDate });
      }
      try {
        const updated = await api.updateTask(Number(id), payload);
        if (updated) return updated;
      } catch (_) {}
      store.updateManagementTask(Number(id), payload);
      return toTaskRow({ id, ...payload, due_date: payload.dueDate });
    },

    async updateTaskStatus(id, status) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        store.updateManagementTask(Number(id), { status });
        return;
      }
      try {
        await api.updateTaskStatus(Number(id), status);
        return;
      } catch (_) {}
      store.updateManagementTask(Number(id), { status });
    },

    async deleteTask(id) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        store.deleteManagementTask(Number(id));
        return;
      }
      try {
        await api.deleteTask(Number(id));
        return;
      } catch (_) {}
      store.deleteManagementTask(Number(id));
    },

    async getTaskStats(projectId) {
      const useElectron = await probeElectron();
      if (!useElectron) {
        const list = (state().managementTasks || []).filter(
          (t) => String(t.project_id ?? t.projectId) === String(projectId)
        );
        return {
          todo: list.filter((t) => t.status === 'todo').length,
          in_progress: list.filter((t) => t.status === 'in_progress').length,
          pending: list.filter((t) => t.status === 'pending').length,
          done: list.filter((t) => t.status === 'done').length,
          total: list.length,
        };
      }
      try {
        return await api.getTaskStats(Number(projectId));
      } catch (_) {}
      const list = (state().managementTasks || []).filter(
        (t) => String(t.project_id ?? t.projectId) === String(projectId)
      );
      return {
        todo: list.filter((t) => t.status === 'todo').length,
        in_progress: list.filter((t) => t.status === 'in_progress').length,
        pending: list.filter((t) => t.status === 'pending').length,
        done: list.filter((t) => t.status === 'done').length,
        total: list.length,
      };
    },

    // Notes et mises à jour : uniquement en Electron pour l’instant, sinon no-op / valeurs vides
    async getNotes(projectId) {
      if (api && typeof api.getNotes === 'function') {
        try {
          return await api.getNotes(Number(projectId));
        } catch (_) {}
      }
      return { project_id: projectId, content: '' };
    },

    async updateNotes(projectId, content) {
      if (api && typeof api.updateNotes === 'function') {
        try {
          return await api.updateNotes(Number(projectId), content);
        } catch (_) {}
      }
    },

    async getProjectUpdates(projectId) {
      if (api && typeof api.getProjectUpdates === 'function') {
        try {
          return await api.getProjectUpdates(Number(projectId));
        } catch (_) {}
      }
      return [];
    },

    async createProjectUpdate(update) {
      if (api && typeof api.createProjectUpdate === 'function') {
        try {
          return await api.createProjectUpdate(update);
        } catch (_) {}
      }
      return null;
    },

    async updateProjectUpdate(id, update) {
      if (api && typeof api.updateProjectUpdate === 'function') {
        try {
          return await api.updateProjectUpdate(Number(id), update);
        } catch (_) {}
      }
    },

    async deleteProjectUpdate(id) {
      if (api && typeof api.deleteProjectUpdate === 'function') {
        try {
          await api.deleteProjectUpdate(Number(id));
        } catch (_) {}
      }
    },
  };
}
