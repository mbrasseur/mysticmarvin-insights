// app/src/pages/report/OverviewTab.jsx
import { DonutChart, HBarChart, COLORS, OC_COLORS } from '../../components/report/charts.jsx';
import { OcBadge, MiniBar } from '../../components/report/StatusBadge.jsx';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// EOS reference dates (mirror vhst.py)
const VCENTER_EOS = { '6.0': '2022-03-12', '6.5': '2023-10-15', '6.7': '2022-10-15', '7.0': '2025-04-02', '8.0': '2027-10-11' };
const ESXI_EOS    = { '6.0': '2022-03-12', '6.5': '2023-10-15', '6.7': '2022-10-15', '7.0': '2025-04-02', '8.0': '2027-10-11' };

function daysUntil(isoDate) {
  if (!isoDate) return null;
  return Math.floor((new Date(isoDate) - new Date()) / 86400000);
}

function eosColor(days) {
  if (days === null) return 'var(--gray-400)';
  if (days < 0)   return 'var(--danger)';
  if (days < 180) return 'var(--orange)';
  if (days < 365) return 'var(--yellow)';
  return 'var(--green)';
}

export function OverviewTab({ fleet, vcenters, allVcenters }) {
  const hasRedHosts = fleet.red_hosts > 0;
  const hasYellowHosts = fleet.yellow_hosts > 0;

  const allClusters = vcenters.flatMap(vc => vc.clusters || []);
  const haEnabled  = allClusters.filter(c => c.ha_enabled  === 'True' || c.ha_enabled  === '1').length;
  const drsEnabled = allClusters.filter(c => c.drs_enabled === 'True' || c.drs_enabled === '1').length;
  const evcEnabled = allClusters.filter(c => c.evc_mode && c.evc_mode !== '' && c.evc_mode !== 'None').length;

  const allVMs = vcenters.flatMap(vc => vc.vms || []);
  const toolsCounts = { ok: 0, old: 0, notInstalled: 0, notRunning: 0, unmanaged: 0 };
  allVMs.forEach(v => {
    if (v.is_template === 'Yes') return;
    const s = v.tools_status;
    if (s === 'toolsOk' || s === 'guestToolsCurrent') toolsCounts.ok++;
    else if (s === 'toolsOld') toolsCounts.old++;
    else if (s === 'toolsNotInstalled') toolsCounts.notInstalled++;
    else if (s === 'toolsNotRunning') toolsCounts.notRunning++;
    else toolsCounts.unmanaged++;
  });

  // Manageability — count unique versions/builds across full fleet (allVcenters) or scoped
  const src = vcenters;
  const allHosts = src.flatMap(vc => vc.hosts || []);
  const uniqueVCVersions = new Set(src.map(vc => vc.vcenter_version).filter(Boolean));
  const uniqueVCBuilds   = new Set(src.map(vc => vc.vcenter_build).filter(Boolean));
  const uniqueESXiVersions = new Set(allHosts.map(h => h.esxi_major).filter(Boolean));
  const uniqueESXiBuilds   = new Set(allHosts.map(h => h.build).filter(Boolean));

  const vcNames    = vcenters.map(vc => vc.vcenter_name?.split('.')[0] || 'unknown');
  const maxOcPerVC = vcenters.map(vc => Math.max(...(vc.overcommitment || []).map(o => o.cpu_oc_pct || 0), 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {hasRedHosts && (
        <div className="alert alert-red"><AlertTriangle size={14} /> {fleet.red_hosts} host{fleet.red_hosts > 1 ? 's' : ''} in RED health status — immediate investigation required</div>
      )}
      {hasYellowHosts && !hasRedHosts && (
        <div className="alert alert-yellow"><AlertTriangle size={14} /> {fleet.yellow_hosts} host{fleet.yellow_hosts > 1 ? 's' : ''} in degraded (YELLOW) status</div>
      )}

      <Observations fleet={fleet} vcenters={vcenters} />

      {/* Inventory KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        {[
          { v: vcenters.length,                              l: 'vCenters' },
          { v: fleet.total_hosts,                            l: 'ESXi Hosts' },
          { v: fleet.total_clusters,                         l: 'Clusters' },
          { v: fleet.total_host_cores.toLocaleString(),      l: 'CPU Cores' },
          { v: `${(fleet.total_host_ram_gb/1024).toFixed(0)} TB`, l: 'Host RAM' },
          { v: fleet.total_vms.toLocaleString(),             l: 'Total VMs' },
          { v: fleet.powered_on.toLocaleString(),            l: 'Powered On' },
          { v: fleet.powered_off.toLocaleString(),           l: 'Powered Off' },
          { v: fleet.total_vcpus.toLocaleString(),           l: 'vCPUs' },
          { v: parseFloat(fleet.vcpu_to_core_ratio).toFixed(2), l: 'vCPU:Core' },
          { v: parseFloat(fleet.vm_to_core_ratio).toFixed(2),   l: 'VM:Core' },
          { v: fleet.snap_count,                             l: 'Snap VMs', warn: fleet.snap_count > 0 },
        ].map(k => (
          <div key={k.l} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.warn ? 'var(--danger)' : 'var(--navy)', fontFamily: 'var(--mono)' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Manageability KPIs */}
      <div className="card">
        <div className="section-header">Manageability Metrics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { v: uniqueVCVersions.size,    l: 'vCenter Versions',  warn: uniqueVCVersions.size > 1 },
            { v: uniqueVCBuilds.size,      l: 'vCenter Builds',    warn: uniqueVCBuilds.size > 1 },
            { v: uniqueESXiVersions.size,  l: 'ESXi Versions',     warn: uniqueESXiVersions.size > 1 },
            { v: uniqueESXiBuilds.size,    l: 'ESXi Builds',       warn: uniqueESXiBuilds.size > 2 },
          ].map(k => (
            <div key={k.l} style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: k.warn ? 'var(--orange)' : 'var(--green)' }}>{k.v}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{k.l}</div>
              <div style={{ fontSize: 10, color: k.warn ? 'var(--orange)' : 'var(--green)', fontWeight: 600 }}>{k.warn ? 'Fragmented' : 'Consistent'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Availability & Efficiency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Clusters by HA</div>
          <DonutChart labels={['HA On', 'HA Off']} data={[haEnabled, allClusters.length - haEnabled]}
            colors={[COLORS.teal, COLORS.navyAlpha(0.15)]} size={100}
            centerText={{ value: `${Math.round(haEnabled / Math.max(1, allClusters.length) * 100)}%`, label: 'HA On' }} />
          <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{haEnabled}/{allClusters.length}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Clusters by DRS</div>
          <DonutChart labels={['DRS On', 'DRS Off']} data={[drsEnabled, allClusters.length - drsEnabled]}
            colors={[COLORS.navy, COLORS.navyAlpha(0.15)]} size={100}
            centerText={{ value: `${Math.round(drsEnabled / Math.max(1, allClusters.length) * 100)}%`, label: 'DRS On' }} />
          <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{drsEnabled}/{allClusters.length}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Clusters by EVC</div>
          <DonutChart labels={['EVC On', 'EVC Off']} data={[evcEnabled, allClusters.length - evcEnabled]}
            colors={[COLORS.teal, COLORS.navyAlpha(0.15)]} size={100}
            centerText={{ value: `${Math.round(evcEnabled / Math.max(1, allClusters.length) * 100)}%`, label: 'EVC On' }} />
          <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{evcEnabled}/{allClusters.length}</p>
        </div>
        <div className="card">
          <div className="section-header">VMTools Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'OK / Current',  value: toolsCounts.ok,           color: 'var(--green)' },
              { label: 'Need Upgrade',  value: toolsCounts.old,          color: 'var(--yellow)' },
              { label: 'Not Installed', value: toolsCounts.notInstalled, color: 'var(--danger)' },
              { label: 'Not Running',   value: toolsCounts.notRunning,   color: 'var(--orange)' },
              { label: 'Unmanaged',     value: toolsCounts.unmanaged,    color: 'var(--gray-400)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--gray-600)' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: row.color, fontFamily: 'var(--mono)' }}>{row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CPU OC */}
      {vcenters.length > 1 && (
        <div className="card">
          <div className="section-header">CPU Overcommitment by vCenter</div>
          <HBarChart labels={vcNames} datasets={[{ label: 'CPU OC %', data: maxOcPerVC, backgroundColor: maxOcPerVC.map(OC_COLORS) }]} xLabel="%" />
        </div>
      )}

      {/* EOS Timeline */}
      <EOSTimeline vcenters={vcenters} />

      {/* Fleet Summary Table */}
      <div className="card">
        <div className="section-header">Fleet Summary</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>vCenter</th><th>Version</th><th>Hosts</th><th>VMs</th><th>Clusters</th>
              <th>Max CPU OC</th><th>Storage</th><th>Host Health</th><th>Tools Issues</th><th>Snapshots</th>
            </tr>
          </thead>
          <tbody>
            {vcenters.map(vc => {
              const maxOC = Math.max(...(vc.overcommitment || []).map(o => o.cpu_oc_pct || 0), 0);
              const degraded = (vc.summary?.red_hosts || 0) + (vc.summary?.yellow_hosts || 0);
              return (
                <tr key={vc.vcenter_name}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{vc.vcenter_name?.split('.')[0] || '—'}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{vc.vcenter_version || '—'}</td>
                  <td className="mono">{vc.summary?.total_hosts}</td>
                  <td className="mono">{vc.summary?.total_vms}</td>
                  <td className="mono">{vc.clusters?.length || 0}</td>
                  <td><OcBadge value={maxOC} /></td>
                  <td><MiniBar value={vc.summary?.storage_used_pct || 0} /></td>
                  <td>{degraded > 0 ? <span className="badge badge-yellow">{degraded} degraded</span> : <span className="badge badge-green"><CheckCircle size={10} /> All OK</span>}</td>
                  <td className="mono">{vc.summary?.tools_issue_count || 0}</td>
                  <td className="mono">{vc.summary?.snap_vm_count || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EOSTimeline({ vcenters }) {
  const rows = [];
  const allHosts = vcenters.flatMap(vc => vc.hosts || []);

  // vCenter rows
  vcenters.forEach(vc => {
    const major = (vc.vcenter_version || '').match(/^(\d+\.\d+)/)?.[1];
    const eosDate = VCENTER_EOS[major];
    const days = daysUntil(eosDate);
    rows.push({ label: `vCenter ${vc.vcenter_name?.split('.')[0]}`, version: vc.vcenter_version || '?', type: 'vCenter', days, eosDate });
  });

  // ESXi version rows (deduplicated)
  const esxiByVersion = {};
  allHosts.forEach(h => {
    const v = h.esxi_major || 'Unknown';
    esxiByVersion[v] = (esxiByVersion[v] || 0) + 1;
  });
  Object.entries(esxiByVersion).forEach(([ver, count]) => {
    const eosDate = ESXI_EOS[ver];
    const days = daysUntil(eosDate);
    rows.push({ label: `ESXi ${ver} (${count} hosts)`, version: ver, type: 'ESXi', days, eosDate });
  });

  if (!rows.length) return null;

  return (
    <div className="card">
      <div className="section-header">End of Support Timeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((r, i) => {
          const color = eosColor(r.days);
          const label = r.days === null ? 'Unknown' : r.days < 0 ? `EOS ${Math.abs(r.days)}d ago` : `${r.days}d remaining`;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 200, fontSize: 12, flexShrink: 0 }}>
                <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.label}</span>
                <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--gray-400)' }}>{r.eosDate || 'Unknown'}</span>
              </div>
              <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: 4, height: 18, position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: r.days !== null && r.days > 0 ? `${Math.min(100, (r.days / 730) * 100)}%` : '100%',
                  background: color, opacity: 0.8,
                }} />
              </div>
              <div style={{ width: 140, fontSize: 11, fontWeight: 600, color, flexShrink: 0 }}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Observations({ fleet, vcenters }) {
  const obs = [];
  const allClusters = vcenters.flatMap(vc => vc.overcommitment || []);
  const allHosts = vcenters.flatMap(vc => vc.hosts || []);
  const highOC = allClusters.filter(c => c.cpu_oc_pct >= 130);
  const uniqueBuilds = new Set(allHosts.map(h => h.build).filter(Boolean));

  if (highOC.length > 0) obs.push(`Reduce CPU overcommitment — ${highOC.length} cluster${highOC.length > 1 ? 's' : ''} ≥130%`);
  if (uniqueBuilds.size > 2) obs.push(`Reduce ESXi patch fragmentation — ${uniqueBuilds.size} different build levels`);
  if (fleet.tools_issues > 50) obs.push(`Mitigate VM Tools issues — ${fleet.tools_issues} VMs affected`);
  if (fleet.degraded_hosts > 0) obs.push(`Investigate ${fleet.degraded_hosts} degraded host${fleet.degraded_hosts > 1 ? 's' : ''}`);
  if (fleet.vhw_legacy > 0) obs.push(`Upgrade ${fleet.vhw_legacy} VMs on legacy virtual hardware (vmx-11 and below)`);
  if (obs.length === 0) obs.push('No critical issues detected');

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--navy)' }}>
      <div className="section-header">Observations</div>
      <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {obs.map((o, i) => <li key={i} style={{ fontSize: 12, color: 'var(--gray-700)' }}>{o}</li>)}
      </ol>
    </div>
  );
}
