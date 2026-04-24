// app/src/pages/report/InfrastructureTab.jsx
import { useState } from 'react';
import { DonutChart, HBarChart, COLORS, OC_COLORS } from '../../components/report/charts.jsx';
import { OcBadge } from '../../components/report/StatusBadge.jsx';

const SUBTABS = [
  { id: 'world',    label: 'vSphere World' },
  { id: 'clusters', label: 'Clusters' },
  { id: 'hosts',    label: 'ESXi Hosts' },
  { id: 'dvs',      label: 'DVS' },
];

export function InfrastructureTab({ fleet, vcenters, onDrillVC }) {
  const [sub, setSub] = useState('world');

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
      {sub === 'world'    && <VSphereWorldSection fleet={fleet} vcenters={vcenters} onDrillVC={onDrillVC} />}
      {sub === 'clusters' && <ClusterSection vcenters={vcenters} />}
      {sub === 'hosts'    && <ESXiHostSection vcenters={vcenters} />}
      {sub === 'dvs'      && <DVSSection vcenters={vcenters} />}
    </div>
  );
}

// ── vSphere World ──────────────────────────────────────────────────────────

function VSphereWorldSection({ fleet, vcenters, onDrillVC }) {
  const allHosts = vcenters.flatMap(vc => vc.hosts || []);
  const allDVS   = vcenters.flatMap(vc => vc.dvs || []);
  const allVMs   = vcenters.flatMap(vc => vc.vms || []).filter(v => v.is_template !== 'Yes');

  const esxiVersionDist = {};
  const vendorDist = {};
  const modelDist  = {};
  allHosts.forEach(h => {
    const v = h.esxi_major || 'Unknown';
    esxiVersionDist[v] = (esxiVersionDist[v] || 0) + 1;
    vendorDist[h.vendor || 'Unknown'] = (vendorDist[h.vendor || 'Unknown'] || 0) + 1;
    modelDist[h.model   || 'Unknown'] = (modelDist[h.model   || 'Unknown'] || 0) + 1;
  });
  const topModels = Object.entries(modelDist).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const vcNames        = vcenters.map(vc => vc.vcenter_name?.split('.')[0] || 'vc');
  const vmCounts       = vcenters.map(vc => vc.summary?.total_vms || 0);
  const templateCounts = vcenters.map(vc => vc.summary?.total_templates || 0);
  const vmHostRatios   = vcenters.map(vc => parseFloat(vc.summary?.vm_to_host_ratio || 0));

  const datacenters = new Set(allHosts.map(h => h.datacenter).filter(Boolean));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Inventory Rollup */}
      <div className="card">
        <div className="section-header">Inventory Rollup</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 16 }}>
          {[
            { v: vcenters.length,                              l: 'vCenters' },
            { v: datacenters.size,                             l: 'Datacenters' },
            { v: fleet.total_clusters,                         l: 'Clusters' },
            { v: fleet.total_hosts,                            l: 'Hosts' },
            { v: allDVS.length,                                l: 'DVSwitches' },
            { v: fleet.total_host_cores.toLocaleString(),      l: 'Host Cores' },
            { v: `${(fleet.total_host_ram_gb/1024).toFixed(0)} TB`, l: 'Host RAM' },
            { v: `${(fleet.total_storage_gb/1024).toFixed(0)} TB`,  l: 'Total Storage' },
            { v: fleet.total_vcpus.toLocaleString(),           l: 'Total vCPUs' },
          ].map(k => (
            <div key={k.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--mono)' }}>{k.v}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* VM Distribution + VM:Host ratio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">VM Distribution by vCenter</div>
          <HBarChart labels={vcNames} stacked datasets={[
            { label: 'VMs',       data: vmCounts,       backgroundColor: COLORS.navy },
            { label: 'Templates', data: templateCounts, backgroundColor: COLORS.tealAlpha(0.5) },
          ]} />
        </div>
        <div className="card">
          <div className="section-header">VM:Host Ratio by vCenter</div>
          <HBarChart labels={vcNames} datasets={[{ label: 'VMs/Host', data: vmHostRatios, backgroundColor: COLORS.teal }]} xLabel="" />
        </div>
      </div>

      {/* Platform Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">ESXi Versions</div>
          <DonutChart
            labels={Object.keys(esxiVersionDist)}
            data={Object.values(esxiVersionDist)}
            colors={[COLORS.navy, COLORS.teal, COLORS.red, COLORS.orange, COLORS.yellow]}
            size={120}
            centerText={{ value: allHosts.length, label: 'Hosts' }}
          />
        </div>
        <div className="card">
          <div className="section-header">HW Vendors</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(vendorDist).sort((a, b) => b[1] - a[1]).map(([v, c]) => (
              <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--gray-600)' }}>{v}</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-header">Top HW Models</div>
          <HBarChart
            labels={topModels.map(([m]) => m.replace('PowerEdge ', 'PE '))}
            datasets={[{ label: 'Hosts', data: topModels.map(([, c]) => c), backgroundColor: COLORS.navy }]}
            height={topModels.length * 26}
          />
        </div>
      </div>

      {/* Per-vCenter drill-through table */}
      <div className="card">
        <div className="section-header">vCenter Detail</div>
        <table className="data-table">
          <thead><tr><th>vCenter</th><th>Version</th><th>Hosts</th><th>VMs</th><th>Clusters</th><th>Datacenters</th><th></th></tr></thead>
          <tbody>
            {vcenters.map(vc => (
              <tr key={vc.vcenter_name}>
                <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{vc.vcenter_name?.split('.')[0] || '—'}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{vc.vcenter_version || '—'}</td>
                <td className="mono">{vc.summary?.total_hosts}</td>
                <td className="mono">{vc.summary?.total_vms}</td>
                <td className="mono">{vc.clusters?.length || 0}</td>
                <td className="mono">{new Set((vc.hosts || []).map(h => h.datacenter).filter(Boolean)).size}</td>
                <td>
                  <button onClick={() => onDrillVC(vc)} style={{ fontSize: 11, color: 'var(--navy)', fontWeight: 600, background: 'none', border: '1px solid var(--gray-200)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>
                    Detail →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Clusters ───────────────────────────────────────────────────────────────

function ClusterSection({ vcenters }) {
  const allClusters = vcenters.flatMap(vc => vc.clusters || []);
  const allHosts    = vcenters.flatMap(vc => vc.hosts || []);
  const allOC       = vcenters.flatMap(vc => vc.overcommitment || []);
  const allUsage    = vcenters.flatMap(vc => vc.usage || []);

  const haEnabled  = allClusters.filter(c => c.ha_enabled  === 'True' || c.ha_enabled  === '1').length;
  const drsEnabled = allClusters.filter(c => c.drs_enabled === 'True' || c.drs_enabled === '1').length;
  const evcEnabled = allClusters.filter(c => c.evc_mode && c.evc_mode !== '' && c.evc_mode !== 'None').length;

  const esxiVersionByHost = {};
  allHosts.forEach(h => {
    const v = h.esxi_major || 'Unknown';
    esxiVersionByHost[v] = (esxiVersionByHost[v] || 0) + 1;
  });

  // Scatter plot data: CPU usage % vs RAM usage % per cluster
  const scatterPoints = allUsage.map(u => ({
    x: parseFloat(u.cpu_usage_pct || 0).toFixed(1),
    y: parseFloat(u.mem_usage_pct || 0).toFixed(1),
    label: u.cluster_key,
  }));

  // Model inventory
  const modelMap = {};
  allHosts.forEach(h => {
    const key = h.model || 'Unknown';
    if (!modelMap[key]) modelMap[key] = { hosts: 0, cpus: 0, cores: 0, vms: 0 };
    modelMap[key].hosts++;
    modelMap[key].cpus  += h.cpu_sockets || 0;
    modelMap[key].cores += h.cores || 0;
    modelMap[key].vms   += h.total_vms || 0;
  });
  const modelRows = Object.entries(modelMap).sort((a, b) => b[1].hosts - a[1].hosts);

  const totalHosts  = allHosts.length;
  const totalCores  = allHosts.reduce((s, h) => s + (h.cores || 0), 0);
  const totalCPUs   = allHosts.reduce((s, h) => s + (h.cpu_sockets || 0), 0);
  const totalRAMgb  = allHosts.reduce((s, h) => s + (h.ram_gb || 0), 0);
  const avgUptimeD  = allHosts.length > 0 ? allHosts.reduce((s, h) => s + ((h.uptime_sec || 0) / 86400), 0) / allHosts.length : 0;
  const totalVMs    = allHosts.reduce((s, h) => s + (h.total_vms || 0), 0);
  const vcpuToCore  = totalCores > 0 ? (vcenters.reduce((s, vc) => s + (vc.summary?.total_vcpus || 0), 0) / totalCores).toFixed(2) : '—';
  const vmToHost    = totalHosts > 0 ? (totalVMs / totalHosts).toFixed(1) : '—';
  const avgCPUpct   = allUsage.length > 0 ? (allUsage.reduce((s, u) => s + (u.cpu_usage_pct || 0), 0) / allUsage.length).toFixed(1) : '—';
  const avgRAMpct   = allUsage.length > 0 ? (allUsage.reduce((s, u) => s + (u.mem_usage_pct || 0), 0) / allUsage.length).toFixed(1) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* At-a-glance KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        {[
          { v: totalHosts,                   l: 'Hosts' },
          { v: totalCPUs,                    l: 'CPUs' },
          { v: totalCores.toLocaleString(),  l: 'Cores' },
          { v: `${(totalRAMgb/1024).toFixed(0)} TB`, l: 'RAM' },
          { v: vcpuToCore,                   l: 'vCPU:Core' },
          { v: avgCPUpct !== '—' ? `${avgCPUpct}%` : '—', l: 'Avg CPU Use' },
          { v: avgRAMpct !== '—' ? `${avgRAMpct}%` : '—', l: 'Avg RAM Use' },
          { v: vmToHost,                     l: 'VM:Host' },
        ].map(k => (
          <div key={k.l} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--mono)' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* HA / DRS / EVC donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Clusters by HA',  enabled: haEnabled,  total: allClusters.length, colors: [COLORS.teal, COLORS.navyAlpha(0.15)], pctLabel: 'HA On' },
          { label: 'Clusters by DRS', enabled: drsEnabled, total: allClusters.length, colors: [COLORS.navy, COLORS.navyAlpha(0.15)], pctLabel: 'DRS On' },
          { label: 'Clusters by EVC', enabled: evcEnabled, total: allClusters.length, colors: [COLORS.teal, COLORS.navyAlpha(0.15)], pctLabel: 'EVC On' },
        ].map(d => (
          <div key={d.label} className="card" style={{ textAlign: 'center' }}>
            <div className="section-header" style={{ justifyContent: 'center' }}>{d.label}</div>
            <DonutChart labels={[d.pctLabel, 'Off']} data={[d.enabled, d.total - d.enabled]}
              colors={d.colors} size={100}
              centerText={{ value: `${Math.round(d.enabled / Math.max(1, d.total) * 100)}%`, label: d.pctLabel }} />
            <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{d.enabled}/{d.total}</p>
          </div>
        ))}
      </div>

      {/* ESXi by version */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">Hosts by ESXi Version</div>
          <HBarChart
            labels={Object.keys(esxiVersionByHost)}
            datasets={[{ label: 'Hosts', data: Object.values(esxiVersionByHost), backgroundColor: COLORS.navy }]}
          />
        </div>
        {scatterPoints.length > 0 && (
          <div className="card">
            <div className="section-header">Cluster CPU vs RAM Usage (%)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {scatterPoints.map((p, i) => (
                <div key={i} title={p.label} style={{
                  padding: '4px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--mono)',
                  background: parseFloat(p.x) > 80 || parseFloat(p.y) > 80 ? 'var(--status-danger)' : parseFloat(p.x) > 60 || parseFloat(p.y) > 60 ? 'var(--status-warn)' : 'var(--status-ok)',
                  color: 'var(--text-primary)', fontWeight: 600,
                }}>
                  CPU {p.x}% / RAM {p.y}%
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cluster Capacity Table */}
      <div className="card">
        <div className="section-header">Cluster Capacity Details</div>
        <table className="data-table">
          <thead>
            <tr><th>Cluster</th><th>Hosts</th><th>VMs</th><th>CPU OC%</th><th>RAM OC%</th><th>CPU Use%</th><th>RAM Use%</th><th>HA</th><th>DRS</th><th>EVC</th></tr>
          </thead>
          <tbody>
            {allClusters.map((c, i) => {
              const oc = allOC.find(o => o.cluster_key === c.name || c.name?.includes(o.cluster_key));
              const us = allUsage.find(u => u.cluster_key === c.name || c.name?.includes(u.cluster_key));
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600, fontSize: 11 }}>{c.name}</td>
                  <td className="mono">{c.num_hosts}</td>
                  <td className="mono">{c.num_vms}</td>
                  <td><OcBadge value={oc?.cpu_oc_pct || 0} /></td>
                  <td className="mono">{oc ? `${oc.mem_oc_pct?.toFixed(0)}%` : '—'}</td>
                  <td className="mono">{us ? `${us.cpu_usage_pct?.toFixed(0)}%` : '—'}</td>
                  <td className="mono">{us ? `${us.mem_usage_pct?.toFixed(0)}%` : '—'}</td>
                  <td>{c.ha_enabled  === 'True' || c.ha_enabled  === '1' ? '✓' : '✗'}</td>
                  <td>{c.drs_enabled === 'True' || c.drs_enabled === '1' ? '✓' : '✗'}</td>
                  <td style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>{c.evc_mode || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Host Hardware Model Inventory */}
      <div className="card">
        <div className="section-header">Host Hardware Model Inventory</div>
        <table className="data-table">
          <thead><tr><th>Model</th><th>Hosts</th><th>CPUs</th><th>Cores</th><th>VMs</th></tr></thead>
          <tbody>
            {modelRows.map(([model, d]) => (
              <tr key={model}>
                <td style={{ fontSize: 11 }}>{model}</td>
                <td className="mono">{d.hosts}</td>
                <td className="mono">{d.cpus}</td>
                <td className="mono">{d.cores}</td>
                <td className="mono">{d.vms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ESXi Hosts ─────────────────────────────────────────────────────────────

function ESXiHostSection({ vcenters }) {
  const allHosts = vcenters.flatMap(vc => vc.hosts || []);

  const totalHosts   = allHosts.length;
  const totalCPUs    = allHosts.reduce((s, h) => s + (h.cpu_sockets || 0), 0);
  const totalCores   = allHosts.reduce((s, h) => s + (h.cores || 0), 0);
  const avgUptime    = totalHosts > 0 ? allHosts.reduce((s, h) => s + ((h.uptime_sec || 0) / 86400), 0) / totalHosts : 0;
  const totalVMs     = allHosts.reduce((s, h) => s + (h.total_vms || 0), 0);
  const vmToHost     = totalHosts > 0 ? (totalVMs / totalHosts).toFixed(1) : '—';
  const coresPerCPU  = totalCPUs > 0 ? (totalCores / totalCPUs).toFixed(1) : '—';

  const hwConfigs = new Set(allHosts.map(h => `${h.model}|${h.cpu_sockets}|${h.cores}`)).size;
  const inMaint   = allHosts.filter(h => h.maintenance_mode === 'True' || h.maintenance_mode === '1').length;

  // Distributions
  const ramBuckets   = { '<64 GB': 0, '64–256 GB': 0, '256–512 GB': 0, '>512 GB': 0 };
  const cpuModelDist = {};
  const vendorDist   = {};
  allHosts.forEach(h => {
    const ram = h.ram_gb || 0;
    if (ram < 64)       ramBuckets['<64 GB']++;
    else if (ram < 256) ramBuckets['64–256 GB']++;
    else if (ram < 512) ramBuckets['256–512 GB']++;
    else                ramBuckets['>512 GB']++;

    const cpuKey = (h.cpu_type || 'Unknown').replace('Intel(R) Xeon(R) ', 'Xeon ');
    cpuModelDist[cpuKey] = (cpuModelDist[cpuKey] || 0) + 1;
    vendorDist[h.vendor || 'Unknown'] = (vendorDist[h.vendor || 'Unknown'] || 0) + 1;
  });
  const topCPUs = Object.entries(cpuModelDist).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Density by HW config
  const configMap = {};
  allHosts.forEach(h => {
    const key = `${h.model || '?'} / ${h.cpu_sockets || 0}x ${h.cores || 0}c / ${h.ram_gb || 0} GB`;
    if (!configMap[key]) configMap[key] = { hosts: 0, cpus: 0, cores: 0, vms: 0, ram_gb: h.ram_gb || 0 };
    configMap[key].hosts++;
    configMap[key].cpus  += h.cpu_sockets || 0;
    configMap[key].cores += h.cores || 0;
    configMap[key].vms   += h.total_vms || 0;
  });
  const configRows = Object.entries(configMap).sort((a, b) => b[1].hosts - a[1].hosts);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Host Rollup KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        {[
          { v: totalHosts,                  l: 'Hosts' },
          { v: totalCPUs,                   l: 'CPUs' },
          { v: totalCores.toLocaleString(), l: 'Cores' },
          { v: hwConfigs,                   l: 'HW Configs' },
          { v: coresPerCPU,                 l: 'Cores/CPU' },
          { v: `${avgUptime.toFixed(0)}d`,  l: 'Avg Uptime' },
          { v: vmToHost,                    l: 'VM:Host' },
          { v: inMaint,                     l: 'In Maintenance', warn: inMaint > 0 },
        ].map(k => (
          <div key={k.l} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.warn ? 'var(--orange)' : 'var(--navy)', fontFamily: 'var(--mono)' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">Hosts by RAM Installed</div>
          <HBarChart
            labels={Object.keys(ramBuckets)}
            datasets={[{ label: 'Hosts', data: Object.values(ramBuckets), backgroundColor: COLORS.teal }]}
          />
        </div>
        <div className="card">
          <div className="section-header">Hosts by CPU Model</div>
          <HBarChart
            labels={topCPUs.map(([m]) => m)}
            datasets={[{ label: 'Hosts', data: topCPUs.map(([, c]) => c), backgroundColor: COLORS.navy }]}
            height={topCPUs.length * 26}
          />
        </div>
        <div className="card">
          <div className="section-header">Hosts by Vendor</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {Object.entries(vendorDist).sort((a, b) => b[1] - a[1]).map(([v, c]) => (
              <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--gray-600)' }}>{v}</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Density by HW Config */}
      <div className="card">
        <div className="section-header">Density by Hardware Configuration</div>
        <table className="data-table">
          <thead><tr><th>Configuration</th><th>Hosts</th><th>CPUs</th><th>Cores</th><th>VMs</th><th>VM:Host</th><th>VM:Core</th></tr></thead>
          <tbody>
            {configRows.map(([cfg, d]) => (
              <tr key={cfg}>
                <td style={{ fontSize: 11 }}>{cfg}</td>
                <td className="mono">{d.hosts}</td>
                <td className="mono">{d.cpus}</td>
                <td className="mono">{d.cores}</td>
                <td className="mono">{d.vms}</td>
                <td className="mono">{d.hosts > 0 ? (d.vms / d.hosts).toFixed(1) : '—'}</td>
                <td className="mono">{d.cores > 0 ? (d.vms / d.cores).toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── DVS ────────────────────────────────────────────────────────────────────

function DVSSection({ vcenters }) {
  const allDVS = vcenters.flatMap(vc => (vc.dvs || []).map(d => ({ ...d, vcenter: vc.vcenter_name?.split('.')[0] || '?', vcenter_version: vc.vcenter_version || '?' })));
  const versionDist = {};
  allDVS.forEach(d => { versionDist[d.version || 'Unknown'] = (versionDist[d.version || 'Unknown'] || 0) + 1; });
  const versionColors = [COLORS.navy, COLORS.teal, COLORS.orange, COLORS.yellow, COLORS.red];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>VMs by DVS Version</div>
          <DonutChart
            labels={Object.keys(versionDist)}
            data={Object.values(versionDist)}
            colors={versionColors}
            size={120}
            centerText={{ value: allDVS.length, label: 'DVSwitches' }}
          />
        </div>
        <div className="card" style={{ background: 'var(--bg-surface)', borderLeft: '3px solid var(--navy)' }}>
          <div className="section-header">Guidance & References</div>
          <p style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Distributed Virtual Switches should be kept at or above the vSphere version in use. Mixing DVS versions across a cluster can limit vMotion compatibility.
            Review VMware KB 2001624 for DVS upgrade procedures. DVS upgrades require all hosts in the associated cluster to be running the minimum ESXi version for the target DVS version.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="section-header">DVS Detail</div>
        <table className="data-table">
          <thead><tr><th>vCenter</th><th>DVS Name</th><th>vCenter Version</th><th>DVS Version</th><th>Type</th><th>VMs</th><th>Hosts</th></tr></thead>
          <tbody>
            {allDVS.map((d, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, fontSize: 11 }}>{d.vcenter}</td>
                <td style={{ fontSize: 11 }}>{d.name}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{d.vcenter_version}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{d.version || '—'}</td>
                <td style={{ fontSize: 11 }}>{d.type || '—'}</td>
                <td className="mono">{d.vm_count || 0}</td>
                <td className="mono">{d.num_hosts || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
