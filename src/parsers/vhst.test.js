import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseVhst } from './vhst.js';

function makeWorkbook(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
  }
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  // xlsx 0.18+ returns ArrayBuffer directly; older versions return Uint8Array
  return buf instanceof ArrayBuffer ? buf : buf.buffer;
}

describe('parseVhst', () => {
  it('parses vcenter name, hosts and VMs', () => {
    const buf = makeWorkbook({
      vCenters: [{ vcName: 'vc01.lab.local', vcVersion: '8.0.1', vcBuildNumber: '21560480' }],
      Hosts: [{
        name: 'esxi01.lab.local', cluster: 'Cluster-01', datacenter: 'DC1',
        model: 'PowerEdge R640', vendor: 'Dell Inc.', cpuType: 'Intel Xeon',
        cpus: 2, cores: 24, threads: 48, cpuUsage: 15.5,
        ramInGb: 256, ramUsage: 60.2, version: '8.0.3', build: '22348816',
        overallStatus: 'GREEN', hostUptime: 1234567,
        serverVms: 20, desktopVms: 0, serviceTag: 'ABC123', biosVersion: '2.15.0',
      }],
      VMs: [{
        name: 'vm-web-01', cluster: 'Cluster-01', hostName: 'esxi01.lab.local',
        datacenter: 'DC1', numCpus: 4, memoryInMb: 8192,
        guestOs: 'Ubuntu Linux (64-bit)', toolsStatus: 'toolsOk',
        version: 'vmx-19', thinProvisioned: 'Yes', powerState: 'POWERED_ON',
        snapshots: 0, storageCommitted: 21474836480, storageUncommitted: 0,
        isTemplate: 'No',
      }],
      Clusters: [{
        clusterName: 'Cluster-01', numHosts: 1, numVms: 1,
        haEnabled: 'True', drsEnabled: 'True', evcMode: 'intel-broadwell',
        vsanEnabled: 'False', numVmotions: 42,
        totalCpuMhz: 48000, totalMemoryMb: 262144, numDatastores: 3,
      }],
      overcommitment: [],
      'MEM and CPU Usage': [],
      'OS Count': [{ 'Guest OS': 'Ubuntu Linux (64-bit)', Count: 1 }],
      'vCPU Distribution': [{ 'Num vCpu': '4', 'Num Vms': 1 }],
      'Memory Compression': [],
      'Potential ThinProv Savings': [],
      Datastores: [{
        datastoreName: 'ds-ssd-01', fileSystemType: 'VMFS', vmfsVersion: '6',
        totalCapacity: 4096, usedCapacity: 2048, numVms: 1,
      }],
      DVS: [],
    });

    const result = parseVhst(buf);
    expect(result.vcenter_name).toBe('vc01.lab.local');
    expect(result.vcenter_version).toBe('8.0.1');
    expect(result.hosts).toHaveLength(1);
    expect(result.hosts[0].name).toBe('esxi01.lab.local');
    expect(result.hosts[0].cores).toBe(24);
    expect(result.vms).toHaveLength(1);
    expect(result.vms[0].vcpus).toBe(4);
    expect(result.vms[0].storage_committed_gb).toBe(20);
    expect(result.summary.total_hosts).toBe(1);
    expect(result.summary.total_vms).toBe(1);
    expect(result.summary.total_storage_gb).toBe(4096);
    expect(result.os_dist['Ubuntu Linux (64-bit)']).toBe(1);
  });
});
