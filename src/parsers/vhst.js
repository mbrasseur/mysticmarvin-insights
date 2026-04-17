import * as XLSX from 'xlsx';
import { sf, siInt, ssStr, esxiMajor, countField, ESXI_EOS, VCENTER_EOS } from './utils.js';

function vhwNum(s) {
  const m = String(s).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export function parseVhst(arrayBuffer) {
  const data = arrayBuffer instanceof ArrayBuffer ? new Uint8Array(arrayBuffer) : arrayBuffer;
  const wb = XLSX.read(data, { type: 'array' });
  const sheet = name => wb.Sheets[name]
    ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' })
    : [];

  // vCenters
  const [vcInfo = {}] = sheet('vCenters');
  const vcenterName = ssStr(vcInfo.vcName || vcInfo.name || '');
  const vcenterVersion = ssStr(vcInfo.vcVersion || vcInfo.version || '');
  const vcenterBuild = ssStr(vcInfo.vcBuildNumber || vcInfo.build || '');

  // Hosts
  const hosts = sheet('Hosts')
    .filter(h => ssStr(h.name))
    .map(h => {
      const version = ssStr(h.version || '');
      const major = esxiMajor(version);
      return {
        name: ssStr(h.name),
        cluster: ssStr(h.cluster || ''),
        datacenter: ssStr(h.datacenter || ''),
        model: ssStr(h.model || ''),
        vendor: ssStr(h.vendor || 'Dell Inc.'),
        cpu_type: ssStr(h.cpuType || ''),
        cpu_sockets: siInt(h.cpus || h.numCpuPkgs || 0),
        cores: siInt(h.cores || 0),
        threads: siInt(h.threads || 0),
        cpu_usage_pct: sf(h.cpuUsage || 0),
        ram_gb: sf(h.ramInGb || 0),
        ram_usage_pct: sf(h.ramUsage || 0),
        version,
        build: ssStr(h.build || ''),
        esxi_major: major,
        overall_status: ssStr(h.overallStatus || 'GREEN').toUpperCase(),
        uptime_sec: sf(h.hostUptime || 0),
        server_vms: siInt(h.serverVms || 0),
        desktop_vms: siInt(h.desktopVms || 0),
        total_vms: siInt(h.serverVms || 0) + siInt(h.desktopVms || 0),
        eos_date: ESXI_EOS[major] || '',
        serial: ssStr(h.id || ''),
        service_tag: ssStr(h.serviceTag || ''),
        bios_version: ssStr(h.biosVersion || ''),
        bios_date: '',
        nic_count: 0,
        hba_count: 0,
      };
    });

  // VMs
  const vms = sheet('VMs')
    .filter(v => ssStr(v.name))
    .map(v => {
      const storCommitGb = sf(v.storageCommitted || 0) / 1_073_741_824;
      const storUncommitGb = sf(v.storageUncommitted || 0) / 1_073_741_824;
      return {
        name: ssStr(v.name),
        cluster: ssStr(v.cluster || ''),
        host: ssStr(v.hostName || v.host || ''),
        datacenter: ssStr(v.datacenter || ''),
        vcpus: siInt(v.numCpus || 0),
        ram_mb: sf(v.memoryInMb || 0),
        guest_os: ssStr(v.guestOs || ''),
        tools_status: ssStr(v.toolsStatus || ''),
        vhw_version: ssStr(v.version || ''),
        thin_provisioned: ssStr(v.thinProvisioned || 'No'),
        power_state: ssStr(v.powerState || ''),
        snapshots: siInt(v.snapshots || 0),
        storage_committed_gb: Math.round(storCommitGb * 100) / 100,
        storage_uncommitted_gb: Math.round(storUncommitGb * 100) / 100,
        cpu_usage_mhz: sf(v.stats_overall_cpu_usage_mhz || 0),
        ram_usage_mb: sf(v.stats_host_memory_usage_mb || 0),
        swapped_mb: sf(v.stats_swapped_memory_mb || 0),
        ballooned_mb: sf(v.stats_ballooned_memory_mb || 0),
        is_template: ssStr(v.isTemplate || 'No'),
      };
    });

  // Clusters
  const clusters = sheet('Clusters')
    .filter(c => ssStr(c.clusterName))
    .map(c => ({
      name: ssStr(c.clusterName),
      num_hosts: siInt(c.numHosts || 0),
      num_vms: siInt(c.numVms || 0),
      ha_enabled: ssStr(c.haEnabled || ''),
      drs_enabled: ssStr(c.drsEnabled || ''),
      evc_mode: ssStr(c.evcMode || ''),
      vsan_enabled: ssStr(c.vsanEnabled || ''),
      num_vmotions: siInt(c.numVmotions || 0),
      total_cpu_mhz: sf(c.totalCpuMhz || 0),
      total_memory_mb: sf(c.totalMemoryMb || 0),
      num_datastores: siInt(c.numDatastores || 0),
      cpu_oc_pct: 0,
      mem_oc_pct: 0,
      cpu_usage_pct: 0,
      mem_usage_pct: 0,
    }));

  // Overcommitment
  const overcommitment = sheet('overcommitment').map(r => ({
    cluster_key: ssStr(r['Cluster Name(VMs)'] || ''),
    mem_oc_pct: sf(r['Memory Overcommit in %'] || 0),
    cpu_oc_pct: sf(r['CPU Overcommit in %'] || 0),
  })).filter(r => r.cluster_key);

  // MEM and CPU Usage
  const usage = sheet('MEM and CPU Usage').map(r => ({
    cluster_key: ssStr(r['Cluster Name(VMs)'] || ''),
    mem_usage_pct: sf(r['Cluster RAM usage in %'] || 0),
    cpu_usage_pct: sf(r['Cluster CPU usage in %'] || 0),
    num_hosts: siInt(r['Number of Hosts'] || 0),
  })).filter(r => r.cluster_key);

  // OS Count
  const os_dist = {};
  for (const r of sheet('OS Count')) {
    const name = ssStr(r['Guest OS'] || '');
    const count = siInt(r.Count || 0);
    if (name && count) os_dist[name] = count;
  }

  // vCPU Distribution
  const vcpu_dist = {};
  for (const r of sheet('vCPU Distribution')) {
    const label = ssStr(r['Num vCpu'] || '');
    const count = siInt(r['Num Vms'] || 0);
    if (label) vcpu_dist[label] = count;
  }

  // vHW distribution from VMs
  const vhw_dist = {};
  for (const v of vms) {
    const hw = v.vhw_version;
    if (hw) vhw_dist[hw] = (vhw_dist[hw] || 0) + 1;
  }

  // Memory Compression
  const compression = sheet('Memory Compression').map(r => ({
    cluster_key: ssStr(r['Cluster Name(VMs)'] || ''),
    compressed_mb: sf(r['Compressed Memory (MB)'] || 0),
  })).filter(r => r.cluster_key);

  // Thin provisioning savings
  const thin_info = {};
  for (const r of sheet('Potential ThinProv Savings')) {
    const key = ssStr(r.Name || '');
    const val = sf(r.Value || 0);
    if (key.includes('Assigned Storage')) thin_info.assigned_gb = Math.max(0, val);
    else if (key.includes('Used Storage')) thin_info.used_gb = Math.max(0, val);
    else if (key.includes('unused')) thin_info.unused_gb = Math.max(0, val);
  }

  // Datastores
  const datastores = sheet('Datastores')
    .filter(r => ssStr(r.datastoreName))
    .map(r => {
      const total_gb = sf(r.totalCapacity || 0);
      const used_gb = sf(r.usedCapacity || 0);
      return {
        name: ssStr(r.datastoreName),
        fs_type: ssStr(r.fileSystemType || ''),
        vmfs_version: ssStr(r.vmfsVersion || ''),
        used_gb: Math.round(used_gb * 10) / 10,
        total_gb: Math.round(total_gb * 10) / 10,
        used_pct: total_gb > 0 ? Math.round(used_gb / total_gb * 1000) / 10 : 0,
        num_vms: siInt(r.numVms || 0),
      };
    })
    .sort((a, b) => b.used_pct - a.used_pct)
    .slice(0, 50);

  // DVS
  const dvs = sheet('DVS')
    .filter(r => ssStr(r.name))
    .map(r => ({
      name: ssStr(r.name),
      type: ssStr(r.type || ''),
      version: ssStr(r.dvsVersion || ''),
      num_hosts: siInt(r.numHosts || 0),
      vm_count: siInt(r.vmCount || 0),
    }));

  // Derived metrics
  const realVms = vms.filter(v => v.is_template === 'No');
  const total_hosts = hosts.length;
  const total_vms = realVms.length;
  const total_templates = vms.filter(v => v.is_template === 'Yes').length;
  const powered_on = realVms.filter(v => v.power_state === 'POWERED_ON').length;
  const powered_off = realVms.filter(v => v.power_state === 'POWERED_OFF').length;
  const total_vcpus = realVms.reduce((s, v) => s + v.vcpus, 0);
  const total_vram_gb = realVms.reduce((s, v) => s + v.ram_mb, 0) / 1024;
  const total_host_cores = hosts.reduce((s, h) => s + h.cores, 0);
  const total_host_ram_gb = hosts.reduce((s, h) => s + h.ram_gb, 0);
  const total_ds_gb = datastores.reduce((s, d) => s + d.total_gb, 0);
  const total_ds_used_gb = datastores.reduce((s, d) => s + d.used_gb, 0);
  const snap_vms = vms.filter(v => v.snapshots > 0).slice(0, 30);
  const tools_issues = realVms.filter(v => !['toolsOk', ''].includes(v.tools_status));
  const vhw_legacy = Object.entries(vhw_dist).filter(([k]) => vhwNum(k) <= 11).reduce((s, [, c]) => s + c, 0);
  const vhw_mid = Object.entries(vhw_dist).filter(([k]) => vhwNum(k) >= 12 && vhwNum(k) <= 15).reduce((s, [, c]) => s + c, 0);
  const vhw_current = Object.entries(vhw_dist).filter(([k]) => vhwNum(k) >= 19).reduce((s, [, c]) => s + c, 0);
  const thin_vms = vms.filter(v => v.thin_provisioned === 'Yes').length;
  const thick_vms = vms.filter(v => v.thin_provisioned === 'No').length;
  const build_dist = {};
  for (const h of hosts) {
    if (h.build) build_dist[h.build] = (build_dist[h.build] || 0) + 1;
  }
  const top_cpu_vms = [...realVms].filter(v => v.cpu_usage_mhz > 0).sort((a, b) => b.cpu_usage_mhz - a.cpu_usage_mhz).slice(0, 15);
  const top_ram_vms = [...realVms].filter(v => v.ram_usage_mb > 0).sort((a, b) => b.ram_usage_mb - a.ram_usage_mb).slice(0, 15);
  const mem_size_dist = { '1-3 GB': 0, '4-16 GB': 0, '17-64 GB': 0, '65-128 GB': 0, '>128 GB': 0 };
  for (const v of realVms) {
    const gb = v.ram_mb / 1024;
    if (gb <= 3) mem_size_dist['1-3 GB']++;
    else if (gb <= 16) mem_size_dist['4-16 GB']++;
    else if (gb <= 64) mem_size_dist['17-64 GB']++;
    else if (gb <= 128) mem_size_dist['65-128 GB']++;
    else mem_size_dist['>128 GB']++;
  }

  return {
    source: 'vhst',
    vcenter_name: vcenterName,
    vcenter_version: vcenterVersion,
    vcenter_build: vcenterBuild,
    vcenter_eos: VCENTER_EOS[esxiMajor(vcenterVersion)] || '',
    summary: {
      total_hosts,
      total_vms,
      total_templates,
      powered_on,
      powered_off,
      total_vcpus,
      total_vram_gb: Math.round(total_vram_gb * 10) / 10,
      total_host_cores,
      total_host_ram_gb: Math.round(total_host_ram_gb * 10) / 10,
      total_storage_gb: Math.round(total_ds_gb * 10) / 10,
      used_storage_gb: Math.round(total_ds_used_gb * 10) / 10,
      storage_used_pct: total_ds_gb > 0 ? Math.round(total_ds_used_gb / total_ds_gb * 1000) / 10 : 0,
      red_hosts: hosts.filter(h => h.overall_status === 'RED').length,
      yellow_hosts: hosts.filter(h => h.overall_status === 'YELLOW').length,
      snap_vm_count: snap_vms.length,
      tools_issue_count: tools_issues.length,
      swapped_vm_count: realVms.filter(v => v.swapped_mb > 0).length,
      thin_vm_count: thin_vms,
      thick_vm_count: thick_vms,
      vhw_legacy_count: vhw_legacy,
      vhw_mid_count: vhw_mid,
      vhw_current_count: vhw_current,
      vm_to_core_ratio: total_host_cores ? Math.round(total_vms / total_host_cores * 100) / 100 : 0,
      vm_to_host_ratio: total_hosts ? Math.round(total_vms / total_hosts * 100) / 100 : 0,
      vcpu_to_core_ratio: total_host_cores ? Math.round(total_vcpus / total_host_cores * 100) / 100 : 0,
    },
    hosts,
    vms: realVms,
    templates: vms.filter(v => v.is_template === 'Yes'),
    clusters,
    overcommitment,
    usage,
    os_dist,
    vcpu_dist,
    vhw_dist,
    mem_size_dist,
    compression,
    thin_info,
    datastores,
    dvs,
    snap_vms,
    tools_issues,
    top_cpu_vms,
    top_ram_vms,
    build_dist,
    esxi_versions: [...new Set(hosts.map(h => h.esxi_major).filter(Boolean))],
    hardware_models: countField(hosts, 'model'),
    hardware_vendors: countField(hosts, 'vendor'),
  };
}
