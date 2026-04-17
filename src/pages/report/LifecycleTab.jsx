// app/src/pages/report/LifecycleTab.jsx
import { useState } from 'react';

const SUBTABS = [
  { id: 'vcenter', label: 'vCenter Lifecycle' },
  { id: 'esxi',    label: 'ESXi Lifecycle' },
  { id: 'vmlife',  label: 'VM Lifecycle' },
  { id: 'tools',   label: 'VM Tools' },
];

const VCENTER_EOS = { '6.0': '2022-03-12', '6.5': '2023-10-15', '6.7': '2022-10-15', '7.0': '2025-04-02', '8.0': '2027-10-11' };
const ESXI_EOS    = { '6.0': '2022-03-12', '6.5': '2023-10-15', '6.7': '2022-10-15', '7.0': '2025-04-02', '8.0': '2027-10-11' };

function daysUntil(isoDate) {
  if (!isoDate) return null;
  return Math.floor((new Date(isoDate) - new Date()) / 86400000);
}

function EOSBadge({ days }) {
  if (days === null) return <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>Unknown</span>;
  const color = days < 0 ? 'var(--danger)' : days < 180 ? 'var(--orange)' : days < 365 ? 'var(--yellow)' : 'var(--green)';
  const label = days < 0 ? `EOS ${Math.abs(days)}d ago` : `${days}d remaining`;
  return <span style={{ fontSize: 10, fontWeight: 700, color }}>{label}</span>;
}

export function LifecycleTab({ vcenters, allVcenters }) {
  const [sub, setSub] = useState('vcenter');
  return (
    <div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)', marginBottom: 20 }}>
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            padding: '8px 16px', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
            color: sub === t.id ? 'var(--navy)' : 'var(--gray-500)',
            borderBottom: sub === t.id ? '2px solid var(--navy)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>
      {sub === 'vcenter' && <VCenterLifecycle vcenters={vcenters} />}
      {sub === 'esxi'    && <ESXiLifecycle    vcenters={vcenters} />}
      {sub === 'vmlife'  && <VMLifecycle      vcenters={vcenters} />}
      {sub === 'tools'   && <VMToolsLifecycle vcenters={vcenters} />}
    </div>
  );
}

// ── vCenter Lifecycle ──────────────────────────────────────────────────────

function VCenterLifecycle({ vcenters }) {
  const allHosts = vcenters.flatMap(vc => vc.hosts || []);
  const allVMs   = vcenters.flatMap(vc => vc.vms || []).filter(v => v.is_template !== 'Yes');

  // Group vcenters by release
  const releaseMap = {};
  vcenters.forEach(vc => {
    const major = (vc.vcenter_version || '').match(/^(\d+\.\d+)/)?.[1] || 'Unknown';
    if (!releaseMap[major]) releaseMap[major] = { vcenters: [], eosDate: VCENTER_EOS[major] || null };
    releaseMap[major].vcenters.push(vc);
  });

  const releaseRows = Object.entries(releaseMap).sort((a, b) => b[0].localeCompare(a[0]));

  // EOS timeline
  const eosEntries = releaseRows.map(([rel, d]) => {
    const days = daysUntil(d.eosDate);
    const hostCount = d.vcenters.flatMap(vc => vc.hosts || []).length;
    const vmCount   = d.vcenters.flatMap(vc => vc.vms || []).filter(v => v.is_template !== 'Yes').length;
    return { rel, days, eosDate: d.eosDate, hostCount, vmCount, vcCount: d.vcenters.length, vcenters: d.vcenters };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* EOS Timeline */}
      <div className="card">
        <div className="section-header">vCenter End of Support Timeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eosEntries.map((e, i) => {
            const color = e.days === null ? 'var(--gray-400)' : e.days < 0 ? 'var(--danger)' : e.days < 180 ? 'var(--orange)' : e.days < 365 ? 'var(--yellow)' : 'var(--green)';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 180, fontSize: 12, fontWeight: 600, color: 'var(--navy)', flexShrink: 0 }}>vCenter {e.rel}</div>
                <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: 4, height: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: e.days !== null && e.days > 0 ? `${Math.min(100, (e.days / 730) * 100)}%` : '100%',
                    background: color, opacity: 0.8,
                  }} />
                </div>
                <div style={{ width: 150, flexShrink: 0 }}><EOSBadge days={e.days} /></div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', width: 80, flexShrink: 0 }}>{e.eosDate || 'Unknown'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* vCenter Release Details */}
      <div className="card">
        <div className="section-header">vCenter Release Details</div>
        <table className="data-table">
          <thead>
            <tr><th>Release</th><th>vCenter</th><th>Build</th><th>Hosts</th><th>% Hosts</th><th>VMs</th><th>% VMs</th><th>EOS Status</th></tr>
          </thead>
          <tbody>
            {vcenters.map(vc => {
              const major = (vc.vcenter_version || '').match(/^(\d+\.\d+)/)?.[1];
              const eosDate = VCENTER_EOS[major];
              const days = daysUntil(eosDate);
              const hosts = vc.summary?.total_hosts || 0;
              const vms   = vc.summary?.total_vms   || 0;
              const totalHosts = vcenters.reduce((s, v) => s + (v.summary?.total_hosts || 0), 0);
              const totalVMs   = vcenters.reduce((s, v) => s + (v.summary?.total_vms   || 0), 0);
              return (
                <tr key={vc.vcenter_name}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{major || '?'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 11 }}>{vc.vcenter_name?.split('.')[0]}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{vc.vcenter_build || '—'}</td>
                  <td className="mono">{hosts}</td>
                  <td className="mono">{totalHosts > 0 ? `${(hosts / totalHosts * 100).toFixed(1)}%` : '—'}</td>
                  <td className="mono">{vms}</td>
                  <td className="mono">{totalVMs > 0 ? `${(vms / totalVMs * 100).toFixed(1)}%` : '—'}</td>
                  <td><EOSBadge days={days} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ESXi Lifecycle ─────────────────────────────────────────────────────────

function ESXiLifecycle({ vcenters }) {
  const allHosts = vcenters.flatMap(vc => vc.hosts || []);
  const totalHosts = allHosts.length;
  const totalVMs   = vcenters.flatMap(vc => vc.vms || []).filter(v => v.is_template !== 'Yes').length;

  // Group by ESXi major version
  const versionMap = {};
  allHosts.forEach(h => {
    const v = h.esxi_major || 'Unknown';
    if (!versionMap[v]) versionMap[v] = { hosts: [], eosDate: ESXI_EOS[v] || null };
    versionMap[v].hosts.push(h);
  });

  const versionRows = Object.entries(versionMap).sort((a, b) => b[0].localeCompare(a[0]));

  // Build distribution table
  const buildMap = {};
  allHosts.forEach(h => {
    const b = h.build || 'Unknown';
    if (!buildMap[b]) buildMap[b] = { count: 0, versions: new Set(), avgUptimeDays: 0, _uptimeSum: 0 };
    buildMap[b].count++;
    buildMap[b].versions.add(h.esxi_major || '?');
    buildMap[b]._uptimeSum += (h.uptime_sec || 0) / 86400;
  });
  Object.values(buildMap).forEach(b => { b.avgUptimeDays = b.count > 0 ? b._uptimeSum / b.count : 0; });
  const buildRows = Object.entries(buildMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* EOS Timeline */}
      <div className="card">
        <div className="section-header">ESXi Hosts End of Support Timeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {versionRows.map(([ver, d], i) => {
            const days = daysUntil(d.eosDate);
            const color = days === null ? 'var(--gray-400)' : days < 0 ? 'var(--danger)' : days < 180 ? 'var(--orange)' : days < 365 ? 'var(--yellow)' : 'var(--green)';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 180, fontSize: 12, fontWeight: 600, color: 'var(--navy)', flexShrink: 0 }}>ESXi {ver} ({d.hosts.length} hosts)</div>
                <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: 4, height: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: days !== null && days > 0 ? `${Math.min(100, (days / 730) * 100)}%` : '100%', background: color, opacity: 0.8 }} />
                </div>
                <div style={{ width: 150, flexShrink: 0 }}><EOSBadge days={days} /></div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', width: 80, flexShrink: 0 }}>{d.eosDate || 'Unknown'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ESXi Release Details */}
      <div className="card">
        <div className="section-header">ESXi Release Details</div>
        <table className="data-table">
          <thead><tr><th>Release</th><th>Hosts</th><th>% Total</th><th>Avg Uptime</th><th>EOS Status</th></tr></thead>
          <tbody>
            {versionRows.map(([ver, d]) => {
              const days = daysUntil(d.eosDate);
              const avgUptime = d.hosts.length > 0 ? d.hosts.reduce((s, h) => s + ((h.uptime_sec || 0) / 86400), 0) / d.hosts.length : 0;
              return (
                <tr key={ver}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>ESXi {ver}</td>
                  <td className="mono">{d.hosts.length}</td>
                  <td className="mono">{totalHosts > 0 ? `${(d.hosts.length / totalHosts * 100).toFixed(1)}%` : '—'}</td>
                  <td className="mono">{avgUptime.toFixed(0)}d</td>
                  <td><EOSBadge days={days} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Build Distribution */}
      <div className="card">
        <div className="section-header">ESXi Build Distribution — Patch Consistency</div>
        {buildRows.length > 2 && (
          <div className="alert alert-yellow" style={{ marginBottom: 12 }}>
            {buildRows.length} different build levels detected — inconsistent patching increases security exposure
          </div>
        )}
        <table className="data-table">
          <thead><tr><th>Build</th><th>Hosts</th><th>% Fleet</th><th>ESXi Version</th><th>Avg Uptime</th></tr></thead>
          <tbody>
            {buildRows.map(([build, d]) => (
              <tr key={build}>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{build}</td>
                <td className="mono">{d.count}</td>
                <td className="mono">{totalHosts > 0 ? `${(d.count / totalHosts * 100).toFixed(1)}%` : '—'}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{[...d.versions].join(', ')}</td>
                <td className="mono">{d.avgUptimeDays.toFixed(0)}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lifecycle Policies */}
      <div className="card" style={{ borderLeft: '3px solid var(--navy)' }}>
        <div className="section-header">VMware Lifecycle Policies</div>
        <p style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.7 }}>
          VMware (Broadcom) follows a General Support period of 5 years from GA, followed by 3 years of Technical Guidance.
          ESXi 7.0 reached End of General Support on 2 April 2025. ESXi 8.0 is supported until 11 October 2027.
          For full lifecycle details, refer to the VMware Product Lifecycle Matrix at{' '}
          <a href="https://lifecycle.vmware.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)' }}>lifecycle.vmware.com</a>.
        </p>
      </div>
    </div>
  );
}

// ── VM Lifecycle ───────────────────────────────────────────────────────────

function VMLifecycle({ vcenters }) {
  const allVMs = vcenters.flatMap(vc => vc.vms || []).filter(v => v.is_template !== 'Yes');

  // vHW by vCenter
  const vhwByVC = vcenters.map(vc => {
    const vms = (vc.vms || []).filter(v => v.is_template !== 'Yes');
    const dist = {};
    vms.forEach(v => { dist[v.vhw_version || 'Unknown'] = (dist[v.vhw_version || 'Unknown'] || 0) + 1; });
    return { name: vc.vcenter_name?.split('.')[0], dist };
  });

  // Tools by vCenter
  const toolsByVC = vcenters.map(vc => {
    const vms = (vc.vms || []).filter(v => v.is_template !== 'Yes');
    const ok = vms.filter(v => ['toolsOk', 'guestToolsCurrent'].includes(v.tools_status)).length;
    const old = vms.filter(v => v.tools_status === 'toolsOld').length;
    const notInst = vms.filter(v => v.tools_status === 'toolsNotInstalled').length;
    const notRun  = vms.filter(v => v.tools_status === 'toolsNotRunning').length;
    const unmanaged = vms.length - ok - old - notInst - notRun;
    return { name: vc.vcenter_name?.split('.')[0], ok, old, notInst, notRun, unmanaged, total: vms.length };
  });

  // Tools by Guest OS
  const toolsByOS = {};
  allVMs.forEach(v => {
    const os = (v.guest_os || 'Unknown').split(' ').slice(0, 2).join(' ');
    if (!toolsByOS[os]) toolsByOS[os] = { ok: 0, issues: 0 };
    if (['toolsOk', 'guestToolsCurrent'].includes(v.tools_status)) toolsByOS[os].ok++;
    else toolsByOS[os].issues++;
  });
  const toolsOSRows = Object.entries(toolsByOS).sort((a, b) => (b[1].ok + b[1].issues) - (a[1].ok + a[1].issues)).slice(0, 15);

  // vHW distribution
  const vhwDist = {};
  allVMs.forEach(v => { vhwDist[v.vhw_version || 'Unknown'] = (vhwDist[v.vhw_version || 'Unknown'] || 0) + 1; });
  const vhwRows = Object.entries(vhwDist).sort((a, b) => {
    const na = parseInt(a[0].replace('vmx-', '')) || 0;
    const nb = parseInt(b[0].replace('vmx-', '')) || 0;
    return nb - na;
  });

  // Tools status distribution
  const toolsDist = {};
  allVMs.forEach(v => { toolsDist[v.tools_status || 'Unknown'] = (toolsDist[v.tools_status || 'Unknown'] || 0) + 1; });
  const toolsStatusRows = Object.entries(toolsDist).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tools by vCenter */}
      <div className="card">
        <div className="section-header">VMTools Status by vCenter</div>
        <table className="data-table">
          <thead><tr><th>vCenter</th><th>Total VMs</th><th>OK/Current</th><th>Need Upgrade</th><th>Not Installed</th><th>Not Running</th><th>Unmanaged</th></tr></thead>
          <tbody>
            {toolsByVC.map(r => (
              <tr key={r.name}>
                <td style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 11 }}>{r.name}</td>
                <td className="mono">{r.total}</td>
                <td className="mono" style={{ color: 'var(--green)' }}>{r.ok}</td>
                <td className="mono" style={{ color: r.old > 0 ? 'var(--yellow)' : 'inherit' }}>{r.old}</td>
                <td className="mono" style={{ color: r.notInst > 0 ? 'var(--danger)' : 'inherit' }}>{r.notInst}</td>
                <td className="mono" style={{ color: r.notRun > 0 ? 'var(--orange)' : 'inherit' }}>{r.notRun}</td>
                <td className="mono">{r.unmanaged}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* vHW Version distribution */}
        <div className="card">
          <div className="section-header">vHW Version Distribution</div>
          <table className="data-table">
            <thead><tr><th>vHW Version</th><th>VMs</th><th>% Total</th></tr></thead>
            <tbody>
              {vhwRows.map(([ver, count]) => (
                <tr key={ver}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{ver}</td>
                  <td className="mono">{count.toLocaleString()}</td>
                  <td className="mono">{allVMs.length > 0 ? `${(count / allVMs.length * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tools by Guest OS */}
        <div className="card">
          <div className="section-header">VMTools by Guest OS (Top 15)</div>
          <table className="data-table">
            <thead><tr><th>OS</th><th>OK</th><th>Issues</th><th>% OK</th></tr></thead>
            <tbody>
              {toolsOSRows.map(([os, d]) => (
                <tr key={os}>
                  <td style={{ fontSize: 11 }}>{os}</td>
                  <td className="mono" style={{ color: 'var(--green)' }}>{d.ok}</td>
                  <td className="mono" style={{ color: d.issues > 0 ? 'var(--danger)' : 'inherit' }}>{d.issues}</td>
                  <td className="mono">{d.ok + d.issues > 0 ? `${(d.ok / (d.ok + d.issues) * 100).toFixed(0)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── VM Tools Lifecycle ─────────────────────────────────────────────────────

function VMToolsLifecycle({ vcenters }) {
  const [search, setSearch] = useState('');
  const allVMs = vcenters.flatMap(vc => vc.vms || []);

  // EOGS status buckets
  const TOOLS_EOS = { 'toolsOk': 'Supported', 'guestToolsCurrent': 'Supported', 'toolsOld': 'Needs Upgrade', 'toolsNotInstalled': 'Not Supported', 'toolsNotRunning': 'Unknown' };
  const eogsStatus = { Supported: 0, 'Needs Upgrade': 0, 'Not Supported': 0, Unknown: 0 };
  allVMs.forEach(v => {
    const s = TOOLS_EOS[v.tools_status] || 'Unknown';
    eogsStatus[s]++;
  });

  const toolsOrigin = { Managed: 0, Unmanaged: 0 };
  allVMs.forEach(v => {
    if (v.tools_status && v.tools_status !== 'toolsNotInstalled') toolsOrigin.Managed++;
    else toolsOrigin.Unmanaged++;
  });

  const filtered = allVMs.filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* EOGS status charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Tools EOGS Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {Object.entries(eogsStatus).map(([k, v]) => {
              const color = k === 'Supported' ? 'var(--green)' : k === 'Needs Upgrade' ? 'var(--yellow)' : k === 'Not Supported' ? 'var(--danger)' : 'var(--gray-400)';
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{k}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color }}>{v.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Tools Origin</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {Object.entries(toolsOrigin).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--gray-600)' }}>{k}</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed VM list */}
      <div className="card">
        <div className="section-header">
          Detailed VM List
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter by VM name…"
            style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: 11, border: '1px solid var(--gray-200)', borderRadius: 4, width: 200 }}
          />
        </div>
        <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 8 }}>Showing {Math.min(200, filtered.length)} of {filtered.length} VMs</p>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Power State</th><th>Tools Status</th><th>vHW</th><th>Guest OS</th><th>Template</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((v, i) => {
              const eogsS = TOOLS_EOS[v.tools_status] || 'Unknown';
              const statusColor = eogsS === 'Supported' ? 'var(--green)' : eogsS === 'Needs Upgrade' ? 'var(--yellow)' : eogsS === 'Not Supported' ? 'var(--danger)' : 'var(--gray-400)';
              return (
                <tr key={i}>
                  <td style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</td>
                  <td style={{ fontSize: 10 }}>{v.power_state?.replace('POWERED_', '') || '—'}</td>
                  <td style={{ fontSize: 10, fontWeight: 600, color: statusColor }}>{v.tools_status || '—'}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{v.vhw_version || '—'}</td>
                  <td style={{ fontSize: 10 }}>{v.guest_os || '—'}</td>
                  <td style={{ fontSize: 10 }}>{v.is_template === 'Yes' ? 'Yes' : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
