export function merge(vhstData, rvtoolsData) {
  if (!rvtoolsData) return vhstData;

  const shortName = s => s.split('.')[0].toLowerCase();

  // Build lookup maps: exact name and short name
  const rvByExact = new Map();
  const rvByShort = new Map();
  for (const h of rvtoolsData.hosts || []) {
    rvByExact.set(h.name, h);
    if (!rvByShort.has(shortName(h.name))) rvByShort.set(shortName(h.name), h);
  }

  const mergedHosts = (vhstData.hosts || []).map(h => {
    const rv = rvByExact.get(h.name) ?? rvByShort.get(shortName(h.name));
    if (!rv) return h;
    return {
      ...h,
      serial: rv.serial || h.serial || '',
      service_tag: rv.service_tag || h.service_tag || '',
      bios_version: rv.bios_version || h.bios_version || '',
      bios_date: rv.bios_date || h.bios_date || '',
      nic_count: rv.nic_count ?? h.nic_count ?? 0,
      hba_count: rv.hba_count ?? h.hba_count ?? 0,
      evc_current: rv.evc_current || h.evc_current || '',
      evc_max: rv.evc_max || h.evc_max || '',
    };
  });

  return { ...vhstData, source: 'combined', hosts: mergedHosts };
}
