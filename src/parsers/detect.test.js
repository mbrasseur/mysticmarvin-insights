import { describe, it, expect } from 'vitest';
import { detectFileType } from './detect.js';

describe('detectFileType', () => {
  it('detects VHST from sheet names', () => {
    expect(detectFileType(['vCenters', 'Hosts', 'VMs', 'Clusters'])).toBe('vhst');
  });
  it('detects RVTools from sheet names', () => {
    expect(detectFileType(['vInfo', 'vHost', 'vCluster', 'vMetaData'])).toBe('rvtools');
  });
  it('returns unknown for unrecognized sheets', () => {
    expect(detectFileType(['Sheet1', 'Sheet2'])).toBe('unknown');
  });
});
