import { Link } from 'react-router-dom';
import { Home, ChevronRight, BarChart2, Layers, Monitor, Clock, Lightbulb } from 'lucide-react';

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
