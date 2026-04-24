import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, FolderOpen, AlertTriangle, X } from 'lucide-react';
import { listProjects, createProject, deleteProject } from '../storage/index.js';

export default function Home() {
  const [projects, setProjects] = useState(() => listProjects());
  const [newName, setNewName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();

  function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = createProject(newName.trim());
    setProjects(listProjects());
    setNewName('');
    navigate(`/projects/${p.id}`);
  }

  function handleDelete(id) {
    deleteProject(id);
    setConfirmDeleteId(null);
    setProjects(listProjects());
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
        Projects
      </h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 32, fontSize: 13 }}>
        Each project holds one or more vSphere exports (VHST or RVTools).
      </p>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New project name…"
          aria-label="New project name"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 'var(--radius)',
            border: '1px solid var(--gray-200)', fontSize: 13,
          }}
        />
        <button
          type="submit"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 'var(--radius)',
            background: 'var(--accent)', color: '#fff',
            border: 'none', fontSize: 13, fontWeight: 600,
          }}
        >
          <PlusCircle size={14} /> Create
        </button>
      </form>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-400)' }}>
          No projects yet. Create one above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id}>
              <div
                onClick={() => confirmDeleteId !== p.id && navigate(`/projects/${p.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: confirmDeleteId === p.id ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
                  background: '#fff', border: '1px solid var(--gray-200)',
                  borderBottom: confirmDeleteId === p.id ? 'none' : '1px solid var(--gray-200)',
                  cursor: confirmDeleteId === p.id ? 'default' : 'pointer',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FolderOpen size={16} color="var(--accent)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                      {p.files?.length || 0} file(s) · Created {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === p.id ? null : p.id); }}
                  aria-label={`Delete project ${p.name}`}
                  style={{ background: 'none', border: 'none', color: 'var(--gray-400)', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {confirmDeleteId === p.id && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', background: '#fff5f5',
                  border: '1px solid var(--gray-200)', borderTop: '1px solid #fee2e2',
                  borderRadius: '0 0 var(--radius) var(--radius)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#991b1b' }}>
                    <AlertTriangle size={13} /> Delete "{p.name}"? This cannot be undone.
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDelete(p.id)}
                      aria-label={`Confirm delete project ${p.name}`}
                      style={{
                        padding: '4px 12px', borderRadius: 'var(--radius)', border: 'none',
                        background: 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      aria-label="Cancel delete"
                      style={{
                        padding: '4px 12px', borderRadius: 'var(--radius)',
                        border: '1px solid var(--gray-200)', background: '#fff',
                        fontSize: 12, color: 'var(--gray-600)',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
