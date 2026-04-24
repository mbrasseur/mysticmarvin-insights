import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

export function AppShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

function TopBar() {
  return (
    <header style={{
      background: 'var(--topbar-bg)',
      borderBottom: '3px solid var(--topbar-border)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--topbar-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'var(--navy)', fontSize: 13, fontWeight: 900 }}>M</span>
        </div>
        <span style={{ color: 'var(--white)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>
          MysticMarvin Insights
        </span>
      </Link>
    </header>
  );
}

export function Breadcrumb({ items }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', color: 'var(--gray-500)', fontSize: 12 }}>
      <Link to="/"><Home size={12} /></Link>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronRight size={10} />
          {item.to ? <Link to={item.to} style={{ color: 'var(--gray-500)' }}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </div>
  );
}
