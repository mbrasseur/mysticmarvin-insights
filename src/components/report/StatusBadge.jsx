export function StatusDot({ status }) {
  const colors = {
    GREEN: 'var(--status-ok)', YELLOW: 'var(--status-warn)', RED: 'var(--status-danger)',
    ORANGE: 'var(--orange)', NORMAL: 'var(--status-ok)', OK: 'var(--status-ok)',
  };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: colors[status?.toUpperCase()] || 'var(--text-muted)',
    }} />
  );
}

export function HealthBadge({ status }) {
  const config = {
    GREEN: { cls: 'badge-green', label: 'Green' },
    YELLOW: { cls: 'badge-yellow', label: 'Yellow' },
    RED: { cls: 'badge-red', label: 'Red' },
    NORMAL: { cls: 'badge-green', label: 'Normal' },
  };
  const cfg = config[status?.toUpperCase()] || { cls: 'badge-gray', label: status || '—' };
  return <span className={`badge ${cfg.cls}`}><StatusDot status={status} /> {cfg.label}</span>;
}

export function OcBadge({ value }) {
  if (value >= 200) return <span className="badge badge-red">{value.toFixed(0)}%</span>;
  if (value >= 130) return <span className="badge badge-orange">{value.toFixed(0)}%</span>;
  if (value >= 100) return <span className="badge badge-yellow">{value.toFixed(0)}%</span>;
  return <span className="badge badge-green">{value.toFixed(0)}%</span>;
}

export function StorageBadge({ pct }) {
  if (pct >= 85) return <span className="badge badge-red">{pct.toFixed(1)}%</span>;
  if (pct >= 60) return <span className="badge badge-orange">{pct.toFixed(1)}%</span>;
  return <span className="badge badge-green">{pct.toFixed(1)}%</span>;
}

export function ToolsBadge({ status }) {
  const config = {
    toolsOk: { cls: 'badge-green', label: 'OK' },
    guestToolsCurrent: { cls: 'badge-green', label: 'Current' },
    toolsOld: { cls: 'badge-yellow', label: 'Outdated' },
    toolsNotInstalled: { cls: 'badge-red', label: 'Not Installed' },
    toolsNotRunning: { cls: 'badge-orange', label: 'Not Running' },
  };
  const cfg = config[status] || { cls: 'badge-gray', label: status || '—' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

export function MiniBar({ value, max = 100, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const col = color || (pct >= 85 ? 'var(--danger)' : pct >= 60 ? 'var(--orange)' : 'var(--teal)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="mini-bar" style={{ flex: 1, minWidth: 50 }}>
        <div className="mini-bar-fill" style={{ width: `${pct}%`, background: col }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--gray-600)', minWidth: 34, textAlign: 'right' }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
