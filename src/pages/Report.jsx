import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb } from '../components/Layout.jsx';
import { loadProjectData, listProjects } from '../storage/index.js';
import { useScopedData } from '../hooks/useScopedData.js';
import { OverviewTab } from './report/OverviewTab.jsx';
import { InfrastructureTab } from './report/InfrastructureTab.jsx';
import { VirtualMachinesTab } from './report/VirtualMachinesTab.jsx';
import { LifecycleTab } from './report/LifecycleTab.jsx';
import { NextStepsTab } from './report/NextStepsTab.jsx';
import { VCenterTab } from './report/VCenterTab.jsx';
import { BarChart2, Layers, Monitor, Clock, Lightbulb, ArrowLeft } from 'lucide-react';

const TABS = [
  { id: 'overview',       label: 'Overview',         icon: BarChart2 },
  { id: 'infrastructure', label: 'Infrastructure',   icon: Layers },
  { id: 'vms',            label: 'Virtual Machines', icon: Monitor },
  { id: 'lifecycle',      label: 'Lifecycle',        icon: Clock },
  { id: 'next-steps',     label: 'Next Steps',       icon: Lightbulb },
];

export default function Report() {
  const { projectId } = useParams();
  const rawData = loadProjectData(projectId);
  const project = listProjects().find(p => p.id === projectId);
  const [activeTab, setActiveTab] = useState('overview');
  const [scope, setScope] = useState({ vcenter: null, datacenter: null, cluster: null });
  const [drillVC, setDrillVC] = useState(null);

  if (!rawData?.vcenters?.length) return (
    <div style={{ padding: 32, color: 'var(--gray-500)' }}>
      No data found for this project. <a href="#/" style={{ color: 'var(--red)' }}>Go home</a>
    </div>
  );

  const scopedData = useScopedData(rawData, scope);
  const fleet = aggregateFleet(scopedData.vcenters);

  if (drillVC) {
    return (
      <div>
        <div style={{ padding: '8px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
          <button
            onClick={() => setDrillVC(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}
          >
            <ArrowLeft size={13} /> Back to Infrastructure
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <VCenterTab vc={drillVC} allVCs={rawData.vcenters} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: project?.name || 'Project', to: `/projects/${projectId}` },
        { label: 'Report' },
      ]} />

      <FleetBanner fleet={fleet} scopeLabel={scope.vcenter ? scope.vcenter.split('.')[0] : null} />

      <div style={{
        background: 'var(--white)', borderBottom: '1px solid var(--gray-200)',
        padding: '0 24px', position: 'sticky', top: 59, zIndex: 50,
        display: 'flex', gap: 0, overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 16px', fontSize: 12, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? 'var(--navy)' : 'var(--gray-500)',
              borderBottom: isActive ? '2px solid var(--navy)' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      <ScopeBar vcenters={rawData.vcenters} scope={scope} onScopeChange={setScope} />

      <div style={{ padding: '20px 24px' }}>
        {activeTab === 'overview'       && <OverviewTab fleet={fleet} vcenters={scopedData.vcenters} allVcenters={rawData.vcenters} />}
        {activeTab === 'infrastructure' && <InfrastructureTab fleet={fleet} vcenters={scopedData.vcenters} onDrillVC={setDrillVC} />}
        {activeTab === 'vms'            && <VirtualMachinesTab fleet={fleet} vcenters={scopedData.vcenters} />}
        {activeTab === 'lifecycle'      && <LifecycleTab vcenters={scopedData.vcenters} allVcenters={rawData.vcenters} />}
        {activeTab === 'next-steps'     && <NextStepsTab fleet={fleet} vcenters={scopedData.vcenters} />}
      </div>
    </div>
  );
}

function ScopeBar({ vcenters, scope, onScopeChange }) {
  const allActive = !scope.vcenter;
  return (
    <div style={{
      background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)',
      padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto', alignItems: 'center',
    }}>
      <span style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 8, flexShrink: 0 }}>Scope:</span>
      <button
        onClick={() => onScopeChange({ vcenter: null, datacenter: null, cluster: null })}
        style={{
          padding: '8px 12px', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
          color: allActive ? 'var(--navy)' : 'var(--gray-500)',
          borderBottom: allActive ? '2px solid var(--navy)' : '2px solid transparent',
          whiteSpace: 'nowrap',
        }}
      >
        All vCenters
      </button>
      {vcenters.map(vc => {
        const name = vc.vcenter_name;
        const short = name?.split('.')[0] || name;
        const isActive = scope.vcenter === name;
        return (
          <button key={name} onClick={() => onScopeChange({ vcenter: name, datacenter: null, cluster: null })} style={{
            padding: '8px 12px', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
            color: isActive ? 'var(--red)' : 'var(--gray-500)',
            borderBottom: isActive ? '2px solid var(--red)' : '2px solid transparent',
            whiteSpace: 'nowrap',
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
    { value: fleet.vcenter_count, label: 'vCenters' },
    { value: fleet.total_hosts, label: 'ESXi Hosts' },
    { value: fleet.total_vms.toLocaleString(), label: 'VMs' },
    { value: fleet.total_clusters, label: 'Clusters' },
    { value: `${fleet.storage_used_pct.toFixed(1)}%`, label: `Storage (${fleet.total_storage_tb.toFixed(0)} TB)` },
    { value: fleet.degraded_hosts, label: 'Degraded Hosts', warn: fleet.degraded_hosts > 0 },
    { value: fleet.tools_issues, label: 'Tools Issues', warn: fleet.tools_issues > 0 },
    { value: fleet.snap_count, label: 'Snapshots', warn: fleet.snap_count > 0 },
  ];
  return (
    <div style={{
      background: 'linear-gradient(150deg, var(--navy-dark) 0%, var(--navy) 60%, var(--navy-mid) 100%)',
      borderBottom: '2px solid var(--red)', padding: '16px 24px',
    }}>
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {scopeLabel ? `Scope — ${scopeLabel}` : 'Fleet — All vCenters Combined'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: k.warn ? '#FF4F41' : '#ffffff' }}>{k.value}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</span>
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
  const usedStorageGB = sum('used_storage_gb');
  return {
    vcenter_count: all.length,
    total_hosts: sum('total_hosts'),
    total_vms: sum('total_vms'),
    total_clusters: all.reduce((s, vc) => s + (vc.clusters?.length || 0), 0),
    total_host_cores: sum('total_host_cores'),
    total_host_ram_gb: sum('total_host_ram_gb'),
    total_storage_gb: totalStorageGB,
    total_storage_tb: totalStorageGB / 1024,
    used_storage_gb: usedStorageGB,
    storage_used_pct: totalStorageGB > 0 ? (usedStorageGB / totalStorageGB) * 100 : 0,
    degraded_hosts: sum('red_hosts') + sum('yellow_hosts'),
    red_hosts: sum('red_hosts'),
    yellow_hosts: sum('yellow_hosts'),
    tools_issues: sum('tools_issue_count'),
    snap_count: sum('snap_vm_count'),
    total_vcpus: sum('total_vcpus'),
    total_vram_gb: sum('total_vram_gb'),
    powered_on: sum('powered_on'),
    powered_off: sum('powered_off'),
    thin_vms: sum('thin_vm_count'),
    thick_vms: sum('thick_vm_count'),
    vhw_legacy: sum('vhw_legacy_count'),
    vhw_mid: sum('vhw_mid_count'),
    vhw_current: sum('vhw_current_count'),
    vm_to_core_ratio: all.length > 0 ? (sum('total_vms') / Math.max(1, sum('total_host_cores'))).toFixed(2) : 0,
    vcpu_to_core_ratio: all.length > 0 ? (sum('total_vcpus') / Math.max(1, sum('total_host_cores'))).toFixed(2) : 0,
  };
}
