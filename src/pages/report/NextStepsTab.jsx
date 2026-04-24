import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const PRIORITY = {
  critical: { icon: AlertTriangle, color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)', border: 'var(--danger)', label: 'Critical' },
  high:     { icon: AlertCircle,   color: 'var(--orange)', bg: 'rgba(249,115,22,0.08)', border: 'var(--orange)', label: 'High' },
  medium:   { icon: Info,          color: 'var(--yellow)', bg: 'rgba(245,158,11,0.08)', border: '#f59e0b',       label: 'Medium' },
  positive: { icon: CheckCircle,   color: 'var(--green)',  bg: 'rgba(34,197,94,0.08)',  border: 'var(--green)',  label: 'Good' },
};

export function NextStepsTab({ fleet, vcenters }) {
  const findings = generateFindings(fleet, vcenters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ borderLeft: '3px solid var(--navy)' }}>
        <div className="section-header">Recommended Next Steps</div>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>
          Auto-generated based on analysis of {fleet.total_hosts} hosts and {fleet.total_vms.toLocaleString()} VMs.
          Click any metric badge to see the affected items.
        </p>
      </div>

      {['critical', 'high', 'medium', 'positive'].map(priority => {
        const items = findings.filter(f => f.priority === priority);
        if (!items.length) return null;
        const cfg = PRIORITY[priority];
        const Icon = cfg.icon;
        return (
          <div key={priority}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon size={15} color={cfg.color} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, i) => (
                <FindingCard key={i} item={item} cfg={cfg} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FindingCard({ item, cfg }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = item.details && item.details.rows?.length > 0;

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderLeft: `4px solid ${cfg.border}`,
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.6 }}>{item.description}</div>
            {item.action && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: cfg.color }}>
                <ArrowRight size={12} /> {item.action}
              </div>
            )}
          </div>

          {item.metric && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {hasDetails ? (
                <button
                  onClick={() => setExpanded(e => !e)}
                  style={{
                    background: 'none', border: `1px solid ${cfg.border}`,
                    borderRadius: 6, padding: '6px 10px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                  title="Click to see affected items"
                >
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: cfg.color, lineHeight: 1 }}>
                    {item.metric}
                  </div>
                  {item.metricLabel && (
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{item.metricLabel}</div>
                  )}
                  <div style={{ color: cfg.color, marginTop: 2 }}>
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                </button>
              ) : (
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: cfg.color }}>{item.metric}</div>
                  {item.metricLabel && <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{item.metricLabel}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline drill-down table */}
      {hasDetails && expanded && (
        <div style={{ borderTop: `1px solid ${cfg.border}`, background: 'var(--bg-surface)', padding: '12px 16px' }}>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                {item.details.columns.map(col => (
                  <th key={col} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '5px 8px', fontSize: 10 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.details.rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-hover)' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)',
                      fontFamily: j > 0 ? 'var(--mono)' : 'inherit',
                      fontWeight: item.details.highlightCol === j ? 700 : 400,
                      color: item.details.colorCol === j ? colorForValue(cell) : 'inherit',
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function colorForValue(val) {
  const str = String(val).replace('%', '');
  const n = parseFloat(str);
  if (isNaN(n)) return 'inherit';
  if (n >= 200) return 'var(--status-danger)';
  if (n >= 130) return 'var(--orange)';
  if (n >= 100) return 'var(--status-warn)';
  return 'var(--status-ok)';
}

export function generateFindings(fleet, vcenters) {
  const findings = [];
  const allOC = vcenters.flatMap(vc => vc.overcommitment || []);
  const allHosts = vcenters.flatMap(vc => vc.hosts || []);
  const allClusters = vcenters.flatMap(vc => vc.clusters || []);
  const allVMs = vcenters.flatMap(vc => vc.vms || []).filter(v => v.is_template !== 'Yes');
  const allBuilds = new Set(allHosts.map(h => h.build).filter(Boolean));

  // ── Critical ─────────────────────────────────────────────────────────────
  const criticalOC = allOC.filter(o => o.cpu_oc_pct >= 200)
    .sort((a, b) => (b.cpu_oc_pct || 0) - (a.cpu_oc_pct || 0));
  if (criticalOC.length > 0) {
    findings.push({
      priority: 'critical',
      title: 'CPU Overcommitment Critical — Immediate Risk',
      description: `${criticalOC.length} cluster${criticalOC.length > 1 ? 's' : ''} exceed 200% CPU overcommit. At this level, CPU ready times are high, performance is degraded, and workloads compete for physical resources. This directly impacts SLAs.`,
      action: 'Review cluster load, migrate VMs across clusters, or add capacity',
      metric: `${Math.max(...criticalOC.map(o => o.cpu_oc_pct)).toFixed(0)}%`,
      metricLabel: 'Max CPU OC',
      details: {
        columns: ['Cluster', 'Hosts', 'VMs', 'CPU OC%', 'RAM OC%'],
        highlightCol: 3,
        colorCol: 3,
        rows: criticalOC.map(o => [
          o.cluster_name || o.cluster_key || '—',
          o.host_count ?? '—',
          o.vm_count ?? '—',
          `${(o.cpu_oc_pct || 0).toFixed(0)}%`,
          `${(o.mem_oc_pct || 0).toFixed(0)}%`,
        ]),
      },
    });
  }

  const redHosts = allHosts.filter(h => (h.overall_status || '').toLowerCase() === 'red');
  if (redHosts.length > 0) {
    findings.push({
      priority: 'critical',
      title: `${redHosts.length} Host${redHosts.length > 1 ? 's' : ''} in RED Health Status`,
      description: 'Hosts in RED status have active hardware or configuration faults. These require immediate investigation via vCenter alarms and hardware event logs. Silent failures can escalate to outages.',
      action: 'Check vCenter alarms, hardware event log (iDRAC/iLO), and storage connectivity',
      metric: redHosts.length,
      metricLabel: 'Red Hosts',
      details: {
        columns: ['Host', 'Cluster', 'Model', 'Status'],
        rows: redHosts.map(h => [
          h.name || '—',
          h.cluster || '—',
          h.model || '—',
          h.overall_status || '—',
        ]),
      },
    });
  }

  // ── High ──────────────────────────────────────────────────────────────────
  const highOC = allOC.filter(o => o.cpu_oc_pct >= 130 && o.cpu_oc_pct < 200)
    .sort((a, b) => (b.cpu_oc_pct || 0) - (a.cpu_oc_pct || 0));
  if (highOC.length > 0) {
    findings.push({
      priority: 'high',
      title: 'Elevated CPU Overcommitment in Multiple Clusters',
      description: `${highOC.length} cluster${highOC.length > 1 ? 's' : ''} between 130–200% CPU overcommit. Industry safe threshold is 80–100%. These clusters need monitoring and capacity planning before adding more workloads.`,
      action: 'Enable DRS (if not active), review vCPU sizing, implement CPU resource pools',
      metric: `${highOC.length}`,
      metricLabel: 'Clusters',
      details: {
        columns: ['Cluster', 'Hosts', 'VMs', 'CPU OC%', 'RAM OC%', 'DRS'],
        highlightCol: 3,
        colorCol: 3,
        rows: highOC.map(o => [
          o.cluster_name || o.cluster_key || '—',
          o.host_count ?? '—',
          o.vm_count ?? '—',
          `${(o.cpu_oc_pct || 0).toFixed(0)}%`,
          `${(o.mem_oc_pct || 0).toFixed(0)}%`,
          o.drs_enabled ? '✓' : '✗',
        ]),
      },
    });
  }

  if (allBuilds.size > 2) {
    // Group hosts by build
    const buildMap = {};
    allHosts.forEach(h => {
      const b = h.build || 'Unknown';
      if (!buildMap[b]) buildMap[b] = [];
      buildMap[b].push(h);
    });
    const buildRows = Object.entries(buildMap)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([build, hosts]) => [build, hosts.length, hosts.map(h => h.name).slice(0, 3).join(', ') + (hosts.length > 3 ? ` +${hosts.length - 3} more` : '')]);

    findings.push({
      priority: 'high',
      title: 'ESXi Patch Fragmentation — Security Exposure',
      description: `${allBuilds.size} different ESXi build levels across the fleet. Inconsistent patching means some hosts carry known CVEs while others are patched. This complicates operations and supportability.`,
      action: 'Standardize all hosts to the latest ESXi 8.0.x build in each cluster',
      metric: allBuilds.size,
      metricLabel: 'Build Levels',
      details: {
        columns: ['Build', 'Hosts', 'Examples'],
        rows: buildRows,
      },
    });
  }

  if (fleet.tools_issues > 0) {
    const pct = ((fleet.tools_issues / fleet.total_vms) * 100).toFixed(1);
    const toolsVMs = allVMs
      .filter(v => v.tools_status && !['toolsOk', 'guestToolsCurrent', 'toolsCurrent'].includes(v.tools_status))
      .sort((a, b) => (a.tools_status || '').localeCompare(b.tools_status || ''))
      .slice(0, 50);
    findings.push({
      priority: 'high',
      title: 'VM Tools Issues — Quiesced Backup & Monitoring at Risk',
      description: `${fleet.tools_issues} VMs (${pct}%) have VM Tools not installed, outdated, or not running. This blocks quiesced snapshots (backup integrity), degrades performance visibility, and prevents graceful shutdown during maintenance.`,
      action: 'Deploy/upgrade VM Tools via Lifecycle Manager or SCCM/Ansible automation',
      metric: fleet.tools_issues,
      metricLabel: 'VMs Affected',
      details: {
        columns: ['VM', 'Tools Status', 'Host', 'Cluster'],
        rows: toolsVMs.map(v => [
          v.name || '—',
          v.tools_status || '—',
          v.host || '—',
          v.cluster || '—',
        ]),
      },
    });
  }

  const noEVC = allClusters.filter(c => !c.evc_mode || c.evc_mode === '' || c.evc_mode === 'None' || c.evc_mode === 'n/a');
  if (noEVC.length > 3) {
    findings.push({
      priority: 'high',
      title: 'No EVC Mode Configured on Most Clusters',
      description: `${noEVC.length} clusters have no EVC mode. Without EVC, vMotion across hosts with different CPU microcode generations may fail silently or produce CPU incompatibility errors during DRS or HA failover.`,
      action: 'Configure EVC at the lowest common CPU baseline per cluster to ensure vMotion compatibility',
      metric: noEVC.length,
      metricLabel: 'Clusters',
      details: {
        columns: ['Cluster', 'EVC Mode', 'HA', 'DRS'],
        rows: noEVC.map(c => [
          c.name || '—',
          c.evc_mode || 'None',
          c.ha_enabled === 'True' || c.ha_enabled === '1' ? '✓' : '✗',
          c.drs_enabled === 'True' || c.drs_enabled === '1' ? '✓' : '✗',
        ]),
      },
    });
  }

  // ── Medium ────────────────────────────────────────────────────────────────
  if (fleet.vhw_legacy > 0) {
    const legacyVMs = allVMs
      .filter(v => {
        const ver = parseInt((v.hw_version || '').replace('vmx-', ''));
        return !isNaN(ver) && ver <= 11;
      })
      .sort((a, b) => {
        const va = parseInt((a.hw_version || '').replace('vmx-', '')) || 99;
        const vb = parseInt((b.hw_version || '').replace('vmx-', '')) || 99;
        return va - vb;
      })
      .slice(0, 50);
    findings.push({
      priority: 'medium',
      title: 'Legacy Virtual Hardware Versions',
      description: `${fleet.vhw_legacy} VMs on vmx-11 or below miss modern features: NVME controllers, 4K sector support, RDMA, and hot-plug capabilities. These also limit maximum vCPU/RAM allocations.`,
      action: 'Schedule vHW upgrades during the next maintenance window (requires VM restart)',
      metric: fleet.vhw_legacy,
      metricLabel: 'VMs',
      details: {
        columns: ['VM', 'vHW Version', 'Host', 'Cluster'],
        rows: legacyVMs.map(v => [
          v.name || '—',
          v.hw_version || '—',
          v.host || '—',
          v.cluster || '—',
        ]),
      },
    });
  }

  const thinSavings = vcenters.reduce((s, vc) => s + (vc.thin_info?.unused_gb || 0), 0);
  if (thinSavings > 100) {
    findings.push({
      priority: 'medium',
      title: `Thin Provisioning Opportunity — ${(thinSavings / 1024).toFixed(0)} TB Reclaimable`,
      description: `Most VMs use thick provisioning, reserving ${(thinSavings / 1024).toFixed(0)} TB of storage that is assigned but unused. Thin provisioning would allow this capacity to be reallocated without hardware investment.`,
      action: 'Migrate new VMs to thin provisioning; use Storage vMotion to convert existing thick VMs',
      metric: `${(thinSavings / 1024).toFixed(0)} TB`,
      metricLabel: 'Recoverable',
      details: {
        columns: ['vCenter', 'Thick VMs', 'Thin VMs', 'Potential Savings'],
        rows: vcenters
          .filter(vc => vc.thin_info?.unused_gb > 0)
          .map(vc => [
            vc.vcenter_name || '—',
            vc.summary?.thick_vm_count ?? '—',
            vc.summary?.thin_vm_count ?? '—',
            `${((vc.thin_info?.unused_gb || 0) / 1024).toFixed(1)} TB`,
          ]),
      },
    });
  }

  if (fleet.snap_count > 5) {
    const snapVMs = allVMs
      .filter(v => v.snap_count > 0)
      .sort((a, b) => (b.snap_count || 0) - (a.snap_count || 0))
      .slice(0, 30);
    findings.push({
      priority: 'medium',
      title: 'Active Snapshots Detected',
      description: `${fleet.snap_count} VMs have active snapshots. Snapshots consume growing amounts of disk space over time and degrade VM I/O performance. Long-lived snapshots are a common cause of datastore exhaustion.`,
      action: 'Review and delete snapshots older than 7 days; implement snapshot policy enforcement',
      metric: fleet.snap_count,
      metricLabel: 'Snap VMs',
      details: {
        columns: ['VM', 'Snapshots', 'Cluster', 'Host'],
        rows: snapVMs.map(v => [
          v.name || '—',
          v.snap_count ?? '—',
          v.cluster || '—',
          v.host || '—',
        ]),
      },
    });
  }

  const yellowHosts = allHosts.filter(h => (h.overall_status || '').toLowerCase() === 'yellow');
  if (yellowHosts.length > 0) {
    findings.push({
      priority: 'medium',
      title: `${yellowHosts.length} Hosts in Degraded (YELLOW) Status`,
      description: 'YELLOW hosts have warnings that do not prevent operation but indicate potential issues — degraded storage paths, hardware alerts, or configuration drift. Left unresolved, these can escalate.',
      action: 'Investigate vCenter alarms per host; check storage multipath status and hardware health',
      metric: yellowHosts.length,
      metricLabel: 'Yellow Hosts',
      details: {
        columns: ['Host', 'Cluster', 'Model', 'ESXi Build'],
        rows: yellowHosts.map(h => [
          h.name || '—',
          h.cluster || '—',
          h.model || '—',
          h.build || '—',
        ]),
      },
    });
  }

  // ── Positive ──────────────────────────────────────────────────────────────
  const haEnabled = allClusters.filter(c => c.ha_enabled === 'True' || c.ha_enabled === '1').length;
  if (haEnabled === allClusters.length && allClusters.length > 0) {
    findings.push({
      priority: 'positive',
      title: 'HA Enabled on All Clusters',
      description: `All ${allClusters.length} clusters have High Availability configured. VM restart on host failure is guaranteed across the entire estate.`,
    });
  }

  const uniqueESXiVersions = new Set(allHosts.map(h => h.esxi_major).filter(Boolean));
  if (uniqueESXiVersions.size === 1 && allHosts[0]?.esxi_major?.startsWith('8')) {
    findings.push({
      priority: 'positive',
      title: 'Homogeneous vSphere 8 Fleet',
      description: 'All hosts run ESXi 8.0.x — no version fragmentation, no end-of-life ESXi 6.x in the estate. This simplifies operations and ensures access to latest features and security patches.',
    });
  }

  const totalVMotions = allClusters.reduce((s, c) => s + (c.num_vmotions || 0), 0);
  if (totalVMotions > 10000) {
    findings.push({
      priority: 'positive',
      title: 'High VM Mobility — DRS Active',
      description: `${totalVMotions.toLocaleString()} vMotion operations recorded. DRS is effectively load-balancing across the fleet, indicating healthy cluster configuration.`,
      metric: totalVMotions.toLocaleString(),
      metricLabel: 'vMotions',
    });
  }

  return findings;
}
