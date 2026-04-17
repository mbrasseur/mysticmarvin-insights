import { describe, it, expect } from 'vitest';
import { merge } from './merger.js';

const baseVhst = {
  source: 'vhst',
  vcenter_name: 'vc01',
  hosts: [
    { name: 'esxi01.lab.local', serial: '', service_tag: '', bios_version: '', bios_date: '', nic_count: 0, hba_count: 0 },
    { name: 'esxi02.lab.local', serial: 'OLD', service_tag: '', bios_version: '', bios_date: '', nic_count: 0, hba_count: 0 },
  ],
};

const rvData = {
  hosts: [
    { name: 'esxi01.lab.local', serial: 'SN001', service_tag: 'TAG001', bios_version: '2.10', bios_date: '2023-01', nic_count: 4, hba_count: 2, evc_current: 'intel-broadwell', evc_max: 'intel-cascadelake' },
  ],
};

describe('merge', () => {
  it('returns vhst data unchanged when no rvtools', () => {
    const result = merge({ ...baseVhst }, null);
    expect(result.source).toBe('vhst');
  });

  it('merges hardware detail from rvtools into vhst hosts', () => {
    const result = merge(baseVhst, rvData);
    expect(result.source).toBe('combined');
    const h1 = result.hosts.find(h => h.name === 'esxi01.lab.local');
    expect(h1.serial).toBe('SN001');
    expect(h1.nic_count).toBe(4);
    expect(h1.evc_current).toBe('intel-broadwell');
  });

  it('does fuzzy match on short hostname', () => {
    const vhst = { source: 'vhst', hosts: [{ name: 'esxi01', serial: '', service_tag: '', bios_version: '', bios_date: '', nic_count: 0, hba_count: 0 }] };
    const rv = { hosts: [{ name: 'esxi01.lab.local', serial: 'FUZZY', service_tag: '', bios_version: '', bios_date: '', nic_count: 1, hba_count: 0, evc_current: '', evc_max: '' }] };
    const result = merge(vhst, rv);
    expect(result.hosts[0].serial).toBe('FUZZY');
  });

  it('preserves zero nic_count from rvtools', () => {
    const vhst = { source: 'vhst', hosts: [{ name: 'h1', serial: '', service_tag: '', bios_version: '', bios_date: '', nic_count: 99, hba_count: 0 }] };
    const rv = { hosts: [{ name: 'h1', serial: '', service_tag: '', bios_version: '', bios_date: '', nic_count: 0, hba_count: 0, evc_current: '', evc_max: '' }] };
    const result = merge(vhst, rv);
    expect(result.hosts[0].nic_count).toBe(0);
  });
});
