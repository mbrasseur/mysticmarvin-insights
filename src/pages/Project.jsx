import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, ChevronRight, Trash2, BarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { listProjects, updateProject, deleteProject, saveProjectData, loadProjectData } from '../storage/index.js';
import { detectFileType } from '../parsers/detect.js';
import { parseVhst } from '../parsers/vhst.js';
import { parseRvtools } from '../parsers/rvtools.js';
import { merge } from '../parsers/merger.js';
import { Breadcrumb } from '../components/Layout.jsx';

function buildCombinedData(fileEntries) {
  const byVcenter = {};
  for (const { parsed } of fileEntries) {
    const key = parsed.vcenter_name || '__unknown__';
    if (!byVcenter[key]) byVcenter[key] = { vhst: null, rv: null };
    if (parsed.source === 'rvtools') byVcenter[key].rv = parsed;
    else byVcenter[key].vhst = parsed;
  }

  const vcenters = [];
  for (const [, { vhst, rv }] of Object.entries(byVcenter)) {
    if (vhst) vcenters.push(merge(vhst, rv));
    else if (rv) vcenters.push(rv);
  }

  const fleet = {
    total_hosts: vcenters.reduce((s, v) => s + v.summary.total_hosts, 0),
    total_vms: vcenters.reduce((s, v) => s + v.summary.total_vms, 0),
    total_vcpus: vcenters.reduce((s, v) => s + v.summary.total_vcpus, 0),
    total_host_cores: vcenters.reduce((s, v) => s + v.summary.total_host_cores, 0),
    total_host_ram_gb: vcenters.reduce((s, v) => s + v.summary.total_host_ram_gb, 0),
    total_vram_gb: vcenters.reduce((s, v) => s + v.summary.total_vram_gb, 0),
    total_storage_gb: vcenters.reduce((s, v) => s + v.summary.total_storage_gb, 0),
    used_storage_gb: vcenters.reduce((s, v) => s + v.summary.used_storage_gb, 0),
  };

  return { vcenters, fleet };
}

export default function Project() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = listProjects().find(p => p.id === projectId);

  const [files, setFiles] = useState(() => project?.files || []);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!project) navigate('/', { replace: true });
  }, [project, navigate]);

  if (!project) return null;

  async function processFile(file) {
    let buf;
    try {
      buf = await file.arrayBuffer();
    } catch {
      throw new Error(`${file.name}: failed to read file`);
    }
    const wb = XLSX.read(buf, { type: 'array' });
    const type = detectFileType(wb.SheetNames);
    if (type === 'unknown') throw new Error(`${file.name}: unrecognized format (not VHST or RVTools)`);
    const parsed = type === 'vhst' ? parseVhst(buf) : parseRvtools(buf);
    return { name: file.name, type, vcenterName: parsed.vcenter_name, parsed };
  }

  async function handleFiles(newFiles) {
    if (!newFiles.length) return;
    setParsing(true);
    setError('');
    try {
      const settled = await Promise.allSettled(Array.from(newFiles).map(processFile));
      const succeeded = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = settled.filter(r => r.status === 'rejected').map(r => r.reason.message);

      if (succeeded.length > 0) {
        const updatedFiles = [...files, ...succeeded];
        setFiles(updatedFiles);
        updateProject(projectId, { files: updatedFiles.map(f => ({ name: f.name, type: f.type, vcenterName: f.vcenterName })) });
        saveProjectData(projectId, buildCombinedData(updatedFiles));
      }
      if (failed.length > 0) {
        setError(failed.join(' | '));
      }
    } finally {
      setParsing(false);
    }
  }

  function removeFile(idx) {
    const updatedFiles = files.filter((_, i) => i !== idx);
    setFiles(updatedFiles);
    updateProject(projectId, { files: updatedFiles.map(f => ({ name: f.name, type: f.type, vcenterName: f.vcenterName })) });
    if (updatedFiles.length > 0) {
      saveProjectData(projectId, buildCombinedData(updatedFiles));
    }
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [files]);

  const hasData = loadProjectData(projectId) !== null && files.length > 0;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 32px' }}>
      <Breadcrumb items={[{ label: project.name }]} />

      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 24 }}>
        {project.name}
      </h1>

      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          border: `2px dashed ${dragOver ? 'var(--teal)' : 'rgba(0,196,180,0.25)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          background: dragOver ? 'rgba(0,196,180,0.06)' : 'var(--bg-surface)',
          marginBottom: 24,
          transition: 'all 0.15s',
          pointerEvents: parsing ? 'none' : 'auto',
        }}
      >
        <Upload size={28} color="var(--text-muted)" style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>Drop VHST or RVTools xlsx files here</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>or</div>
        <label style={{
          display: 'inline-block', padding: '8px 20px',
          background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
          color: 'var(--bg-deep)',
          borderRadius: 'var(--radius)', cursor: 'pointer',
          fontSize: 'var(--text-sm)', fontWeight: 700,
        }}>
          Browse files
          <input
            type="file" accept=".xlsx" multiple hidden
            disabled={parsing}
            onChange={e => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {parsing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 16, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          <span className="spinner" />
          Parsing files… Cela peut prendre un moment pour les gros exports.
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', marginBottom: 16, color: 'var(--status-danger)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Imported files
          </div>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'var(--bg-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-subtle)', marginBottom: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSpreadsheet size={14} color="var(--teal)" />
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {f.type.toUpperCase()} · {f.vcenterName || 'unknown vCenter'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeFile(i)}
                aria-label={`Remove file ${f.name}`}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <button
          onClick={() => navigate(`/projects/${projectId}/report`)}
          onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter=''}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px',
            background: 'linear-gradient(135deg, var(--teal), var(--teal-dim))',
            color: 'var(--bg-deep)', border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: 'var(--text-md)', fontWeight: 700, cursor: 'pointer',
            transition: 'filter 0.12s ease',
          }}
        >
          <BarChart2 size={16} /> View Report <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
