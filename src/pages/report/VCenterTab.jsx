import { useState } from 'react';
import { DonutChart, HBarChart, VBarChart, COLORS, OC_COLORS, STORAGE_COLOR, VHW_COLORS, GaugeBar } from '../../components/report/charts.jsx';
import { OcBadge, HealthBadge, StorageBadge, ToolsBadge, MiniBar, StatusDot } from '../../components/report/StatusBadge.jsx';
import { AlertTriangle, CheckCircle, Server, Cpu, Database, Monitor, HardDrive, ChevronRight, ArrowLeft } from 'lucide-react';

const SUBTABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'clusters', label: 'Clusters' },
  { id: 'hosts', label: 'Hosts' },
  { id: 'vms', label: 'VMs & OS' },
  { id: 'storage', label: 'Storage' },
  { id: 'lifecycle', label: 'Lifecycle' },
];

export function VCenterTab({ vc, allVCs }) {
  const [subTab, setSubTab] = useState('overview');
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedHost, setSelectedHost] = useState(null);

  // Drill-through: host detail
  if (selectedHost) {
    return (
      <HostDetail
        host={selectedHost}
        vms={(vc.vms || []).filter(v => v.host === selectedHost.name || v.cluster === selectedHost.cluster)}
        onBack={() => setSelectedHost(null)}
      />
    );
  }

  // Drill-through: cluster detail
  if (selectedCluster) {
    const clusterHosts = (vc.hosts || []).filter(h => h.cluster === selectedCluster.name);
    const clusterVMs = (vc.vms || []).filter(v => v.cluster === selectedCluster.name && v.is_template !== 'Yes');
    const ocEntry = (vc.overcommitment || []).find(o =>
      o.cluster_key === selectedCluster.name || selectedCluster.name.includes(o.cluster_key)
    );
    const usageEntry = (vc.usage || []).find(o =>
      o.cluster_key === selectedCluster.name || selectedCluster.name.includes(o.cluster_key)
    );

    return (
      <ClusterDetail
        cluster={selectedCluster}
        hosts={clusterHosts}
        vms={clusterVMs}
        oc={ocEntry}
        usage={usageEntry}
        onBack={() => setSelectedCluster(null)}
        onSelectHost={setSelectedHost}
      />
    );
  }

  return (
    <div>
      {/* vCenter header */}
      <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg,var(--navy) 0%,var(--teal) 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{vc.vcenter_name}</h2>
            <p style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
              vCenter {vc.vcenter_version} · Build {vc.vcenter_build} ·
              Source: {vc.source?.toUpperCase()}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '8px 20px', textAlign: 'right' }}>
            {[
              { v: vc.summary?.total_hosts, l: 'Hosts' },
              { v: vc.summary?.total_vms, l: 'VMs' },
              { v: vc.clusters?.length, l: 'Clusters' },
              { v: `${(vc.summary?.total_storage_gb/1024||0).toFixed(0)} TB`, l: 'Storage' },
            ].map(k => (
              <div key={k.l}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)' }}>{k.v}</div>
                <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase' }}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '2px solid var(--gray-200)', marginBottom: 16,
      }}>
        {SUBTABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              padding: '9px 16px', fontSize: 12, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: subTab === tab.id ? 'var(--navy)' : 'var(--gray-500)',
              borderBottom: subTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && <OverviewSubTab vc={vc} />}
      {subTab === 'clusters' && <ClustersSubTab vc={vc} onSelectCluster={setSelectedCluster} />}
      {subTab === 'hosts' && <HostsSubTab vc={vc} onSelectHost={setSelectedHost} onSelectCluster={setSelectedCluster} />}
      {subTab === 'vms' && <VMsSubTab vc={vc} />}
      {subTab === 'storage' && <StorageSubTab vc={vc} />}
      {subTab === 'lifecycle' && <LifecycleSubTab vc={vc} />}
    </div>
  );
}

// ── Overview Sub-tab ──────────────────────────────────────────────────────────

function OverviewSubTab({ vc }) {
  const s = vc.summary || {};
  const maxOC = Math.max(...(vc.overcommitment || []).map(o => o.cpu_oc_pct || 0), 0);
  const maxMemOC = Math.max(...(vc.overcommitment || []).map(o => o.mem_oc_pct || 0), 0);

  // vHW distribution
  const vhwEntries = Object.entries(vc.vhw_dist || {}).sort((a, b) => {
    const n = (s) => parseInt(s.replace(/\D/g, '')) || 0;
    return n(a[0]) - n(b[0]);
  });
  const vhwColors = vhwEntries.map(([k]) => VHW_COLORS[k] || COLORS.teal);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Gauges row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card">
          <div className="section-header">CPU Overcommitment</div>
          <GaugeBar value={maxOC} max={250} color={OC_COLORS(maxOC)} label="Peak cluster" sublabel="%" />
          <OcBadge value={maxOC} />
        </div>
        <div className="card">
          <div className="section-header">Memory Overcommitment</div>
          <GaugeBar value={maxMemOC} max={200} color={OC_COLORS(maxMemOC)} label="Peak cluster" sublabel="%" />
          <OcBadge value={maxMemOC} />
        </div>
        <div className="card">
          <div className="section-header">Storage Utilization</div>
          <GaugeBar value={s.storage_used_pct || 0} color={STORAGE_COLOR(s.storage_used_pct || 0)} label="Used" sublabel="%" />
          <StorageBadge pct={s.storage_used_pct || 0} />
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { v: s.total_vcpus, l: 'vCPUs' },
          { v: `${(s.total_vram_gb || 0).toFixed(0)} GB`, l: 'vRAM' },
          { v: s.thin_vm_count, l: 'Thin VMs' },
          { v: s.thick_vm_count, l: 'Thick VMs' },
          { v: s.snap_vm_count, l: 'Snap VMs' },
          { v: s.swapped_vm_count, l: 'Swapped VMs' },
          { v: `${(s.vm_to_core_ratio || 0).toFixed(2)}`, l: 'VM:Core' },
          { v: `${(s.vcpu_to_core_ratio || 0).toFixed(2)}`, l: 'vCPU:Core' },
        ].map(k => (
          <div key={k.l} className="stat-pill">
            <span className="value">{k.v ?? '—'}</span>
            <span className="label">{k.l}</span>
          </div>
        ))}
      </div>

      {/* Host health + vHW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">Host Health</div>
          <DonutChart
            labels={['Green', 'Yellow', 'Red']}
            data={[s.total_hosts - s.red_hosts - s.yellow_hosts, s.yellow_hosts || 0, s.red_hosts || 0]}
            colors={[COLORS.green, COLORS.yellow, COLORS.danger]}
            size={120}
            centerText={{ value: s.total_hosts, label: 'Hosts' }}
          />
        </div>
        <div className="card">
          <div className="section-header">Virtual HW Versions</div>
          <DonutChart
            labels={vhwEntries.map(([k]) => k)}
            data={vhwEntries.map(([, v]) => v)}
            colors={vhwColors}
            size={120}
            centerText={{ value: s.total_vms, label: 'VMs' }}
          />
        </div>
      </div>

      {/* Top consumers */}
      {(vc.top_cpu_vms?.length > 0 || vc.top_ram_vms?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="section-header">Top CPU Consumers</div>
            <table className="data-table">
              <thead><tr><th>VM</th><th>Cluster</th><th>MHz</th></tr></thead>
              <tbody>
                {(vc.top_cpu_vms || []).slice(0, 8).map(vm => (
                  <tr key={vm.name}>
                    <td style={{ fontSize: 11, fontWeight: 600 }}>{vm.name}</td>
                    <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>{vm.cluster?.split('-')[0] || '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{vm.cpu_usage_mhz.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="section-header">Top RAM Consumers</div>
            <table className="data-table">
              <thead><tr><th>VM</th><th>Cluster</th><th>MB</th></tr></thead>
              <tbody>
                {(vc.top_ram_vms || []).slice(0, 8).map(vm => (
                  <tr key={vm.name}>
                    <td style={{ fontSize: 11, fontWeight: 600 }}>{vm.name}</td>
                    <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>{vm.cluster?.split('-')[0] || '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{vm.ram_usage_mb.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Clusters Sub-tab ─────────────────────────────────────────────────────────

function ClustersSubTab({ vc, onSelectCluster }) {
  const clusterNames = (vc.clusters || []).map(c => c.name.split('-')[0]);
  const cpuOC = (vc.clusters || []).map(c => c.cpu_oc_pct || 0);
  const memOC = (vc.clusters || []).map(c => c.mem_oc_pct || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">CPU Overcommitment by Cluster</div>
          <HBarChart
            labels={clusterNames}
            datasets={[{ label: 'CPU OC %', data: cpuOC, backgroundColor: cpuOC.map(OC_COLORS) }]}
            xLabel="%"
          />
        </div>
        <div className="card">
          <div className="section-header">Memory Overcommitment by Cluster</div>
          <HBarChart
            labels={clusterNames}
            datasets={[{ label: 'Mem OC %', data: memOC, backgroundColor: memOC.map(OC_COLORS) }]}
            xLabel="%"
          />
        </div>
      </div>

      <div className="card">
        <div className="section-header">Cluster Details</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cluster</th>
              <th>Hosts</th>
              <th>VMs</th>
              <th>CPU OC%</th>
              <th>Mem OC%</th>
              <th>HA</th>
              <th>DRS</th>
              <th>EVC</th>
              <th>vSAN</th>
              <th>vMotions</th>
              <th>Total RAM</th>
            </tr>
          </thead>
          <tbody>
            {(vc.clusters || []).map(c => (
              <tr
                key={c.name}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectCluster(c)}
              >
                <td style={{ fontWeight: 600, color: 'var(--navy)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.name.split('-')[0]} <ChevronRight size={11} color="var(--gray-300)" />
                  </span>
                </td>
                <td className="mono">{c.num_hosts}</td>
                <td className="mono">{c.num_vms}</td>
                <td><OcBadge value={c.cpu_oc_pct || 0} /></td>
                <td><OcBadge value={c.mem_oc_pct || 0} /></td>
                <td>{c.ha_enabled === 'True' || c.ha_enabled === '1' ? <span className="badge badge-green">On</span> : <span className="badge badge-red">Off</span>}</td>
                <td>{c.drs_enabled === 'True' || c.drs_enabled === '1' ? <span className="badge badge-green">On</span> : <span className="badge badge-gray">Off</span>}</td>
                <td style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{c.evc_mode || '—'}</td>
                <td>{c.vsan_enabled === 'True' ? <span className="badge badge-navy">On</span> : '—'}</td>
                <td className="mono">{(c.num_vmotions || 0).toLocaleString()}</td>
                <td className="mono">{((c.total_memory_mb || 0) / 1024).toFixed(0)} GB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Hosts Sub-tab ─────────────────────────────────────────────────────────────

function HostsSubTab({ vc, onSelectHost, onSelectCluster }) {
  const [filterCluster, setFilterCluster] = useState('');
  const clusters = [...new Set((vc.hosts || []).map(h => h.cluster).filter(Boolean))];

  const hosts = [...(vc.hosts || [])]
    .filter(h => !filterCluster || h.cluster === filterCluster)
    .sort((a, b) => {
      const order = { RED: 0, YELLOW: 1, GREEN: 2 };
      return (order[a.overall_status] ?? 3) - (order[b.overall_status] ?? 3);
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select
          value={filterCluster}
          onChange={e => setFilterCluster(e.target.value)}
          style={{ padding: '6px 10px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: 12, outline: 'none' }}
        >
          <option value="">All Clusters ({vc.hosts?.length || 0} hosts)</option>
          {clusters.map(c => (
            <option key={c} value={c}>{c.split('-')[0]} ({(vc.hosts || []).filter(h => h.cluster === c).length} hosts)</option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{hosts.length} hosts shown</span>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Host</th>
              <th>Cluster</th>
              <th>Model</th>
              <th>CPU</th>
              <th>Cores</th>
              <th>RAM GB</th>
              <th>CPU%</th>
              <th>RAM%</th>
              <th>Build</th>
              <th>VMs</th>
              <th>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {hosts.slice(0, 100).map(h => (
              <tr
                key={h.name}
                className={h.overall_status === 'RED' ? 'status-red' : h.overall_status === 'YELLOW' ? 'status-yellow' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectHost(h)}
              >
                <td><StatusDot status={h.overall_status} /></td>
                <td style={{ fontWeight: 600, fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {h.name.split('.')[0]} <ChevronRight size={10} color="var(--gray-300)" />
                  </span>
                </td>
                <td
                  style={{ fontSize: 11, color: 'var(--teal)', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); onSelectCluster({ name: h.cluster }); }}
                >
                  {h.cluster?.split('-')[0] || '—'}
                </td>
                <td style={{ fontSize: 11 }}>{h.model?.replace('PowerEdge ', 'PE ') || '—'}</td>
                <td style={{ fontSize: 10, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.cpu_type?.replace(/Intel.*Xeon/, 'Xeon') || '—'}
                </td>
                <td className="mono">{h.cores}</td>
                <td className="mono">{h.ram_gb?.toFixed(0)}</td>
                <td style={{ minWidth: 90 }}><MiniBar value={h.cpu_usage_pct || 0} /></td>
                <td style={{ minWidth: 90 }}><MiniBar value={h.ram_usage_pct || 0} /></td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>
                  {h.build || '—'}
                  {h.build && h.build.startsWith('24') ? '' : <span className="badge badge-yellow" style={{ marginLeft: 4, fontSize: 9 }}>old</span>}
                </td>
                <td className="mono">{h.total_vms}</td>
                <td style={{ fontSize: 11 }}>
                  {h.uptime_sec > 0 ? `${Math.floor(h.uptime_sec / 86400)}d` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hosts.length > 100 && (
          <p style={{ fontSize: 11, color: 'var(--gray-400)', padding: '8px 10px' }}>
            Showing 100 of {hosts.length} hosts
          </p>
        )}
      </div>
    </div>
  );
}

// ── VMs & OS Sub-tab ──────────────────────────────────────────────────────────

function VMsSubTab({ vc }) {
  // OS distribution
  const topOS = Object.entries(vc.os_dist || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // vCPU distribution
  const vcpuEntries = Object.entries(vc.vcpu_dist || {})
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .slice(0, 12);

  // vHW distribution
  const vhwEntries = Object.entries(vc.vhw_dist || {})
    .sort((a, b) => {
      const n = (s) => parseInt(s.replace(/\D/g, '')) || 0;
      return n(a[0]) - n(b[0]);
    });

  // Tools breakdown
  const tools = { ok: 0, old: 0, notInstalled: 0, notRunning: 0 };
  (vc.vms || []).filter(v => v.is_template !== 'Yes').forEach(v => {
    const s = v.tools_status;
    if (s === 'toolsOk' || s === 'guestToolsCurrent') tools.ok++;
    else if (s === 'toolsOld') tools.old++;
    else if (s === 'toolsNotInstalled') tools.notInstalled++;
    else if (s === 'toolsNotRunning') tools.notRunning++;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* OS + vCPU */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">OS Distribution</div>
          <table className="data-table">
            <thead><tr><th>Guest OS</th><th>Count</th><th>%</th></tr></thead>
            <tbody>
              {topOS.map(([os, count]) => (
                <tr key={os}>
                  <td style={{ fontSize: 11 }}>{os}</td>
                  <td className="mono">{count}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="mini-bar" style={{ width: 60 }}>
                        <div className="mini-bar-fill" style={{
                          width: `${(count / (vc.summary?.total_vms || 1) * 100).toFixed(0)}%`,
                          background: 'var(--teal)'
                        }} />
                      </div>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>
                        {(count / (vc.summary?.total_vms || 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="section-header">vCPU Distribution</div>
          <VBarChart
            labels={vcpuEntries.map(([k]) => k)}
            datasets={[{ label: 'VMs', data: vcpuEntries.map(([, v]) => v), backgroundColor: COLORS.navy }]}
            height={180}
          />
        </div>
      </div>

      {/* vHW versions */}
      <div className="card">
        <div className="section-header">Virtual Hardware Versions</div>
        {vhwEntries.some(([k]) => {
          const n = parseInt(k.replace(/\D/g, ''));
          return n <= 11;
        }) && (
          <div className="alert alert-yellow" style={{ marginBottom: 12 }}>
            Legacy vHW versions detected — upgrade recommended during next maintenance window
          </div>
        )}
        <HBarChart
          labels={vhwEntries.map(([k]) => k)}
          datasets={[{
            label: 'VMs',
            data: vhwEntries.map(([, v]) => v),
            backgroundColor: vhwEntries.map(([k]) => VHW_COLORS[k] || COLORS.gray),
          }]}
          height={vhwEntries.length * 28}
          xLabel=" VMs"
        />
      </div>

      {/* VM Tools */}
      <div className="card">
        <div className="section-header">VM Tools Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { v: tools.ok, l: 'OK / Current', c: 'var(--green)' },
            { v: tools.old, l: 'Need Upgrade', c: 'var(--yellow)' },
            { v: tools.notInstalled, l: 'Not Installed', c: 'var(--danger)' },
            { v: tools.notRunning, l: 'Not Running', c: 'var(--orange)' },
          ].map(k => (
            <div key={k.l} style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: k.c }}>{k.v}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{k.l}</div>
            </div>
          ))}
        </div>
        {vc.tools_issues?.length > 0 && (
          <table className="data-table">
            <thead><tr><th>VM</th><th>Cluster</th><th>Tools Status</th><th>Power</th></tr></thead>
            <tbody>
              {vc.tools_issues.slice(0, 20).map(vm => (
                <tr key={vm.name}>
                  <td style={{ fontWeight: 600, fontSize: 11 }}>{vm.name}</td>
                  <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>{vm.cluster?.split('-')[0] || '—'}</td>
                  <td><ToolsBadge status={vm.tools_status} /></td>
                  <td style={{ fontSize: 11 }}>{vm.power_state === 'POWERED_ON' ? '🟢' : '⚫'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Snapshots */}
      <div className="card">
        <div className="section-header">VMs with Snapshots</div>
        {vc.snap_vms?.length === 0 ? (
          <p style={{ color: 'var(--green)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={14} /> No VMs with snapshots
          </p>
        ) : (
          <table className="data-table">
            <thead><tr><th>VM</th><th>Cluster</th><th>Snapshots</th><th>Power</th></tr></thead>
            <tbody>
              {(vc.snap_vms || []).map(vm => (
                <tr key={vm.name}>
                  <td style={{ fontWeight: 600, fontSize: 11 }}>{vm.name}</td>
                  <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>{vm.cluster?.split('-')[0] || '—'}</td>
                  <td><span className="badge badge-orange">{vm.snapshots}</span></td>
                  <td style={{ fontSize: 11 }}>{vm.power_state === 'POWERED_ON' ? '🟢' : '⚫'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Storage Sub-tab ───────────────────────────────────────────────────────────

function StorageSubTab({ vc }) {
  const thinInfo = vc.thin_info || {};
  const totalComp = (vc.compression || []).reduce((s, c) => s + (c.compressed_mb || 0), 0);
  const topDS = (vc.datastores || []).slice(0, 30);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="card">
          <div className="section-header">Thin Provisioning</div>
          {thinInfo.assigned_gb ? (
            <>
              {[
                { l: 'Assigned', v: `${thinInfo.assigned_gb?.toFixed(0)} GB` },
                { l: 'Used', v: `${thinInfo.used_gb?.toFixed(0)} GB` },
                { l: 'Unused (recoverable)', v: `${thinInfo.unused_gb?.toFixed(0)} GB`, highlight: true },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 12 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{r.l}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: r.highlight ? 'var(--teal)' : 'var(--navy)' }}>{r.v}</span>
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: 'var(--gray-400)', fontSize: 12 }}>No thin provisioning data available</p>
          )}
        </div>
        <div className="card">
          <div className="section-header">Storage Summary</div>
          <GaugeBar
            value={vc.summary?.storage_used_pct || 0}
            color={STORAGE_COLOR(vc.summary?.storage_used_pct || 0)}
            label="Used"
            sublabel="%"
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>
                {((vc.summary?.total_storage_gb || 0)/1024).toFixed(1)} TB
              </div>
              <div style={{ color: 'var(--gray-400)', fontSize: 10 }}>Total</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
                {((vc.summary?.used_storage_gb || 0)/1024).toFixed(1)} TB
              </div>
              <div style={{ color: 'var(--gray-400)', fontSize: 10 }}>Used</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="section-header">Memory Compression</div>
          {totalComp > 0 ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--orange)' }}>
                {totalComp.toFixed(0)} MB
              </div>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Compressed memory across fleet</p>
              {(vc.compression || []).filter(c => c.compressed_mb > 0).map(c => (
                <div key={c.cluster_key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                  <span style={{ color: 'var(--gray-600)' }}>{c.cluster_key?.split('-')[0]}</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{c.compressed_mb.toFixed(0)} MB</span>
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: 'var(--green)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> No memory compression — healthy
            </p>
          )}
        </div>
      </div>

      {/* Datastores */}
      <div className="card">
        <div className="section-header">Datastore Utilization (sorted by usage)</div>
        <table className="data-table">
          <thead>
            <tr><th>Datastore</th><th>Type</th><th>VMFS</th><th>Used GB</th><th>Total GB</th><th>Utilization</th><th>VMs</th></tr>
          </thead>
          <tbody>
            {topDS.map(ds => (
              <tr key={ds.name}>
                <td style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</td>
                <td style={{ fontSize: 11 }}>{ds.fs_type}</td>
                <td style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{ds.vmfs_version || '—'}</td>
                <td className="mono">{ds.used_gb.toFixed(0)}</td>
                <td className="mono">{ds.total_gb.toFixed(0)}</td>
                <td style={{ minWidth: 120 }}><MiniBar value={ds.used_pct} /></td>
                <td className="mono">{ds.num_vms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DVS */}
      {vc.dvs?.length > 0 && (
        <div className="card">
          <div className="section-header">Distributed Switches</div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Version</th><th>Hosts</th><th>VMs</th></tr></thead>
            <tbody>
              {vc.dvs.map(d => (
                <tr key={d.name}>
                  <td style={{ fontWeight: 600, fontSize: 11 }}>{d.name}</td>
                  <td style={{ fontSize: 11 }}>{d.type}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{d.version}</td>
                  <td className="mono">{d.num_hosts}</td>
                  <td className="mono">{d.vm_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Lifecycle Sub-tab ─────────────────────────────────────────────────────────

function LifecycleSubTab({ vc }) {
  const allHosts = vc.hosts || [];
  const buildDist = vc.build_dist || {};
  const totalHosts = allHosts.length;

  // ESXi EOS: group by date
  const eosDist = {};
  allHosts.forEach(h => {
    const d = h.eos_date || 'Unknown';
    eosDist[d] = (eosDist[d] || 0) + 1;
  });

  // BIOS versions (if RVTools data present)
  const hasBIOS = allHosts.some(h => h.bios_version);
  const biosDist = {};
  if (hasBIOS) {
    allHosts.forEach(h => {
      if (h.bios_version) {
        biosDist[h.bios_version] = (biosDist[h.bios_version] || 0) + 1;
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* vCenter Lifecycle */}
        <div className="card">
          <div className="section-header">vCenter Lifecycle</div>
          <table className="data-table">
            <tbody>
              <tr><td style={{ color: 'var(--gray-500)' }}>Version</td><td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{vc.vcenter_version}</td></tr>
              <tr><td style={{ color: 'var(--gray-500)' }}>Build</td><td style={{ fontFamily: 'var(--mono)' }}>{vc.vcenter_build}</td></tr>
              <tr><td style={{ color: 'var(--gray-500)' }}>End of Support</td>
                <td>
                  <span className={`badge ${vc.vcenter_eos ? 'badge-navy' : 'badge-gray'}`}>
                    {vc.vcenter_eos || 'Unknown'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ESXi Build Distribution */}
        <div className="card">
          <div className="section-header">ESXi Build Distribution</div>
          {Object.keys(buildDist).length > 1 && (
            <div className="alert alert-yellow" style={{ marginBottom: 8 }}>
              {Object.keys(buildDist).length} patch levels — inconsistent patching
            </div>
          )}
          <table className="data-table">
            <thead><tr><th>Build</th><th>Hosts</th><th>%</th></tr></thead>
            <tbody>
              {Object.entries(buildDist).sort((a, b) => b[1] - a[1]).map(([build, count]) => (
                <tr key={build}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{build}</td>
                  <td className="mono">{count}</td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>{(count/totalHosts*100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ESXi EOS Timeline */}
      <div className="card">
        <div className="section-header">ESXi End of Support Timeline</div>
        <table className="data-table">
          <thead><tr><th>EOS Date</th><th>Hosts</th><th>Version</th><th>Status</th></tr></thead>
          <tbody>
            {Object.entries(eosDist).sort().map(([date, count]) => {
              const eosVersion = Object.entries({
                '6.0': '2022-03-12', '6.5': '2023-10-15', '6.7': '2022-10-15',
                '7.0': '2025-04-02', '8.0': '2027-10-11',
              }).find(([, d]) => d === date)?.[0] || '';
              const isPast = date < '2026-01-01';
              return (
                <tr key={date}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{date}</td>
                  <td className="mono">{count}</td>
                  <td style={{ fontSize: 11 }}>{eosVersion ? `ESXi ${eosVersion}` : '—'}</td>
                  <td>
                    {isPast
                      ? <span className="badge badge-red">EOS Reached</span>
                      : <span className="badge badge-green">Supported</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BIOS versions (RVTools only) */}
      {hasBIOS && (
        <div className="card">
          <div className="section-header">BIOS Versions <span className="badge badge-navy" style={{ marginLeft: 8, fontSize: 10 }}>RVTools</span></div>
          <table className="data-table">
            <thead><tr><th>BIOS Version</th><th>Hosts</th></tr></thead>
            <tbody>
              {Object.entries(biosDist).sort((a, b) => b[1] - a[1]).map(([v, c]) => (
                <tr key={v}><td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{v}</td><td className="mono">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Drill-through: Cluster Detail ─────────────────────────────────────────────

function ClusterDetail({ cluster, hosts, vms, oc, usage, onBack, onSelectHost }) {
  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <ArrowLeft size={12} /> Back to Clusters
      </button>

      <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--teal)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{cluster.name}</h2>
        <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
          {[
            { v: hosts.length, l: 'Hosts' },
            { v: vms.length, l: 'VMs' },
            { v: cluster.ha_enabled === 'True' ? 'On' : 'Off', l: 'HA' },
            { v: cluster.drs_enabled === 'True' ? 'On' : 'Off', l: 'DRS' },
            { v: cluster.evc_mode || 'None', l: 'EVC' },
            { v: oc ? `${oc.cpu_oc_pct.toFixed(0)}%` : '—', l: 'CPU OC' },
            { v: oc ? `${oc.mem_oc_pct.toFixed(0)}%` : '—', l: 'Mem OC' },
            { v: (cluster.num_vmotions || 0).toLocaleString(), l: 'vMotions' },
          ].map(k => (
            <div key={k.l}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{k.v}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-header">Hosts in this Cluster</div>
        <table className="data-table">
          <thead>
            <tr><th>Status</th><th>Host</th><th>Model</th><th>Cores</th><th>RAM</th><th>CPU%</th><th>RAM%</th><th>VMs</th><th>Build</th></tr>
          </thead>
          <tbody>
            {hosts.sort((a, b) => {
              const order = { RED: 0, YELLOW: 1, GREEN: 2 };
              return (order[a.overall_status] ?? 3) - (order[b.overall_status] ?? 3);
            }).map(h => (
              <tr
                key={h.name}
                className={h.overall_status === 'RED' ? 'status-red' : h.overall_status === 'YELLOW' ? 'status-yellow' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectHost(h)}
              >
                <td><StatusDot status={h.overall_status} /></td>
                <td style={{ fontWeight: 600, fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {h.name.split('.')[0]} <ChevronRight size={10} color="var(--gray-300)" />
                  </span>
                </td>
                <td style={{ fontSize: 11 }}>{h.model?.replace('PowerEdge ', 'PE ') || '—'}</td>
                <td className="mono">{h.cores}</td>
                <td className="mono">{h.ram_gb?.toFixed(0)}</td>
                <td style={{ minWidth: 80 }}><MiniBar value={h.cpu_usage_pct || 0} /></td>
                <td style={{ minWidth: 80 }}><MiniBar value={h.ram_usage_pct || 0} /></td>
                <td className="mono">{h.total_vms}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{h.build || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Drill-through: Host Detail ────────────────────────────────────────────────

function HostDetail({ host, vms, onBack }) {
  const hostVMs = vms.filter(v => v.host === host.name && v.is_template !== 'Yes');

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <ArrowLeft size={12} /> Back
      </button>

      <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--navy)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Server size={20} color="var(--navy)" />
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{host.name}</h2>
            <p style={{ fontSize: 11, color: 'var(--gray-400)' }}>{host.model} · {host.cpu_type}</p>
          </div>
          <HealthBadge status={host.overall_status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Hardware</p>
            {[
              ['Vendor', host.vendor],
              ['Model', host.model],
              ['CPU Sockets', host.cpu_sockets],
              ['Cores', host.cores],
              ['Threads', host.threads],
              ['RAM', `${host.ram_gb?.toFixed(0)} GB`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>{l}</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{v || '—'}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Software</p>
            {[
              ['ESXi Version', host.version],
              ['Build', host.build],
              ['EOS Date', host.eos_date || '—'],
              ['Uptime', host.uptime_sec > 0 ? `${Math.floor(host.uptime_sec/86400)}d ${Math.floor(host.uptime_sec%86400/3600)}h` : '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>{l}</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{v || '—'}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Utilization</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <GaugeBar value={host.cpu_usage_pct || 0} label="CPU" sublabel="%" />
              <GaugeBar value={host.ram_usage_pct || 0} label="RAM" sublabel="%" />
            </div>
          </div>
          {(host.serial || host.bios_version) && (
            <div>
              <p style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Asset Detail <span className="badge badge-navy" style={{ fontSize: 9 }}>RVTools</span></p>
              {[
                ['Serial', host.serial],
                ['Service Tag', host.service_tag],
                ['BIOS Version', host.bios_version],
                ['BIOS Date', host.bios_date],
                ['NICs', host.nic_count],
                ['HBAs', host.hba_count],
              ].map(([l, v]) => v ? (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ color: 'var(--gray-500)' }}>{l}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{v}</span>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      </div>

      {/* VMs on this host */}
      <div className="card">
        <div className="section-header">VMs on this host ({hostVMs.length})</div>
        {hostVMs.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 12 }}>No VMs assigned to this host</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>VM</th><th>vCPU</th><th>RAM GB</th><th>OS</th><th>Tools</th><th>vHW</th><th>Snapshots</th><th>Power</th></tr>
            </thead>
            <tbody>
              {hostVMs.slice(0, 50).map(vm => (
                <tr key={vm.name}>
                  <td style={{ fontWeight: 600, fontSize: 11 }}>{vm.name}</td>
                  <td className="mono">{vm.vcpus}</td>
                  <td className="mono">{(vm.ram_mb / 1024).toFixed(1)}</td>
                  <td style={{ fontSize: 10, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vm.guest_os || '—'}</td>
                  <td><ToolsBadge status={vm.tools_status} /></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{vm.vhw_version}</td>
                  <td>{vm.snapshots > 0 ? <span className="badge badge-orange">{vm.snapshots}</span> : '—'}</td>
                  <td style={{ fontSize: 11 }}>{vm.power_state === 'POWERED_ON' ? '🟢' : '⚫'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
