const PROJECTS_KEY = 'mm_projects';

function dataKey(projectId) {
  return `mm_data_${projectId}`;
}

export function listProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function createProject(name) {
  const project = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    files: [],
  };
  const projects = listProjects();
  projects.push(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return project;
}

export function updateProject(id, patch) {
  const projects = listProjects().map(p => p.id === id ? { ...p, ...patch } : p);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function deleteProject(id) {
  const projects = listProjects().filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  localStorage.removeItem(dataKey(id));
}

export function saveProjectData(projectId, combinedData) {
  localStorage.setItem(dataKey(projectId), JSON.stringify(combinedData));
}

export function loadProjectData(projectId) {
  try {
    const raw = localStorage.getItem(dataKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
