export function detectFileType(sheetNames) {
  const names = new Set(sheetNames);
  if (names.has('vCenters') && names.has('Hosts') && names.has('VMs')) return 'vhst';
  if (names.has('vInfo') && names.has('vHost')) return 'rvtools';
  return 'unknown';
}
