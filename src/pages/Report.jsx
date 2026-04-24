import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb, ReportLayout } from '../components/Layout.jsx';
import { loadProjectData, listProjects } from '../storage/index.js';
import { useScopedData } from '../hooks/useScopedData.js';
import { OverviewTab } from './report/OverviewTab.jsx';
import { InfrastructureTab } from './report/InfrastructureTab.jsx';
import { VirtualMachinesTab } from './report/VirtualMachinesTab.jsx';
import { LifecycleTab } from './report/LifecycleTab.jsx';
import { NextStepsTab } from './report/NextStepsTab.jsx';
import { VCenterTab } from './report/VCenterTab.jsx';
import { ArrowLeft } from 'lucide-react';

export default function Report() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const rawData = loadProjectData(projectId);
  const project = listProjects().find(p => p.id === projectId);
  const [activeTab, setActiveTab] = useState('overview');
  const [scope, setScope] = useState({ vcenter: null });
  const [drillVC, setDrillVC] = useState(null);

  const scopedData = useScopedData(rawData, scope);

  if (!rawData?.vcenters?.length) return (
    <div style={{ padding: 32, color: 'var(--text-muted)' }}>
      Aucune donnée pour ce projet.{' '}
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 'var(--text-base)', textDecoration: 'underline' }}>
        Retour aux projets
      </button>
    </div>
  );

  const fleet = aggregateFleet(scopedData.vcenters);

  if (drillVC) {
    return (
      <div>
        <Breadcrumb items={[
          { label: project?.name || 'Project', to: `/projects/${projectId}` },
          { label: 'Report', to: `/projects/${projectId}/report` },
          { label: drillVC.vcenter_name?.split('.')[0] || 'vCenter' },
        ]} />
        <div style={{ padding: '8px 16px', background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setDrillVC(null)}
            aria-label="Back to Infrastructure"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600, transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--teal)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={13} /> Retour Infrastructure
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <VCenterTab vc={drillVC} allVCs={rawData.vcenters} />
        </div>
      </div>
    );
  }

  const scopeBar = (
    <ScopeBar vcenters={rawData.vcenters} scope={scope} onScopeChange={setScope} />
  );

  return (
    <div>
      <Breadcrumb items={[
        { label: project?.name || 'Project', to: `/projects/${projectId}` },
        { label: 'Report' },
      ]} />
      <FleetBanner fleet={fleet} scopeLabel={scope.vcenter ? scope.vcenter.split('.')[0] : null} />
      <ReportLayout activeTab={activeTab} onTabChange={setActiveTab} scopeBar={scopeBar}>
        <div style={{ padding: '20px 24px' }}>
          {activeTab === 'overview'       && <OverviewTab fleet={fleet} vcenters={scopedData.vcenters} allVcenters={rawData.vcenters} />}
          {activeTab === 'infrastructure' && <InfrastructureTab fleet={fleet} vcenters={scopedData.vcenters} onDrillVC={setDrillVC} />}
          {activeTab === 'vms'            && <VirtualMachinesTab fleet={fleet} vcenters={scopedData.vcenters} />}
          {activeTab === 'lifecycle'      && <LifecycleTab vcenters={scopedData.vcenters} allVcenters={rawData.vcenters} />}
          {activeTab === 'next-steps'     && <NextStepsTab fleet={fleet} vcenters={scopedData.vcenters} />}
        </div>
      </ReportLayout>
    </div>
  );
}

function ScopeBar({ vcenters, scope, onScopeChange }) {
  const allActive = !scope.vcenter;
  return (
    <div style={{
      background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)',
      padding: '0 16px', display: 'flex', gap: 0, overflowX: 'auto', alignItems: 'center',
    }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 8, flexShrink: 0 }}>Scope :</span>
      <button
        onClick={() => onScopeChange({ vcenter: null })}
        style={{
          padding: '8px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer',
          color: allActive ? 'var(--teal)' : 'var(--text-muted)',
          borderBottom: allActive ? '2px solid var(--teal)' : '2px solid transparent',
          whiteSpace: 'nowrap', transition: 'color 0.12s',
        }}
      >
        All vCenters
      </button>
      {vcenters.map(vc => {
        const name = vc.vcenter_name;
        const short = name?.split('.')[0] || name;
        const isActive = scope.vcenter === name;
        return (
          <button key={name} onClick={() => onScopeChange({ vcenter: name })} style={{
            padding: '8px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer',
            color: isActive ? 'var(--teal)' : 'var(--text-muted)',
            borderBottom: isActive ? '2px solid var(--teal)' : '2px solid transparent',
            whiteSpace: 'nowrap', transition: 'color 0.12s',
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
    { value: fleet.vcenter_count,                    label: 'vCenters' },
    { value: fleet.total_hosts,                      label: 'ESXi Hosts' },
    { value: fleet.total_vms.toLocaleString(),       label: 'VMs' },
    { value: fleet.total_clusters,                   label: 'Clusters' },
    { value: `${fleet.storage_used_pct.toFixed(1)}%`, label: `Storage (${fleet.total_storage_tb.toFixed(0)} TB)` },
    { value: fleet.degraded_hosts, label: 'Degraded Hosts', warn: fleet.degraded_hosts > 0 },
    { value: fleet.tools_issues,   label: 'Tools Issues',   warn: fleet.tools_issues > 0 },
    { value: fleet.snap_count,     label: 'Snapshots',      warn: fleet.snap_count > 0 },
  ];
  return (
    <div style={{
      background: 'linear-gradient(150deg, var(--bg-deep) 0%, var(--bg-base) 100%)',
      borderBottom: '2px solid var(--teal)', padding: '14px 24px',
    }}>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {scopeLabel ? `Scope — ${scopeLabel}` : 'Fleet — All vCenters Combined'}
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, fontFamily: 'var(--mono)', color: k.warn ? 'var(--warn)' : 'var(--text-primary)' }}>
              {k.value}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {k.label}
            </span>
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
  const usedStorageGB  = sum('used_storage_gb');
  return {
    vcenter_count:    all.length,
    total_hosts:      sum('total_hosts'),
    total_vms:        sum('total_vms'),
    total_clusters:   all.reduce((s, vc) => s + (vc.clusters?.length || 0), 0),
    total_host_cores: sum('total_host_cores'),
    total_host_ram_gb:sum('total_host_ram_gb'),
    total_storage_gb: totalStorageGB,
    total_storage_tb: totalStorageGB / 1024,
    used_storage_gb:  usedStorageGB,
    storage_used_pct: totalStorageGB > 0 ? (usedStorageGB / totalStorageGB) * 100 : 0,
    degraded_hosts:   sum('red_hosts') + sum('yellow_hosts'),
    red_hosts:        sum('red_hosts'),
    yellow_hosts:     sum('yellow_hosts'),
    tools_issues:     sum('tools_issue_count'),
    snap_count:       sum('snap_vm_count'),
    total_vcpus:      sum('total_vcpus'),
    total_vram_gb:    sum('total_vram_gb'),
    powered_on:       sum('powered_on'),
    powered_off:      sum('powered_off'),
    thin_vms:         sum('thin_vm_count'),
    thick_vms:        sum('thick_vm_count'),
    vhw_legacy:       sum('vhw_legacy_count'),
    vhw_mid:          sum('vhw_mid_count'),
    vhw_current:      sum('vhw_current_count'),
    vm_to_core_ratio: all.length > 0 ? (sum('total_vms') / Math.max(1, sum('total_host_cores'))).toFixed(2) : 0,
    vcpu_to_core_ratio: all.length > 0 ? (sum('total_vcpus') / Math.max(1, sum('total_host_cores'))).toFixed(2) : 0,
  };
}
