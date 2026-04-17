// app/src/hooks/useScopedData.js
import { useMemo } from 'react';

/**
 * Filters fleet data by scope.
 * scope: { vcenter: null|string, datacenter: null|string, cluster: null|string }
 * Returns: { vcenters, hosts, vms, clusters }
 *
 * Future: replace useMemo body with a backend API call using scope as query params.
 * Component interfaces stay identical.
 */
export function useScopedData(data, scope) {
  return useMemo(() => {
    if (!data?.vcenters) return { vcenters: [], hosts: [], vms: [], clusters: [] };

    const allVcenters = data.vcenters;
    const vcenters = scope?.vcenter
      ? allVcenters.filter(vc => vc.vcenter_name === scope.vcenter)
      : allVcenters;

    const hosts = vcenters.flatMap(vc => vc.hosts || []);
    const vms = vcenters.flatMap(vc => vc.vms || []);
    const clusters = vcenters.flatMap(vc => vc.clusters || []);

    return { vcenters, hosts, vms, clusters };
  }, [data, scope?.vcenter, scope?.datacenter, scope?.cluster]);
}
