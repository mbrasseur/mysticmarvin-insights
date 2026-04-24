# MysticMarvin Insights — Dark Teal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the full UI to a dark teal theme with sidebar navigation, enriched project cards, and polished micro-interactions — without touching any data/parser logic.

**Architecture:** Replace all inline light-mode styles with CSS tokens defined in `theme.css`. Add a new `Sidebar` component inside `Layout.jsx`. Move scope selection from `ScopeBar` into the topbar. All report tabs adopt shared `.card`, `.data-table`, `.badge-*` CSS classes instead of ad-hoc inline styles.

**Tech Stack:** React + Vite, vanilla CSS custom properties, Lucide icons, Chart.js

---

## File Map

| File | Change |
|------|--------|
| `src/theme.css` | Full rewrite — dark tokens + dark component classes |
| `src/components/Layout.jsx` | Topbar redesign + new `Sidebar` component |
| `src/pages/Home.jsx` | Dark cards + hover + inline create |
| `src/pages/Project.jsx` | Dark drop zone + spinner parsing |
| `src/pages/Report.jsx` | Remove `ScopeBar`, scope dropdown in topbar, Fleet Banner update |
| `src/components/report/StatusBadge.jsx` | Dark badge colors |
| `src/components/report/charts.jsx` | Dark palette tokens |
| `src/pages/report/OverviewTab.jsx` | Adopt CSS classes, fix `eosColor` tokens |
| `src/pages/report/InfrastructureTab.jsx` | Adopt CSS classes |
| `src/pages/report/VirtualMachinesTab.jsx` | Adopt CSS classes |
| `src/pages/report/LifecycleTab.jsx` | Adopt CSS classes |
| `src/pages/report/NextStepsTab.jsx` | Adopt CSS classes, fix hardcoded hex |
| `src/pages/report/VCenterTab.jsx` | Adopt CSS classes |

---

## Task 1 — Dark design tokens in theme.css

**Files:**
- Modify: `src/theme.css`

- [ ] **Step 1: Rewrite `:root` with dark teal tokens**

Replace the entire contents of `src/theme.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  /* ── Backgrounds (teal-tinted dark) ─── */
  --bg-deep:     #060e0d;
  --bg-base:     #0a1a18;
  --bg-surface:  #0f2422;
  --bg-elevated: #17332f;
  --bg-hover:    #1e403b;

  /* ── Accent — MysticMarvin teal ─────── */
  --teal:        #00c4b4;
  --teal-light:  #33d1c3;
  --teal-dim:    #009688;
  --teal-900:    #003d38;
  --teal-100:    #80e8e0;

  /* ── Text ───────────────────────────── */
  --text-primary:   #ffffff;
  --text-secondary: rgba(255,255,255,0.55);
  --text-muted:     rgba(255,255,255,0.30);

  /* ── Borders ────────────────────────── */
  --border:        rgba(0,196,180,0.20);
  --border-subtle: rgba(255,255,255,0.07);

  /* ── Status ─────────────────────────── */
  --status-ok:     #22c55e;
  --status-warn:   #f59e0b;
  --status-danger: #ef4444;
  --status-info:   #38bdf8;
  --warn:          #ef4444;

  /* ── Legacy aliases (used in report tabs) ── */
  --green:  #22c55e;
  --yellow: #f59e0b;
  --orange: #f97316;
  --danger: #ef4444;
  --navy:   #0a1a18;
  --gray-50:  #0f2422;
  --gray-100: #17332f;
  --gray-200: rgba(255,255,255,0.10);
  --gray-300: rgba(255,255,255,0.15);
  --gray-400: rgba(255,255,255,0.30);
  --gray-500: rgba(255,255,255,0.45);
  --gray-600: rgba(255,255,255,0.60);
  --gray-700: rgba(255,255,255,0.80);
  --white:    #ffffff;

  /* ── Type scale ─────────────────────── */
  --text-xs:   10px;
  --text-sm:   12px;
  --text-base: 13px;
  --text-md:   16px;
  --text-lg:   20px;
  --text-xl:   24px;

  /* ── Misc ───────────────────────────── */
  --mono:      'JetBrains Mono', monospace;
  --font:      'Inter', system-ui, sans-serif;
  --radius:    8px;
  --radius-lg: 12px;
  --shadow:    0 1px 4px rgba(0,0,0,0.30), 0 4px 16px rgba(0,0,0,0.20);
  --shadow-lg: 0 4px 24px rgba(0,0,0,0.40);
  --topbar-bg:     var(--bg-deep);
  --topbar-border: var(--teal);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  background: var(--bg-base);
  color: var(--text-primary);
  font-size: var(--text-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: var(--font); }
input, select, textarea { font-family: var(--font); }

:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 2px;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-surface); }
::-webkit-scrollbar-thumb { background: rgba(0,196,180,0.3); border-radius: 3px; }

/* ── Card ────────────────────────────── */
.card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: 16px;
}

/* ── Badge ───────────────────────────── */
.badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 999px;
  font-size: var(--text-sm); font-weight: 600;
  gap: 4px;
}
.badge-green  { background: rgba(34,197,94,0.12);  color: #22c55e; border: 1px solid rgba(34,197,94,0.25); }
.badge-yellow { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.badge-orange { background: rgba(249,115,22,0.12); color: #f97316; border: 1px solid rgba(249,115,22,0.25); }
.badge-red    { background: rgba(239,68,68,0.12);  color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
.badge-teal   { background: rgba(0,196,180,0.12);  color: var(--teal); border: 1px solid rgba(0,196,180,0.25); }
.badge-gray   { background: rgba(255,255,255,0.06); color: var(--text-secondary); border: 1px solid var(--border-subtle); }
.badge-navy   { background: rgba(0,196,180,0.08);  color: var(--text-secondary); }

/* ── Table ───────────────────────────── */
.data-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.data-table th {
  text-align: left; padding: 8px 10px;
  background: var(--bg-base); color: var(--text-muted);
  font-weight: 600; font-size: var(--text-xs);
  text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.data-table td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
  color: var(--text-secondary);
}
.data-table td:first-child { color: var(--text-primary); }
.data-table tr:hover td { background: var(--bg-hover); transition: background 0.1s; }
.data-table tr.status-red td    { background: rgba(239,68,68,0.06); }
.data-table tr.status-yellow td { background: rgba(245,158,11,0.06); }

/* ── Mini bar ────────────────────────── */
.mini-bar      { height: 5px; border-radius: 3px; background: rgba(255,255,255,0.08); overflow: hidden; min-width: 60px; }
.mini-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }

/* ── Stat pill ───────────────────────── */
.stat-pill {
  display: flex; flex-direction: column; align-items: center;
  background: var(--bg-surface); border-radius: var(--radius);
  padding: 10px 16px; min-width: 80px; gap: 2px;
  border: 1px solid var(--border-subtle);
}
.stat-pill .value { font-size: 18px; font-weight: 700; color: var(--teal); font-family: var(--mono); }
.stat-pill .label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

/* ── Section header ──────────────────── */
.section-header {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--text-base); font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px; padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,196,180,0.15);
}
.section-header .accent { color: var(--teal); }

/* ── Alert banner ────────────────────── */
.alert {
  padding: 10px 14px; border-radius: var(--radius);
  display: flex; align-items: flex-start; gap: 8px;
  font-size: var(--text-sm); font-weight: 600; margin-bottom: 12px;
}
.alert-red    { background: rgba(239,68,68,0.10); color: #fca5a5; border-left: 3px solid var(--status-danger); }
.alert-yellow { background: rgba(245,158,11,0.10); color: #fcd34d; border-left: 3px solid var(--status-warn); }
.alert-blue   { background: rgba(56,189,248,0.10); color: #7dd3fc; border-left: 3px solid var(--status-info); }

/* ── Micro-interaction: card hover ───── */
.project-card {
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.project-card:hover {
  transform: translateY(-1px);
  border-color: rgba(0,196,180,0.5) !important;
}

/* ── Sidebar nav icon hover ──────────── */
.sidebar-icon {
  transition: opacity 0.12s ease, background 0.12s ease;
}
.sidebar-icon:hover {
  opacity: 0.7 !important;
  background: var(--bg-elevated) !important;
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm run build 2>&1 | tail -5
```
Expected: `✓ built in`

- [ ] **Step 3: Commit**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
git add src/theme.css
git commit -m "feat(theme): dark teal design tokens and component classes"
```

---

## Task 2 — Layout: topbar + Sidebar component

**Files:**
- Modify: `src/components/Layout.jsx`

- [ ] **Step 1: Read the current file**

```bash
cat /Users/bmiguel/Code/mysticmarvin-insights/src/components/Layout.jsx
```

- [ ] **Step 2: Rewrite Layout.jsx**

Replace the entire file with:

```jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight, BarChart2, Layers, Monitor, Clock, Lightbulb } from 'lucide-react';
import { useState } from 'react';

export function AppShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <TopBar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

function TopBar() {
  return (
    <header style={{
      background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'var(--bg-deep)', fontSize: 12, fontWeight: 900 }}>M</span>
        </div>
        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>
          MysticMarvin
        </span>
        <span style={{ color: 'rgba(0,196,180,0.5)', fontSize: 11, fontWeight: 400 }}>
          Insights
        </span>
      </Link>
    </header>
  );
}

export function Breadcrumb({ items }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 24px', color: 'var(--text-muted)', fontSize: 11,
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-deep)',
    }}>
      <Link to="/" aria-label="Home"><Home size={11} /></Link>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronRight size={9} />
          {item.to
            ? <Link to={item.to} style={{ color: 'var(--text-muted)' }}>{item.label}</Link>
            : <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
          }
        </span>
      ))}
    </div>
  );
}

const SIDEBAR_TABS = [
  { id: 'overview',       icon: BarChart2,  label: 'Overview' },
  { id: 'infrastructure', icon: Layers,     label: 'Infrastructure' },
  { id: 'vms',            icon: Monitor,    label: 'Virtual Machines' },
  { id: 'lifecycle',      icon: Clock,      label: 'Lifecycle' },
  { id: 'next-steps',     icon: Lightbulb,  label: 'Next Steps' },
];

export function ReportLayout({ activeTab, onTabChange, scopeBar, children }) {
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 48px)' }}>
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {scopeBar}
        {children}
      </div>
    </div>
  );
}

function Sidebar({ activeTab, onTabChange }) {
  return (
    <nav
      aria-label="Report navigation"
      style={{
        width: 48,
        background: 'var(--bg-deep)',
        borderRight: '1px solid rgba(0,196,180,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 12,
        gap: 4,
        position: 'sticky',
        top: 48,
        height: 'calc(100vh - 48px)',
        flexShrink: 0,
      }}
    >
      {SIDEBAR_TABS.map(({ id, icon: Icon, label }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            title={label}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className="sidebar-icon"
            style={{
              width: 36, height: 34,
              borderRadius: 8,
              background: isActive ? 'rgba(0,196,180,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(0,196,180,0.35)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isActive ? 'var(--teal)' : 'var(--text-secondary)',
              opacity: isActive ? 1 : 0.35,
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute', left: -1, top: '50%',
                transform: 'translateY(-50%)',
                width: 2, height: 18,
                background: 'var(--teal)',
                borderRadius: '0 2px 2px 0',
              }} />
            )}
            <Icon size={14} />
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm run build 2>&1 | grep -E "error|✓"
```
Expected: `✓ built in`

- [ ] **Step 4: Commit**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
git add src/components/Layout.jsx
git commit -m "feat(layout): dark topbar + Sidebar icon nav component"
```

---

## Task 3 — Home page: dark cards + hover + inline create

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Read current file**

```bash
cat /Users/bmiguel/Code/mysticmarvin-insights/src/pages/Home.jsx
```

- [ ] **Step 2: Rewrite Home.jsx**

Replace the entire file with:

```jsx
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

      {/* Inline create form */}
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
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm run build 2>&1 | grep -E "error|✓"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
git add src/pages/Home.jsx
git commit -m "feat(home): dark cards, hover micro-interactions, inline create"
```

---

## Task 4 — Project page: dark drop zone + parsing spinner

**Files:**
- Modify: `src/pages/Project.jsx`

- [ ] **Step 1: Read current file**

```bash
cat /Users/bmiguel/Code/mysticmarvin-insights/src/pages/Project.jsx
```

- [ ] **Step 2: Add spinner keyframe to theme.css**

Append to `src/theme.css`:

```css
/* ── Spinner ─────────────────────────── */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,196,180,0.2);
  border-top-color: var(--teal);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Update Project.jsx drop zone and file list styles**

Find and replace the drop zone `style` object (the `<div>` with `onDrop`):

```jsx
style={{
  border: `2px dashed ${dragOver ? 'var(--teal)' : 'rgba(0,196,180,0.25)'}`,
  borderRadius: 'var(--radius-lg)',
  padding: '40px 24px',
  textAlign: 'center',
  background: dragOver ? 'rgba(0,196,180,0.06)' : 'var(--bg-surface)',
  marginBottom: 24,
  transition: 'all 0.15s',
  pointerEvents: parsing ? 'none' : 'auto',
}}
```

Replace the "Browse files" label style:

```jsx
style={{
  display: 'inline-block', padding: '8px 20px',
  background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
  color: 'var(--bg-deep)',
  borderRadius: 'var(--radius)', cursor: 'pointer',
  fontSize: 'var(--text-sm)', fontWeight: 700,
}}
```

Replace the parsing indicator:

```jsx
{parsing && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 16, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
    <span className="spinner" />
    Parsing files… Cela peut prendre un moment pour les gros exports.
  </div>
)}
```

Replace the error div style:

```jsx
style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', marginBottom: 16, color: '#fca5a5', fontSize: 'var(--text-sm)' }}
```

Replace file row style:

```jsx
style={{
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 14px', background: 'var(--bg-surface)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-subtle)', marginBottom: 6,
}}
```

Replace "View Report" button style:

```jsx
style={{
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 24px',
  background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
  color: 'var(--bg-deep)', border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: 'var(--text-md)', fontWeight: 700, cursor: 'pointer',
  transition: 'filter 0.12s ease',
}}
```

Also add hover on that button: `onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'}` and `onMouseLeave={e => e.currentTarget.style.filter=''}`.

- [ ] **Step 4: Verify build**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm run build 2>&1 | grep -E "error|✓"
```

- [ ] **Step 5: Commit**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
git add src/theme.css src/pages/Project.jsx
git commit -m "feat(project): dark drop zone, teal CTA, parsing spinner"
```

---

## Task 5 — Report page: sidebar layout + scope in topbar + Fleet Banner

**Files:**
- Modify: `src/pages/Report.jsx`

- [ ] **Step 1: Read current file**

```bash
cat /Users/bmiguel/Code/mysticmarvin-insights/src/pages/Report.jsx
```

- [ ] **Step 2: Rewrite Report.jsx**

Replace the entire file with:

```jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb, ReportLayout } from '../components/Layout.jsx';
import { loadProjectData, listProjects } from '../storage/index.js';
import { useScopedData } from '../hooks/useScopedData.js';
import { OverviewTab } from './report/OverviewTab.jsx';
import { InfrastructureTab } from './report/InfrastructureTab.jsx';
import { VirtualMachinesTab } from './report/VirtualMachinesTab.jsx';
import { LifecycleTab } from './report/LifecycleTab.jsx';
import { NextStepsTab } from './report/NextStepsTab.jsx';
import { VCenterTab } from './report/VCenterTab.jsx';
import { ArrowLeft } from 'lucide-react';

export default function Report() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const rawData = loadProjectData(projectId);
  const project = listProjects().find(p => p.id === projectId);
  const [activeTab, setActiveTab] = useState('overview');
  const [scope, setScope] = useState({ vcenter: null });
  const [drillVC, setDrillVC] = useState(null);

  const scopedData = useScopedData(rawData, scope);

  if (!rawData?.vcenters?.length) return (
    <div style={{ padding: 32, color: 'var(--text-muted)' }}>
      Aucune donnée pour ce projet.{' '}
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 'var(--text-base)', textDecoration: 'underline' }}>
        Retour aux projets
      </button>
    </div>
  );

  const fleet = aggregateFleet(scopedData.vcenters);

  if (drillVC) {
    return (
      <div>
        <Breadcrumb items={[
          { label: project?.name || 'Project', to: `/projects/${projectId}` },
          { label: 'Report', to: `/projects/${projectId}/report` },
          { label: drillVC.vcenter_name?.split('.')[0] || 'vCenter' },
        ]} />
        <div style={{ padding: '8px 16px', background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setDrillVC(null)}
            aria-label="Back to Infrastructure"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600, transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--teal)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={13} /> Retour Infrastructure
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <VCenterTab vc={drillVC} allVCs={rawData.vcenters} />
        </div>
      </div>
    );
  }

  const scopeBar = (
    <ScopeBar vcenters={rawData.vcenters} scope={scope} onScopeChange={setScope} />
  );

  return (
    <div>
      <Breadcrumb items={[
        { label: project?.name || 'Project', to: `/projects/${projectId}` },
        { label: 'Report' },
      ]} />
      <FleetBanner fleet={fleet} scopeLabel={scope.vcenter ? scope.vcenter.split('.')[0] : null} />
      <ReportLayout activeTab={activeTab} onTabChange={setActiveTab} scopeBar={scopeBar}>
        <div style={{ padding: '20px 24px' }}>
          {activeTab === 'overview'       && <OverviewTab fleet={fleet} vcenters={scopedData.vcenters} allVcenters={rawData.vcenters} />}
          {activeTab === 'infrastructure' && <InfrastructureTab fleet={fleet} vcenters={scopedData.vcenters} onDrillVC={setDrillVC} />}
          {activeTab === 'vms'            && <VirtualMachinesTab fleet={fleet} vcenters={scopedData.vcenters} />}
          {activeTab === 'lifecycle'      && <LifecycleTab vcenters={scopedData.vcenters} allVcenters={rawData.vcenters} />}
          {activeTab === 'next-steps'     && <NextStepsTab fleet={fleet} vcenters={scopedData.vcenters} />}
        </div>
      </ReportLayout>
    </div>
  );
}

function ScopeBar({ vcenters, scope, onScopeChange }) {
  const allActive = !scope.vcenter;
  return (
    <div style={{
      background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)',
      padding: '0 16px', display: 'flex', gap: 0, overflowX: 'auto', alignItems: 'center',
    }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 8, flexShrink: 0 }}>Scope :</span>
      <button
        onClick={() => onScopeChange({ vcenter: null })}
        style={{
          padding: '8px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer',
          color: allActive ? 'var(--teal)' : 'var(--text-muted)',
          borderBottom: allActive ? '2px solid var(--teal)' : '2px solid transparent',
          whiteSpace: 'nowrap', transition: 'color 0.12s',
        }}
      >
        All vCenters
      </button>
      {vcenters.map(vc => {
        const name = vc.vcenter_name;
        const short = name?.split('.')[0] || name;
        const isActive = scope.vcenter === name;
        return (
          <button key={name} onClick={() => onScopeChange({ vcenter: name })} style={{
            padding: '8px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer',
            color: isActive ? 'var(--teal)' : 'var(--text-muted)',
            borderBottom: isActive ? '2px solid var(--teal)' : '2px solid transparent',
            whiteSpace: 'nowrap', transition: 'color 0.12s',
          }}>
            {short}
          </button>
        );
      })}
    </div>
  );
}

function FleetBanner({ fleet, scopeLabel }) {
  const kpis = [
    { value: fleet.vcenter_count,                    label: 'vCenters' },
    { value: fleet.total_hosts,                      label: 'ESXi Hosts' },
    { value: fleet.total_vms.toLocaleString(),       label: 'VMs' },
    { value: fleet.total_clusters,                   label: 'Clusters' },
    { value: `${fleet.storage_used_pct.toFixed(1)}%`, label: `Storage (${fleet.total_storage_tb.toFixed(0)} TB)` },
    { value: fleet.degraded_hosts, label: 'Degraded Hosts', warn: fleet.degraded_hosts > 0 },
    { value: fleet.tools_issues,   label: 'Tools Issues',   warn: fleet.tools_issues > 0 },
    { value: fleet.snap_count,     label: 'Snapshots',      warn: fleet.snap_count > 0 },
  ];
  return (
    <div style={{
      background: 'linear-gradient(150deg, var(--bg-deep) 0%, var(--bg-base) 100%)',
      borderBottom: '2px solid var(--teal)', padding: '14px 24px',
    }}>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {scopeLabel ? `Scope — ${scopeLabel}` : 'Fleet — All vCenters Combined'}
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, fontFamily: 'var(--mono)', color: k.warn ? 'var(--warn)' : 'var(--text-primary)' }}>
              {k.value}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {k.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function aggregateFleet(vcenters) {
  const all = vcenters || [];
  const sum = (key) => all.reduce((s, vc) => s + (vc.summary?.[key] || 0), 0);
  const totalStorageGB = sum('total_storage_gb');
  const usedStorageGB  = sum('used_storage_gb');
  return {
    vcenter_count:    all.length,
    total_hosts:      sum('total_hosts'),
    total_vms:        sum('total_vms'),
    total_clusters:   all.reduce((s, vc) => s + (vc.clusters?.length || 0), 0),
    total_host_cores: sum('total_host_cores'),
    total_host_ram_gb:sum('total_host_ram_gb'),
    total_storage_gb: totalStorageGB,
    total_storage_tb: totalStorageGB / 1024,
    used_storage_gb:  usedStorageGB,
    storage_used_pct: totalStorageGB > 0 ? (usedStorageGB / totalStorageGB) * 100 : 0,
    degraded_hosts:   sum('red_hosts') + sum('yellow_hosts'),
    red_hosts:        sum('red_hosts'),
    yellow_hosts:     sum('yellow_hosts'),
    tools_issues:     sum('tools_issue_count'),
    snap_count:       sum('snap_vm_count'),
    total_vcpus:      sum('total_vcpus'),
    total_vram_gb:    sum('total_vram_gb'),
    powered_on:       sum('powered_on'),
    powered_off:      sum('powered_off'),
    thin_vms:         sum('thin_vm_count'),
    thick_vms:        sum('thick_vm_count'),
    vhw_legacy:       sum('vhw_legacy_count'),
    vhw_mid:          sum('vhw_mid_count'),
    vhw_current:      sum('vhw_current_count'),
    vm_to_core_ratio: all.length > 0 ? (sum('total_vms') / Math.max(1, sum('total_host_cores'))).toFixed(2) : 0,
    vcpu_to_core_ratio: all.length > 0 ? (sum('total_vcpus') / Math.max(1, sum('total_host_cores'))).toFixed(2) : 0,
  };
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm run build 2>&1 | grep -E "error|✓"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
git add src/pages/Report.jsx
git commit -m "feat(report): sidebar layout, dark Fleet Banner, scope bar dark"
```

---

## Task 6 — StatusBadge + charts: dark palette

**Files:**
- Modify: `src/components/report/StatusBadge.jsx`
- Modify: `src/components/report/charts.jsx`

- [ ] **Step 1: Read both files**

```bash
cat /Users/bmiguel/Code/mysticmarvin-insights/src/components/report/StatusBadge.jsx
cat /Users/bmiguel/Code/mysticmarvin-insights/src/components/report/charts.jsx
```

- [ ] **Step 2: Update StatusBadge.jsx**

In `StatusBadge.jsx`, find the `cfg` object inside `StatusBadge` that maps statuses to `cls` strings. Ensure these class names match the new dark badges:

- `cls: 'badge-green'` for OK/current states
- `cls: 'badge-yellow'` for old/warning states  
- `cls: 'badge-red'` for critical states
- `cls: 'badge-gray'` for unknown/unmanaged states

Also find `hardcoded color: '#ca8a04'` in StatusBadge and replace with `var(--status-warn)`.

The `StatusDot` component uses inline colored `div`. Update its colors:
- green → `var(--status-ok)`
- yellow → `var(--status-warn)`
- orange → `var(--orange)`
- red → `var(--status-danger)`
- gray → `var(--text-muted)`

- [ ] **Step 3: Update charts.jsx COLORS object**

Replace the `COLORS` export with:

```js
export const COLORS = {
  get navy()  { return getCSSVar('--bg-surface') || '#0f2422'; },
  get teal()  { return getCSSVar('--teal')       || '#00c4b4'; },
  get accent(){ return getCSSVar('--teal')       || '#00c4b4'; },
  green:  '#22c55e',
  yellow: '#f59e0b',
  orange: '#f97316',
  danger: '#ef4444',
  navyAlpha: (a) => `rgba(15,36,34,${a})`,
  tealAlpha: (a) => `rgba(0,196,180,${a})`,
};
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm run build 2>&1 | grep -E "error|✓"
```

- [ ] **Step 5: Commit**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
git add src/components/report/StatusBadge.jsx src/components/report/charts.jsx
git commit -m "feat(components): dark badge colors, teal chart palette"
```

---

## Task 7 — Report tabs: adopt CSS classes, fix hardcoded colors

**Files:**
- Modify: `src/pages/report/OverviewTab.jsx`
- Modify: `src/pages/report/InfrastructureTab.jsx`
- Modify: `src/pages/report/VirtualMachinesTab.jsx`
- Modify: `src/pages/report/LifecycleTab.jsx`
- Modify: `src/pages/report/NextStepsTab.jsx`
- Modify: `src/pages/report/VCenterTab.jsx`

- [ ] **Step 1: Fix hardcoded hex in OverviewTab.jsx — `eosColor` function**

Find the `eosColor` function and replace:

```js
function eosColor(days) {
  if (days === null) return 'var(--text-muted)';
  if (days < 0)   return 'var(--status-danger)';
  if (days < 180) return 'var(--orange)';
  if (days < 365) return 'var(--status-warn)';
  return 'var(--status-ok)';
}
```

- [ ] **Step 2: Fix hardcoded hex in NextStepsTab.jsx**

Find the `colorForValue` function (or equivalent) that uses `#dc2626`, `#ea580c`, `#d97706`, `#16a34a` and replace with tokens:

```js
function colorForValue(priority) {
  if (priority === 'critical') return 'var(--status-danger)';
  if (priority === 'high')     return 'var(--orange)';
  if (priority === 'medium')   return 'var(--status-warn)';
  return 'var(--status-ok)';
}
```

Also replace background colors for priority cards (`#fff5f5`, `#fff7ed`, `#fffbeb`, `#f0fdf4`) with:
- critical: `rgba(239,68,68,0.08)`
- high: `rgba(249,115,22,0.08)`
- medium: `rgba(245,158,11,0.08)`
- low: `rgba(34,197,94,0.08)`

- [ ] **Step 3: Replace `background: '#fff'` in all tabs**

Run a search and replace across all 6 tab files:

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
# Check occurrences
grep -rn "background: '#fff'" src/pages/report/
grep -rn "'#fff'" src/pages/report/
```

For each occurrence of `background: '#fff'` replace with `background: 'var(--bg-surface)'`.
For each occurrence of `color: '#fff'` replace with `color: 'var(--text-primary)'`.

- [ ] **Step 4: Replace `background: '#fef2f2'` and similar light backgrounds**

```bash
grep -rn "#fef2f2\|#fff5f5\|#fffbeb\|#f0fdf4\|#fef9c3" src/pages/report/
```

Replace each with the dark equivalents from Step 2 above.

- [ ] **Step 5: Update table row hover colors**

```bash
grep -rn "background: var(--gray-50)" src/pages/report/
```

Replace all `var(--gray-50)` in hover or row backgrounds with `var(--bg-hover)`.

- [ ] **Step 6: Verify build and run tests**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
npm run build 2>&1 | grep -E "error|✓"
npm test -- --run 2>&1 | tail -10
```
Expected: build ✓, all parser/storage tests pass (they don't touch UI).

- [ ] **Step 7: Commit**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights
git add src/pages/report/
git commit -m "feat(tabs): adopt dark CSS classes, fix hardcoded light-mode colors"
```

---

## Task 8 — Final polish: push to GitHub

- [ ] **Step 1: Full build check**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm run build 2>&1 | tail -8
```

- [ ] **Step 2: Run all tests**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && npm test -- --run 2>&1 | tail -10
```
Expected: all parser + storage tests pass.

- [ ] **Step 3: Push**

```bash
cd /Users/bmiguel/Code/mysticmarvin-insights && git push origin main
```

- [ ] **Step 4: Verify GitHub Actions CI passes**

```bash
gh run list --repo mbrasseur/mysticmarvin-insights --limit 3
```
Expected: most recent run shows `completed` / `success`.

---

## Self-Review

**Spec coverage check:**
- ✓ Section 2 (tokens) → Task 1
- ✓ Section 3 (typography scale) → Task 1 (type scale tokens in theme.css)
- ✓ Section 4 (app shell / topbar / sidebar) → Task 2
- ✓ Section 5 (Home page) → Task 3
- ✓ Section 6 (Project page) → Task 4
- ✓ Section 7 (Report page) → Task 5
- ✓ Section 8 (micro-interactions) → Tasks 1 (CSS classes), 2 (sidebar hover), 3 (card hover), 4 (CTA hover), 5 (scope bar transitions)
- ✓ Section 9 (component classes) → Tasks 1 + 6 + 7
- ✓ Section 10 (files impacted) → all covered across tasks

**Placeholder scan:** No TBD, no "similar to task N", all code blocks complete.

**Type consistency:**
- `ReportLayout` exported from `Layout.jsx` (Task 2) and imported in `Report.jsx` (Task 5) ✓
- `aggregateFleet` stays exported from `Report.jsx` — no change to signature ✓
- `COLORS.teal` → `getCSSVar('--teal')` matches token `--teal` defined in Task 1 ✓
