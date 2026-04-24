import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, FolderOpen, AlertTriangle, X, Plus, ChevronRight } from 'lucide-react';
import { listProjects, createProject, deleteProject } from '../storage/index.js';

export default function Home() {
  const [projects, setProjects] = useState(() => listProjects());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = createProject(newName.trim());
    setProjects(listProjects());
    setNewName('');
    setShowCreate(false);
    navigate(`/projects/${p.id}`);
  }

  function handleDelete(id) {
    deleteProject(id);
    setConfirmDeleteId(null);
    setProjects(listProjects());
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Projets
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Chaque projet contient un ou plusieurs exports vSphere (VHST ou RVTools).
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
            color: 'var(--bg-deep)', border: 'none',
            fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
            transition: 'filter 0.12s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = ''}
        >
          <Plus size={13} /> Nouveau
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{
          display: 'flex', gap: 8, marginBottom: 16,
          padding: '12px 14px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <input
            ref={inputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nom du projet…"
            aria-label="Nom du nouveau projet"
            style={{
              flex: 1, padding: '7px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(0,196,180,0.3)',
              background: 'var(--bg-base)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
            }}
          />
          <button type="submit" style={{
            padding: '7px 16px', borderRadius: 'var(--radius)',
            background: 'var(--teal)', color: 'var(--bg-deep)',
            border: 'none', fontSize: 'var(--text-sm)', fontWeight: 700,
          }}>
            Créer
          </button>
          <button type="button" onClick={() => { setShowCreate(false); setNewName(''); }}
            aria-label="Annuler la création"
            style={{ padding: '7px 10px', borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          Aucun projet. Crée-en un ci-dessus.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id}>
              <div
                className="project-card"
                onClick={() => confirmDeleteId !== p.id && navigate(`/projects/${p.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: confirmDeleteId === p.id ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${confirmDeleteId === p.id ? 'rgba(239,68,68,0.3)' : 'rgba(0,196,180,0.25)'}`,
                  borderBottom: confirmDeleteId === p.id ? 'none' : undefined,
                  cursor: confirmDeleteId === p.id ? 'default' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(0,196,180,0.2), rgba(0,150,136,0.1))',
                    border: '1px solid rgba(0,196,180,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FolderOpen size={15} color="var(--teal)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                      <span style={{ color: 'var(--teal)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        {p.files?.length || 0} fichier(s)
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>·</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                        {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ChevronRight size={13} color="var(--text-muted)" />
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === p.id ? null : p.id); }}
                    aria-label={`Supprimer le projet ${p.name}`}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 4, transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--status-danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {confirmDeleteId === p.id && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderTop: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: '#fca5a5' }}>
                    <AlertTriangle size={13} /> Supprimer "{p.name}" ? Irréversible.
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDelete(p.id)}
                      aria-label={`Confirmer la suppression de ${p.name}`}
                      style={{ padding: '4px 12px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--status-danger)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 600 }}
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      aria-label="Annuler la suppression"
                      style={{ padding: '4px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
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
