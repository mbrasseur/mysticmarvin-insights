import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseRvtools } from './rvtools.js';

function makeWorkbook(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
  }
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return buf instanceof ArrayBuffer ? buf : buf.buffer;
}

describe('parseRvtools', () => {
  it('parses hosts, VMs, and clusters', () => {
    const buf = makeWorkbook({
      vMetaData: [
        { col1: 'vCenter', col2: 'vc02.lab.local' },
        { col1: 'Collection Date', col2: '2026-03-01' },
      ],
      vHost: [{
        Host: 'esxi02.lab.local', Cluster: 'Cluster-02', Datacenter: 'DC1',
        Model: 'PowerEdge R740', Vendor: 'Dell Inc.',
        'CPU Model': 'Intel Xeon Gold 6226R',
        '# CPU': 2, 'Cores per CPU': 16, '# Cores': 32,
        '# Memory': 262144, 'Memory usage %': 55,
        'CPU usage %': 20, 'ESX Version': '8.0.3',
        'Config status': 'green', '# VMs': 15,
        'Serial number': 'XYZ789', 'Service tag': 'XYZ789',
        'BIOS Version': '2.10.0', 'BIOS Date': '2023-01-15',
        'HT Active': 'True',
      }],
      vNIC: [{ Host: 'esxi02.lab.local', NIC: 'vmnic0' }, { Host: 'esxi02.lab.local', NIC: 'vmnic1' }],
      vHBA: [{ Host: 'esxi02.lab.local', HBA: 'vmhba0' }],
      vInfo: [{
        VM: 'vm-db-01', Cluster: 'Cluster-02', Host: 'esxi02.lab.local',
        Datacenter: 'DC1', Template: 'FALSE',
        'OS according to the VMware Tools': 'Windows Server 2022',
        'Toolsversion status': 'guestToolsCurrent',
        'HW version': 'vmx-19', Thin: 'TRUE', Powerstate: 'poweredOn',
      }],
      vCPU: [{ VM: 'vm-db-01', CPUs: 8 }],
      vMemory: [{ VM: 'vm-db-01', 'Size MiB': 16384, 'Swapped MiB': 0, 'Balloon MiB': 0 }],
      vSnapshot: [],
      vDisk: [{ VM: 'vm-db-01', 'Capacity MiB': 102400 }],
      vCluster: [{
        Name: 'Cluster-02', NumHosts: 1,
        'HA enabled': 'True', 'DRS Enabled': 'True',
        'EVC ModeKey': 'intel-cascadelake', 'vSAN Enabled': 'False',
        'Num VMotions': 10, TotalCpu: 51200, TotalMemory: 274877906944,
      }],
      vDatastore: [{
        Name: 'ds-nvme-01', Type: 'VMFS',
        'Capacity MiB': 2097152, 'In Use MiB': 1048576, 'Free %': 50, '# VMs': 1,
      }],
      dvSwitch: [],
    });

    const result = parseRvtools(buf);
    expect(result.vcenter_name).toBe('vc02.lab.local');
    expect(result.hosts).toHaveLength(1);
    expect(result.hosts[0].nic_count).toBe(2);
    expect(result.hosts[0].hba_count).toBe(1);
    expect(result.hosts[0].cores).toBe(32);
    expect(result.vms).toHaveLength(1);
    expect(result.vms[0].vcpus).toBe(8);
    expect(result.vms[0].ram_mb).toBe(16384);
    expect(result.summary.total_hosts).toBe(1);
    expect(result.summary.total_vms).toBe(1);
  });
});
