export function merge(vhstData, rvtoolsData) {
  if (!rvtoolsData) return vhstData;

  const rvHosts = Object.fromEntries(
    (rvtoolsData.hosts || []).map(h => [h.name, h])
  );

  for (const h of vhstData.hosts || []) {
    let rv = rvHosts[h.name];
    if (!rv) {
      // fuzzy match on short hostname
      const shortName = h.name.split('.')[0].toLowerCase();
      for (const [rvName, rvH] of Object.entries(rvHosts)) {
        if (rvName.split('.')[0].toLowerCase() === shortName) {
          rv = rvH;
          break;
        }
      }
    }
    if (rv) {
      h.serial = rv.serial || h.serial || '';
      h.service_tag = rv.service_tag || h.service_tag || '';
      h.bios_version = rv.bios_version || h.bios_version || '';
      h.bios_date = rv.bios_date || h.bios_date || '';
      h.nic_count = rv.nic_count || h.nic_count || 0;
      h.hba_count = rv.hba_count || h.hba_count || 0;
      h.evc_current = rv.evc_current || '';
      h.evc_max = rv.evc_max || '';
    }
  }

  vhstData.source = 'combined';
  return vhstData;
}
