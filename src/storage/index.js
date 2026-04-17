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
  const projects = listProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Project not found: ${id}`);
  projects[idx] = { ...projects[idx], ...patch };
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function deleteProject(id) {
  const projects = listProjects().filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  localStorage.removeItem(dataKey(id));
}

export function saveProjectData(projectId, combinedData) {
  try {
    localStorage.setItem(dataKey(projectId), JSON.stringify(combinedData));
  } catch (e) {
    throw new Error(`Failed to save project data (storage quota exceeded?): ${e.message}`);
  }
}

export function loadProjectData(projectId) {
  try {
    const raw = localStorage.getItem(dataKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
