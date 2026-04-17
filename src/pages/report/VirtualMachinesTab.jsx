// app/src/pages/report/VirtualMachinesTab.jsx
import { useState } from 'react';
import { DonutChart, HBarChart, COLORS } from '../../components/report/charts.jsx';

const SUBTABS = [
  { id: 'overview',    label: 'VM Overview' },
  { id: 'guestos',     label: 'Guest OS' },
  { id: 'allocation',  label: 'Allocation' },
  { id: 'storage',     label: 'Storage' },
  { id: 'templates',   label: 'Templates' },
  { id: 'srm',         label: 'SRM' },
];

export function VirtualMachinesTab({ fleet, vcenters }) {
  const [sub, setSub] = useState('overview');
  const allVMs       = vcenters.flatMap(vc => vc.vms || []);
  const realVMs      = allVMs.filter(v => v.is_template !== 'Yes');
  const templates    = allVMs.filter(v => v.is_template === 'Yes');
  const hasSRM       = realVMs.some(v => v.srm_protected === 'Yes' || v.srm_placeholder === 'Yes');

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)', marginBottom: 20 }}>
        {SUBTABS.filter(t => t.id !== 'srm' || hasSRM).map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            padding: '8px 16px', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
            color: sub === t.id ? 'var(--navy)' : 'var(--gray-500)',
            borderBottom: sub === t.id ? '2px solid var(--navy)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>
      {sub === 'overview'   && <VMOverviewSection   fleet={fleet} vcenters={vcenters} realVMs={realVMs} templates={templates} />}
      {sub === 'guestos'    && <GuestOSSection       vcenters={vcenters} realVMs={realVMs} />}
      {sub === 'allocation' && <AllocationSection    vcenters={vcenters} realVMs={realVMs} />}
      {sub === 'storage'    && <StorageSection       vcenters={vcenters} realVMs={realVMs} />}
      {sub === 'templates'  && <TemplatesSection     templates={templates} />}
      {sub === 'srm'        && <SRMSection           vcenters={vcenters} realVMs={realVMs} />}
    </div>
  );
}

// ── VM Overview ────────────────────────────────────────────────────────────

function VMOverviewSection({ fleet, vcenters, realVMs, templates }) {
  const suspended  = realVMs.filter(v => v.power_state === 'SUSPENDED').length;
  const snapVMs    = realVMs.filter(v => (v.snapshots || 0) > 0).length;

  // Guest OS split
  const windowsVMs = realVMs.filter(v => v.guest_os?.toLowerCase().includes('windows'));
  const linuxVMs   = realVMs.filter(v => v.guest_os && !v.guest_os.toLowerCase().includes('windows'));

  // CPU size buckets
  const cpuBuckets = { '1 vCPU': 0, '2–4 vCPUs': 0, '5–16 vCPUs': 0, '>16 vCPUs': 0 };
  realVMs.forEach(v => {
    const c = v.vcpus || 0;
    if (c <= 1)      cpuBuckets['1 vCPU']++;
    else if (c <= 4) cpuBuckets['2–4 vCPUs']++;
    else if (c <= 16) cpuBuckets['5–16 vCPUs']++;
    else             cpuBuckets['>16 vCPUs']++;
  });

  // Memory size buckets (ram_mb → GB)
  const memBuckets = { '≤4 GB': 0, '5–16 GB': 0, '17–64 GB': 0, '>64 GB': 0 };
  realVMs.forEach(v => {
    const gb = (v.ram_mb || 0) / 1024;
    if (gb <= 4)       memBuckets['≤4 GB']++;
    else if (gb <= 16) memBuckets['5–16 GB']++;
    else if (gb <= 64) memBuckets['17–64 GB']++;
    else               memBuckets['>64 GB']++;
  });

  // vHW distribution
  const vhwBuckets = { 'vmx-11 & below': 0, 'vmx-13–17': 0, 'vmx-18+': 0 };
  realVMs.forEach(v => {
    const ver = parseInt((v.vhw_version || '').replace('vmx-', ''));
    if (isNaN(ver) || ver <= 11) vhwBuckets['vmx-11 & below']++;
    else if (ver <= 17)          vhwBuckets['vmx-13–17']++;
    else                         vhwBuckets['vmx-18+']++;
  });

  // Tools status
  const toolsCounts = { ok: 0, old: 0, notInstalled: 0, notRunning: 0, unmanaged: 0 };
  realVMs.forEach(v => {
    const s = v.tools_status;
    if (s === 'toolsOk' || s === 'guestToolsCurrent') toolsCounts.ok++;
    else if (s === 'toolsOld') toolsCounts.old++;
    else if (s === 'toolsNotInstalled') toolsCounts.notInstalled++;
    else if (s === 'toolsNotRunning') toolsCounts.notRunning++;
    else toolsCounts.unmanaged++;
  });

  // Snapshot space
  const totalSnapSpace = vcenters.reduce((s, vc) => {
    return s + (vc.vms || []).reduce((ss, v) => ss + (v.snap_space_gb || 0), 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Inventory KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        {[
          { v: realVMs.length.toLocaleString(),     l: 'Total VMs' },
          { v: fleet.powered_on.toLocaleString(),   l: 'Powered On' },
          { v: fleet.powered_off.toLocaleString(),  l: 'Powered Off' },
          { v: suspended,                           l: 'Suspended' },
          { v: templates.length,                    l: 'Templates' },
          { v: fleet.total_vcpus.toLocaleString(),  l: 'Total vCPUs' },
          { v: `${(fleet.total_vram_gb/1024).toFixed(0)} TB`, l: 'Total vRAM' },
          { v: snapVMs,                             l: 'Snap VMs', warn: snapVMs > 0 },
          { v: totalSnapSpace > 0 ? `${totalSnapSpace.toFixed(0)} GB` : '—', l: 'Snap Space', warn: totalSnapSpace > 100 },
        ].map(k => (
          <div key={k.l} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.warn ? 'var(--danger)' : 'var(--navy)', fontFamily: 'var(--mono)' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Guest OS + CPU/Mem size */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Guest OS</div>
          <DonutChart
            labels={['Windows', 'Linux / Other']}
            data={[windowsVMs.length, linuxVMs.length]}
            colors={[COLORS.navy, COLORS.teal]}
            size={100}
            centerText={{ value: realVMs.length, label: 'VMs' }}
          />
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
            <div style={{ textAlign: 'center', fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--mono)' }}>{windowsVMs.length.toLocaleString()}</div>
              <div style={{ color: 'var(--gray-400)' }}>Windows</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--mono)' }}>{linuxVMs.length.toLocaleString()}</div>
              <div style={{ color: 'var(--gray-400)' }}>Linux/Other</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="section-header">VMs by CPU Size</div>
          <DonutChart
            labels={Object.keys(cpuBuckets)}
            data={Object.values(cpuBuckets)}
            colors={[COLORS.teal, COLORS.navy, COLORS.tealAlpha(0.6), COLORS.navyAlpha(0.4)]}
            size={100}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
            {Object.entries(cpuBuckets).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-header">VMs by Memory Size</div>
          <DonutChart
            labels={Object.keys(memBuckets)}
            data={Object.values(memBuckets)}
            colors={[COLORS.teal, COLORS.navy, COLORS.orange, COLORS.red]}
            size={100}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
            {Object.entries(memBuckets).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* vHW + Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">VM Hardware Versions</div>
          <DonutChart
            labels={Object.keys(vhwBuckets)}
            data={Object.values(vhwBuckets)}
            colors={[COLORS.danger, COLORS.yellow, COLORS.green]}
            size={100}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {Object.entries(vhwBuckets).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--gray-500)' }}>{k}</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-header">VMTools Status</div>
          <DonutChart
            labels={['OK/Current', 'Need Upgrade', 'Not Installed', 'Not Running', 'Unmanaged']}
            data={[toolsCounts.ok, toolsCounts.old, toolsCounts.notInstalled, toolsCounts.notRunning, toolsCounts.unmanaged]}
            colors={[COLORS.green, COLORS.yellow, COLORS.danger, COLORS.orange, COLORS.gray]}
            size={100}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {[
              ['OK / Current', toolsCounts.ok, 'var(--green)'],
              ['Need Upgrade', toolsCounts.old, 'var(--yellow)'],
              ['Not Installed', toolsCounts.notInstalled, 'var(--danger)'],
              ['Not Running', toolsCounts.notRunning, 'var(--orange)'],
              ['Unmanaged', toolsCounts.unmanaged, 'var(--gray-400)'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--gray-500)' }}>{label}</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color }}>{val.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Guest OS ───────────────────────────────────────────────────────────────

function GuestOSSection({ vcenters, realVMs }) {
  const windowsVMs = realVMs.filter(v => v.guest_os?.toLowerCase().includes('windows'));
  const otherVMs   = realVMs.filter(v => v.guest_os && !v.guest_os.toLowerCase().includes('windows'));

  // Top OS names
  const osDist = {};
  realVMs.forEach(v => { const os = v.guest_os || 'Unknown'; osDist[os] = (osDist[os] || 0) + 1; });
  const topOS = Object.entries(osDist).sort((a, b) => b[1] - a[1]).slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Windows vs Non-Windows</div>
          <DonutChart
            labels={['Windows', 'Other']}
            data={[windowsVMs.length, otherVMs.length]}
            colors={[COLORS.navy, COLORS.teal]}
            size={120}
            centerText={{ value: realVMs.length, label: 'VMs' }}
          />
        </div>
        <div className="card">
          <div className="section-header">Top Guest OSes</div>
          <table className="data-table">
            <thead><tr><th>OS Name</th><th>VMs</th><th>% Total</th></tr></thead>
            <tbody>
              {topOS.map(([os, count]) => (
                <tr key={os}>
                  <td style={{ fontSize: 11 }}>{os}</td>
                  <td className="mono">{count.toLocaleString()}</td>
                  <td className="mono">{realVMs.length > 0 ? `${(count / realVMs.length * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Per-vCenter Guest OS Detail</div>
        <table className="data-table">
          <thead><tr><th>vCenter</th><th>VMs</th><th>Powered On</th><th>Powered Off</th><th>vCPUs</th><th>vRAM (GB)</th></tr></thead>
          <tbody>
            {vcenters.map(vc => {
              const vms = (vc.vms || []).filter(v => v.is_template !== 'Yes');
              const on  = vms.filter(v => v.power_state === 'POWERED_ON').length;
              const off = vms.filter(v => v.power_state === 'POWERED_OFF').length;
              const vcpus = vms.reduce((s, v) => s + (v.vcpus || 0), 0);
              const vram  = vms.reduce((s, v) => s + ((v.ram_mb || 0) / 1024), 0);
              return (
                <tr key={vc.vcenter_name}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 11 }}>{vc.vcenter_name?.split('.')[0]}</td>
                  <td className="mono">{vms.length}</td>
                  <td className="mono">{on}</td>
                  <td className="mono">{off}</td>
                  <td className="mono">{vcpus.toLocaleString()}</td>
                  <td className="mono">{vram.toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Allocation ─────────────────────────────────────────────────────────────

function AllocationSection({ vcenters, realVMs }) {
  // vCPU buckets
  const vcpuBuckets = {};
  realVMs.forEach(v => {
    const k = String(v.vcpus || 0);
    vcpuBuckets[k] = (vcpuBuckets[k] || 0) + 1;
  });
  const vcpuRows = Object.entries(vcpuBuckets).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  // vMem buckets (GB)
  const memGroups = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const memBuckets = {};
  realVMs.forEach(v => {
    const gb = Math.ceil((v.ram_mb || 0) / 1024);
    const bucket = memGroups.find(g => g >= gb) || 256;
    const k = `${bucket} GB`;
    memBuckets[k] = (memBuckets[k] || 0) + 1;
  });

  // VMDK size buckets
  const vmdkGroups = [10, 25, 50, 100, 200, 500, 1000];
  const vmdkBuckets = {};
  realVMs.forEach(v => {
    const gb = v.storage_committed_gb || 0;
    const bucket = vmdkGroups.find(g => g >= gb) || 1000;
    const k = `≤${bucket} GB`;
    vmdkBuckets[k] = (vmdkBuckets[k] || 0) + 1;
  });

  // OS distribution
  const osDist = {};
  realVMs.forEach(v => { const os = v.guest_os || 'Unknown'; osDist[os] = (osDist[os] || 0) + 1; });
  const osRows = Object.entries(osDist).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DistTable title="vCPU Distribution" rows={vcpuRows} total={realVMs.length} />
        <DistTable title="vMem Distribution" rows={Object.entries(memBuckets)} total={realVMs.length} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DistTable title="VMDK Size Distribution" rows={Object.entries(vmdkBuckets)} total={realVMs.length} />
        <DistTable title="Guest OS Distribution" rows={osRows.slice(0, 20)} total={realVMs.length} />
      </div>
    </div>
  );
}

// ── DistTable (shared component) ────────────────────────────────────────────

function DistTable({ title, rows, total }) {
  return (
    <div className="card">
      <div className="section-header">{title}</div>
      <table className="data-table">
        <thead><tr><th>Grouping</th><th>VMs</th><th>% of Total</th></tr></thead>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ fontSize: 11 }}>{k}</td>
              <td className="mono">{v.toLocaleString()}</td>
              <td className="mono">{total > 0 ? `${(v / total * 100).toFixed(1)}%` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Storage ────────────────────────────────────────────────────────────────

function StorageSection({ vcenters, realVMs }) {
  const totalAlloc    = realVMs.reduce((s, v) => s + (v.storage_committed_gb || 0), 0);
  const totalUncommit = realVMs.reduce((s, v) => s + (v.storage_uncommitted_gb || 0), 0);
  const totalSnap     = realVMs.reduce((s, v) => s + (v.snap_space_gb || 0), 0);
  const totalSnaps    = realVMs.reduce((s, v) => s + (v.snapshots || 0), 0);

  // VMDK size distribution bar chart
  const vmdkGroups = ['≤10 GB', '≤50 GB', '≤100 GB', '≤500 GB', '>500 GB'];
  const vmdkCounts = [0, 0, 0, 0, 0];
  realVMs.forEach(v => {
    const gb = v.storage_committed_gb || 0;
    if (gb <= 10)       vmdkCounts[0]++;
    else if (gb <= 50)  vmdkCounts[1]++;
    else if (gb <= 100) vmdkCounts[2]++;
    else if (gb <= 500) vmdkCounts[3]++;
    else                vmdkCounts[4]++;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        {[
          { v: realVMs.length.toLocaleString(),    l: 'Total VMs' },
          { v: `${(totalAlloc / 1024).toFixed(1)} TB`,   l: 'Allocated' },
          { v: `${(totalUncommit / 1024).toFixed(1)} TB`, l: 'Uncommitted' },
          { v: totalSnaps,                         l: 'Snapshots', warn: totalSnaps > 0 },
          { v: totalSnap > 0 ? `${totalSnap.toFixed(0)} GB` : '0', l: 'Snap Space', warn: totalSnap > 100 },
        ].map(k => (
          <div key={k.l} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.warn ? 'var(--danger)' : 'var(--navy)', fontFamily: 'var(--mono)' }}>{k.v}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">VMDK Size Distribution</div>
          <HBarChart labels={vmdkGroups} datasets={[{ label: 'VMs', data: vmdkCounts, backgroundColor: COLORS.navy }]} />
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>Allocated vs Uncommitted</div>
          <DonutChart
            labels={['Allocated (Committed)', 'Uncommitted']}
            data={[Math.round(totalAlloc), Math.round(totalUncommit)]}
            colors={[COLORS.navy, COLORS.tealAlpha(0.5)]}
            size={120}
            centerText={{ value: `${((totalAlloc + totalUncommit) / 1024).toFixed(0)} TB`, label: 'Total' }}
          />
        </div>
      </div>

      {/* Storage details per vCenter */}
      <div className="card">
        <div className="section-header">Storage Details by vCenter</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>vCenter</th><th>VMs</th><th>Powered On</th><th>Allocated (TB)</th>
              <th>Uncommitted (TB)</th><th>Snapshots</th><th>Snap Space (GB)</th>
            </tr>
          </thead>
          <tbody>
            {vcenters.map(vc => {
              const vms = (vc.vms || []).filter(v => v.is_template !== 'Yes');
              const on  = vms.filter(v => v.power_state === 'POWERED_ON').length;
              const alloc    = vms.reduce((s, v) => s + (v.storage_committed_gb || 0), 0);
              const uncommit = vms.reduce((s, v) => s + (v.storage_uncommitted_gb || 0), 0);
              const snaps    = vms.reduce((s, v) => s + (v.snapshots || 0), 0);
              const snapSpc  = vms.reduce((s, v) => s + (v.snap_space_gb || 0), 0);
              return (
                <tr key={vc.vcenter_name}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 11 }}>{vc.vcenter_name?.split('.')[0]}</td>
                  <td className="mono">{vms.length}</td>
                  <td className="mono">{on}</td>
                  <td className="mono">{(alloc / 1024).toFixed(2)}</td>
                  <td className="mono">{(uncommit / 1024).toFixed(2)}</td>
                  <td className="mono" style={{ color: snaps > 0 ? 'var(--orange)' : 'inherit' }}>{snaps}</td>
                  <td className="mono" style={{ color: snapSpc > 0 ? 'var(--orange)' : 'inherit' }}>{snapSpc.toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Templates ──────────────────────────────────────────────────────────────

function TemplatesSection({ templates }) {
  const osDist     = {};
  const vhwDist    = {};
  const toolsDist  = {};
  templates.forEach(t => {
    osDist[t.guest_os    || 'Unknown'] = (osDist[t.guest_os    || 'Unknown'] || 0) + 1;
    vhwDist[t.vhw_version || 'Unknown'] = (vhwDist[t.vhw_version || 'Unknown'] || 0) + 1;
    toolsDist[t.tools_status || 'Unknown'] = (toolsDist[t.tools_status || 'Unknown'] || 0) + 1;
  });
  const topOS  = Object.entries(osDist).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topVHW = Object.entries(vhwDist).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topTool = Object.entries(toolsDist).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (!templates.length) return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: 'var(--gray-400)' }}>No templates found in the current scope.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-header">Templates by Guest OS</div>
          <HBarChart labels={topOS.map(([k]) => k)} datasets={[{ label: 'Templates', data: topOS.map(([, v]) => v), backgroundColor: COLORS.navy }]} height={topOS.length * 26} />
        </div>
        <div className="card">
          <div className="section-header">Templates by vHW Version</div>
          <HBarChart labels={topVHW.map(([k]) => k)} datasets={[{ label: 'Templates', data: topVHW.map(([, v]) => v), backgroundColor: COLORS.teal }]} height={topVHW.length * 26} />
        </div>
        <div className="card">
          <div className="section-header">Templates by Tools Version</div>
          <HBarChart labels={topTool.map(([k]) => k)} datasets={[{ label: 'Templates', data: topTool.map(([, v]) => v), backgroundColor: COLORS.orange }]} height={topTool.length * 26} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">Template Detail ({templates.length} templates)</div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Guest OS</th><th>Cluster</th><th>vCPUs</th><th>RAM (GB)</th><th>vHW</th><th>Tools</th><th>Snapshots</th></tr></thead>
          <tbody>
            {templates.slice(0, 100).map((t, i) => (
              <tr key={i}>
                <td style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</td>
                <td style={{ fontSize: 11 }}>{t.guest_os || '—'}</td>
                <td style={{ fontSize: 11 }}>{t.cluster || '—'}</td>
                <td className="mono">{t.vcpus || '—'}</td>
                <td className="mono">{t.ram_mb ? ((t.ram_mb / 1024).toFixed(0)) : '—'}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{t.vhw_version || '—'}</td>
                <td style={{ fontSize: 10 }}>{t.tools_status || '—'}</td>
                <td className="mono">{t.snapshots || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {templates.length > 100 && <p style={{ fontSize: 11, color: 'var(--gray-400)', padding: '8px 0' }}>Showing 100 of {templates.length} templates</p>}
      </div>
    </div>
  );
}

// ── SRM ────────────────────────────────────────────────────────────────────

function SRMSection({ vcenters, realVMs }) {
  const protected_vms  = realVMs.filter(v => v.srm_protected === 'Yes');
  const placeholder_vms = realVMs.filter(v => v.srm_placeholder === 'Yes');

  const osDist = {};
  protected_vms.forEach(v => { const os = v.guest_os || 'Unknown'; osDist[os] = (osDist[os] || 0) + 1; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="section-header" style={{ justifyContent: 'center' }}>VM SRM Protection</div>
          <DonutChart
            labels={['Protected', 'Not Protected']}
            data={[protected_vms.length, realVMs.length - protected_vms.length]}
            colors={[COLORS.green, COLORS.navyAlpha(0.15)]}
            size={120}
            centerText={{ value: protected_vms.length, label: 'Protected' }}
          />
          <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>
            {protected_vms.length} protected · {placeholder_vms.length} placeholders
          </p>
        </div>
        <div className="card">
          <div className="section-header">Protected VMs by OS</div>
          <table className="data-table">
            <thead><tr><th>Guest OS</th><th>Protected Count</th></tr></thead>
            <tbody>
              {Object.entries(osDist).sort((a, b) => b[1] - a[1]).map(([os, count]) => (
                <tr key={os}><td style={{ fontSize: 11 }}>{os}</td><td className="mono">{count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {['Protected Site', 'Recovery Site'].map(site => {
          const isRecovery = site === 'Recovery Site';
          const siteVMs = isRecovery ? placeholder_vms : protected_vms;
          const vcRows = vcenters.map(vc => {
            const vms = siteVMs.filter(v => v.cluster && (vc.clusters || []).some(c => c.name === v.cluster));
            return { name: vc.vcenter_name?.split('.')[0], vms: vms.length, vcpus: vms.reduce((s, v) => s + (v.vcpus || 0), 0), ram: vms.reduce((s, v) => s + ((v.ram_mb || 0) / 1024), 0), alloc: vms.reduce((s, v) => s + (v.storage_committed_gb || 0), 0) };
          }).filter(r => r.vms > 0);
          return (
            <div key={site} className="card">
              <div className="section-header">{site} Inventory</div>
              <table className="data-table">
                <thead><tr><th>vCenter</th><th>VMs</th><th>vCPUs</th><th>RAM (GB)</th><th>Alloc (TB)</th></tr></thead>
                <tbody>
                  {vcRows.map(r => (
                    <tr key={r.name}>
                      <td style={{ fontWeight: 600, fontSize: 11 }}>{r.name}</td>
                      <td className="mono">{r.vms}</td>
                      <td className="mono">{r.vcpus}</td>
                      <td className="mono">{r.ram.toFixed(0)}</td>
                      <td className="mono">{(r.alloc / 1024).toFixed(2)}</td>
                    </tr>
                  ))}
                  {vcRows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 11 }}>No data</td></tr>}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
