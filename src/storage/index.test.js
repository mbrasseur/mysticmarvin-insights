import { describe, it, expect, beforeEach } from 'vitest';

// Minimal localStorage mock
const store = {};
global.localStorage = {
  getItem: k => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: k => { delete store[k]; },
};

import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  saveProjectData,
  loadProjectData,
} from './index.js';

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
});

describe('listProjects', () => {
  it('returns empty array when no projects', () => {
    expect(listProjects()).toEqual([]);
  });
  it('returns stored projects', () => {
    store['mm_projects'] = JSON.stringify([{ id: '1', name: 'Test', createdAt: 0, files: [] }]);
    expect(listProjects()).toHaveLength(1);
  });
});

describe('createProject', () => {
  it('adds a project and returns it', () => {
    const p = createProject('My Project');
    expect(p.name).toBe('My Project');
    expect(p.id).toBeTruthy();
    expect(listProjects()).toHaveLength(1);
  });
});

describe('updateProject', () => {
  it('updates project fields', () => {
    const p = createProject('Original');
    updateProject(p.id, { name: 'Updated' });
    expect(listProjects().find(x => x.id === p.id).name).toBe('Updated');
  });
  it('throws for unknown id', () => {
    expect(() => updateProject('nonexistent', { name: 'X' })).toThrow('Project not found');
  });
});

describe('deleteProject', () => {
  it('removes project and its data', () => {
    const p = createProject('To Delete');
    saveProjectData(p.id, { vcenters: [] });
    deleteProject(p.id);
    expect(listProjects()).toHaveLength(0);
    expect(loadProjectData(p.id)).toBeNull();
  });
});

describe('saveProjectData / loadProjectData', () => {
  it('round-trips data', () => {
    const p = createProject('VC Test');
    const data = { vcenters: [{ vcenter_name: 'vc01' }], fleet: { total_vms: 42 } };
    saveProjectData(p.id, data);
    const loaded = loadProjectData(p.id);
    expect(loaded.vcenters[0].vcenter_name).toBe('vc01');
    expect(loaded.fleet.total_vms).toBe(42);
  });
  it('returns null for unknown project', () => {
    expect(loadProjectData('nonexistent')).toBeNull();
  });
});
