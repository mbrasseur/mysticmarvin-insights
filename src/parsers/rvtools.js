import * as XLSX from 'xlsx';
import { sf, siInt, ssStr, esxiMajor, countField, ESXI_EOS } from './utils.js';

function vhwNum(s) {
  const m = String(s).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export function parseRvtools(arrayBuffer) {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const sheet = name => wb.Sheets[name]
    ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' })
    : [];

  // vMetaData — find vcenter name
  let vcenterName = '';
  for (const row of sheet('vMetaData')) {
    const keys = Object.keys(row);
    if (keys.length < 2) continue;
    const key = ssStr(row[keys[0]]);
    const val = ssStr(row[keys[1]]);
    if (key.toLowerCase().includes('vcenter')) vcenterName = val;
  }

  // vHost
  const hosts = sheet('vHost')
    .filter(h => ssStr(h.Host))
    .map(h => {
      const version = ssStr(h['ESX Version'] || '');
      const major = esxiMajor(version);
      const coresPerCpu = siInt(h['Cores per CPU'] || 0);
      const numCpus = siInt(h['# CPU'] || 0);
      const totalCores = siInt(h['# Cores'] || coresPerCpu * numCpus);
      const memGb = sf(h['# Memory'] || 0) / 1024;
      const htActive = ssStr(h['HT Active'] || '') === 'True';
      return {
        name: ssStr(h.Host),
        cluster: ssStr(h.Cluster || ''),
        datacenter: ssStr(h.Datacenter || ''),
        model: ssStr(h.Model || ''),
        vendor: ssStr(h.Vendor || ''),
        cpu_type: ssStr(h['CPU Model'] || ''),
        cpu_sockets: numCpus,
        cores: totalCores,
        threads: totalCores * (htActive ? 2 : 1),
        cpu_usage_pct: sf(h['CPU usage %'] || 0),
        ram_gb: Math.round(memGb * 10) / 10,
        ram_usage_pct: sf(h['Memory usage %'] || 0),
        version,
        build: '',
        esxi_major: major,
        overall_status: ssStr(h['Config status'] || 'GREEN').toUpperCase(),
        uptime_sec: 0,
        server_vms: siInt(h['# VMs'] || 0),
        desktop_vms: 0,
        total_vms: siInt(h['# VMs total'] || h['# VMs'] || 0),
        eos_date: ESXI_EOS[major] || '',
        serial: ssStr(h['Serial number'] || ''),
        service_tag: ssStr(h['Service tag'] || ''),
        bios_version: ssStr(h['BIOS Version'] || ''),
        bios_date: ssStr(h['BIOS Date'] || ''),
        evc_current: ssStr(h['Current EVC'] || ''),
        evc_max: ssStr(h['Max EVC'] || ''),
        nic_count: 0,
        hba_count: 0,
      };
    });

  // NIC counts
  const nicCounts = {};
  for (const r of sheet('vNIC')) {
    const h = ssStr(r.Host || '');
    if (h) nicCounts[h] = (nicCounts[h] || 0) + 1;
  }
  for (const h of hosts) h.nic_count = nicCounts[h.name] || 0;

  // HBA counts
  const hbaCounts = {};
  for (const r of sheet('vHBA')) {
    const h = ssStr(r.Host || '');
    if (h) hbaCounts[h] = (hbaCounts[h] || 0) + 1;
  }
  for (const h of hosts) h.hba_count = hbaCounts[h.name] || 0;

  // vInfo → VMs
  const vms = sheet('vInfo')
    .filter(v => ssStr(v.VM))
    .map(v => {
      const isTemplate = ['TRUE', 'YES', '1'].includes(ssStr(v.Template || '').toUpperCase());
      const power = ssStr(v.Powerstate || '');
      return {
        name: ssStr(v.VM),
        cluster: ssStr(v.Cluster || ''),
        host: ssStr(v.Host || ''),
        datacenter: ssStr(v.Datacenter || ''),
        vcpus: 0,
        ram_mb: 0,
        guest_os: ssStr(v['OS according to the VMware Tools'] || v['Guest OS'] || ''),
        tools_status: ssStr(v['Toolsversion status'] || ''),
        vhw_version: ssStr(v['HW version'] || ''),
        thin_provisioned: ssStr(v.Thin || 'FALSE').toUpperCase() === 'TRUE' ? 'Yes' : 'No',
        power_state: power.toLowerCase().includes('on') ? 'POWERED_ON' : 'POWERED_OFF',
        snapshots: 0,
        storage_committed_gb: 0,
        storage_uncommitted_gb: 0,
        cpu_usage_mhz: 0,
        ram_usage_mb: 0,
        swapped_mb: 0,
        ballooned_mb: 0,
        is_template: isTemplate ? 'Yes' : 'No',
      };
    });

  // Fill vcpus from vCPU sheet
  const vcpuMap = {};
  for (const r of sheet('vCPU')) vcpuMap[ssStr(r.VM || '')] = siInt(r.CPUs || 0);
  for (const v of vms) v.vcpus = vcpuMap[v.name] || 0;

  // Fill ram from vMemory
  const vmByName = new Map(vms.map(v => [v.name, v]));
  for (const r of sheet('vMemory')) {
    const vm = vmByName.get(ssStr(r.VM || ''));
    if (vm) {
      vm.ram_mb = sf(r['Size MiB'] || 0);
      vm.swapped_mb = sf(r['Swapped MiB'] || 0);
      vm.ballooned_mb = sf(r['Balloon MiB'] || 0);
    }
  }

  // Snapshots
  const snapCounts = {};
  for (const r of sheet('vSnapshot')) {
    const n = ssStr(r.VM || '');
    if (n) snapCounts[n] = (snapCounts[n] || 0) + 1;
  }
  for (const v of vms) v.snapshots = snapCounts[v.name] || 0;

  // Disk storage
  const diskGb = {};
  for (const r of sheet('vDisk')) {
    const n = ssStr(r.VM || '');
    if (n) diskGb[n] = (diskGb[n] || 0) + sf(r['Capacity MiB'] || 0) / 1024;
  }
  for (const v of vms) v.storage_committed_gb = Math.round((diskGb[v.name] || 0) * 100) / 100;

  // Clusters
  const clusters = sheet('vCluster')
    .filter(c => ssStr(c.Name))
    .map(c => {
      const totalMemMb = sf(c.TotalMemory || 0) / (1024 * 1024);
      return {
        name: ssStr(c.Name),
        num_hosts: siInt(c.NumHosts || 0),
        num_vms: 0,
        ha_enabled: ssStr(c['HA enabled'] || ''),
        drs_enabled: ssStr(c['DRS Enabled'] || ''),
        evc_mode: ssStr(c['EVC ModeKey'] || ''),
        vsan_enabled: ssStr(c['vSAN Enabled'] || ''),
        num_vmotions: siInt(c['Num VMotions'] || 0),
        total_cpu_mhz: sf(c.TotalCpu || 0),
        total_memory_mb: Math.round(totalMemMb),
        num_datastores: 0,
        cpu_oc_pct: 0,
        mem_oc_pct: 0,
        cpu_usage_pct: 0,
        mem_usage_pct: 0,
      };
    });

  const realVms = vms.filter(v => v.is_template === 'No');

  // Fill cluster VM counts
  for (const c of clusters) {
    c.num_vms = realVms.filter(v => v.cluster === c.name).length;
  }

  // Compute overcommit
  const overcommitment = clusters.map(c => {
    const cVms = realVms.filter(v => v.cluster === c.name);
    const cHosts = hosts.filter(h => h.cluster === c.name);
    const cCores = cHosts.reduce((s, h) => s + h.cores, 0) * 2;
    const cRamMb = cHosts.reduce((s, h) => s + h.ram_gb, 0) * 1024;
    const cVcpus = cVms.reduce((s, v) => s + v.vcpus, 0);
    const cVramMb = cVms.reduce((s, v) => s + v.ram_mb, 0);
    const cpu_oc = cCores ? Math.round(cVcpus / cCores * 1000) / 10 : 0;
    const mem_oc = cRamMb ? Math.round(cVramMb / cRamMb * 1000) / 10 : 0;
    c.cpu_oc_pct = cpu_oc;
    c.mem_oc_pct = mem_oc;
    c.cpu_usage_pct = cHosts.length ? Math.round(cHosts.reduce((s, h) => s + h.cpu_usage_pct, 0) / cHosts.length * 10) / 10 : 0;
    c.mem_usage_pct = cHosts.length ? Math.round(cHosts.reduce((s, h) => s + h.ram_usage_pct, 0) / cHosts.length * 10) / 10 : 0;
    return { cluster_key: c.name, cpu_oc_pct: cpu_oc, mem_oc_pct: mem_oc };
  });

  // Datastores
  const datastores = sheet('vDatastore')
    .filter(r => ssStr(r.Name))
    .map(r => {
      const total_gb = sf(r['Capacity MiB'] || 0) / 1024;
      const used_gb = sf(r['In Use MiB'] || 0) / 1024;
      const free_pct = sf(r['Free %'] || 0);
      const used_pct = free_pct > 0 ? 100 - free_pct : (total_gb > 0 ? used_gb / total_gb * 100 : 0);
      return {
        name: ssStr(r.Name),
        fs_type: ssStr(r.Type || ''),
        vmfs_version: '',
        used_gb: Math.round(used_gb * 10) / 10,
        total_gb: Math.round(total_gb * 10) / 10,
        used_pct: Math.round(used_pct * 10) / 10,
        num_vms: siInt(r['# VMs'] || 0),
      };
    })
    .sort((a, b) => b.used_pct - a.used_pct)
    .slice(0, 50);

  // DVS
  const dvs = sheet('dvSwitch')
    .filter(r => ssStr(r.Name))
    .map(r => ({
      name: ssStr(r.Name),
      type: 'dvSwitch',
      version: ssStr(r.Version || ''),
      num_hosts: 0, // RVTools dvSwitch sheet has port count, not host count
      vm_count: 0,
    }));

  // Distributions
  const os_dist = {};
  const vhw_dist = {};
  const mem_size_dist = { '1-3 GB': 0, '4-16 GB': 0, '17-64 GB': 0, '65-128 GB': 0, '>128 GB': 0 };
  const vcpu_counts = {};
  for (const v of realVms) {
    if (v.guest_os) os_dist[v.guest_os] = (os_dist[v.guest_os] || 0) + 1;
    if (v.vhw_version) vhw_dist[v.vhw_version] = (vhw_dist[v.vhw_version] || 0) + 1;
    const gb = v.ram_mb / 1024;
    if (gb <= 3) mem_size_dist['1-3 GB']++;
    else if (gb <= 16) mem_size_dist['4-16 GB']++;
    else if (gb <= 64) mem_size_dist['17-64 GB']++;
    else if (gb <= 128) mem_size_dist['65-128 GB']++;
    else mem_size_dist['>128 GB']++;
    const label = `${v.vcpus} vCPU`;
    vcpu_counts[label] = (vcpu_counts[label] || 0) + 1;
  }

  const total_hosts = hosts.length;
  const total_vms = realVms.length;
  const total_host_cores = hosts.reduce((s, h) => s + h.cores, 0);
  const total_host_ram_gb = hosts.reduce((s, h) => s + h.ram_gb, 0);
  const total_vcpus = realVms.reduce((s, v) => s + v.vcpus, 0);
  const total_vram_gb = realVms.reduce((s, v) => s + v.ram_mb, 0) / 1024;
  const total_ds_gb = datastores.reduce((s, d) => s + d.total_gb, 0);
  const total_ds_used_gb = datastores.reduce((s, d) => s + d.used_gb, 0);
  const snap_vms = vms.filter(v => v.snapshots > 0).slice(0, 30);
  const tools_issues = realVms.filter(v => !['toolsOk', '', 'guestToolsCurrent'].includes(v.tools_status));
  const vhw_legacy = Object.entries(vhw_dist).filter(([k]) => vhwNum(k) <= 11).reduce((s, [, c]) => s + c, 0);
  const vhw_mid = Object.entries(vhw_dist).filter(([k]) => vhwNum(k) >= 12 && vhwNum(k) <= 15).reduce((s, [, c]) => s + c, 0);
  const vhw_current = Object.entries(vhw_dist).filter(([k]) => vhwNum(k) >= 19).reduce((s, [, c]) => s + c, 0);
  const thin_vms = vms.filter(v => v.thin_provisioned === 'Yes').length;
  const thick_vms = vms.filter(v => v.thin_provisioned === 'No').length;
  const build_dist = {};
  for (const h of hosts) if (h.build) build_dist[h.build] = (build_dist[h.build] || 0) + 1;

  return {
    source: 'rvtools',
    vcenter_name: vcenterName,
    vcenter_version: '',
    vcenter_build: '',
    vcenter_eos: '',
    summary: {
      total_hosts,
      total_vms,
      total_templates: vms.filter(v => v.is_template === 'Yes').length,
      powered_on: realVms.filter(v => v.power_state === 'POWERED_ON').length,
      powered_off: realVms.filter(v => v.power_state === 'POWERED_OFF').length,
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
    usage: [],
    os_dist,
    vcpu_dist: vcpu_counts,
    vhw_dist,
    mem_size_dist,
    compression: [],
    thin_info: {},
    datastores,
    dvs,
    snap_vms,
    tools_issues,
    top_cpu_vms: [],
    top_ram_vms: [],
    build_dist,
    esxi_versions: [...new Set(hosts.map(h => h.esxi_major).filter(Boolean))],
    hardware_models: countField(hosts, 'model'),
    hardware_vendors: countField(hosts, 'vendor'),
  };
}
