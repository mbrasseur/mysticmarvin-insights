export const sf = v => parseFloat(v) || 0;
export const siInt = v => parseInt(v, 10) || 0;
export const ssStr = v => String(v ?? '').trim();

export const ESXI_EOS = {
  '6.0': '2022-03-12',
  '6.5': '2023-10-15',
  '6.7': '2022-10-15',
  '7.0': '2025-04-02',
  '8.0': '2027-10-11',
};

export const VCENTER_EOS = { ...ESXI_EOS };

export function esxiMajor(v) {
  const m = String(v || '').match(/^(\d+\.\d+)/);
  return m ? m[1] : '';
}

export function countField(items, field) {
  const dist = {};
  for (const item of items) {
    const v = item[field];
    if (v) dist[v] = (dist[v] || 0) + 1;
  }
  return dist;
}
