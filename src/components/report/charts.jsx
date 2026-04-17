import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, DoughnutController, BarController,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController);

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export const COLORS = {
  get navy() { return getCSSVar('--navy') || '#0a2332'; },
  get red() { return getCSSVar('--red') || '#dc2626'; },
  get teal() { return getCSSVar('--teal') || '#1a4a5a'; },
  green: '#16a34a', yellow: '#ca8a04', orange: '#ea580c', danger: '#dc2626',
  navyAlpha: (a) => { const v = getCSSVar('--navy') || '#0a2332'; return v + Math.round(a * 255).toString(16).padStart(2, '0'); },
  tealAlpha: (a) => { const v = getCSSVar('--teal') || '#1a4a5a'; return v + Math.round(a * 255).toString(16).padStart(2, '0'); },
};

export const OC_COLORS = (pct) => {
  if (pct >= 200) return COLORS.danger;
  if (pct >= 130) return COLORS.orange;
  if (pct >= 100) return COLORS.yellow;
  return COLORS.green;
};

export const STORAGE_COLOR = (pct) => {
  if (pct >= 85) return COLORS.danger;
  if (pct >= 60) return COLORS.orange;
  return COLORS.green;
};

export const VHW_COLORS = {
  'vmx-07': '#7f1d1d', 'vmx-08': '#991b1b', 'vmx-09': '#dc2626',
  'vmx-10': '#f97316', 'vmx-11': '#fb923c',
  'vmx-13': '#f59e0b', 'vmx-14': '#eab308',
  'vmx-15': '#84cc16',
  'vmx-19': '#4ade80', 'vmx-20': '#22c55e',
  'vmx-21': '#16a34a',
};

export function DonutChart({ labels, data, colors, size = 160, title, centerText }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new ChartJS(ref.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: {
        responsive: false, cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.formattedValue}` } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify({ labels, data, colors })]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {title && <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textAlign: 'center' }}>{title}</p>}
      <div style={{ position: 'relative', width: size, height: size }}>
        <canvas ref={ref} width={size} height={size} />
        {centerText && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--mono)', lineHeight: 1 }}>
              {centerText.value}
            </div>
            <div style={{ fontSize: 9, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {centerText.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function HBarChart({ labels, datasets, title, height, stacked = false, xLabel }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new ChartJS(ref.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: datasets.length > 1, position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: (c) => ` ${c.dataset.label || ''}: ${typeof c.raw === 'number' ? c.raw.toFixed(1) : c.raw}${xLabel || ''}` } },
        },
        scales: {
          x: { stacked, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
          y: { stacked, grid: { display: false }, ticks: { font: { size: 10 } } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify({ labels, datasets, stacked })]);

  return (
    <div>
      {title && <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>{title}</p>}
      <div style={{ height: height || Math.max(labels.length * 28, 80) }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}

export function VBarChart({ labels, datasets, title, height = 200, stacked = false, yLabel }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new ChartJS(ref.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: datasets.length > 1, position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: (c) => ` ${c.dataset.label || ''}: ${typeof c.raw === 'number' ? c.raw.toFixed(1) : c.raw}${yLabel || ''}` } },
        },
        scales: {
          x: { stacked, grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { stacked, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify({ labels, datasets, stacked })]);

  return (
    <div>
      {title && <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>{title}</p>}
      <div style={{ height }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}

export function GaugeBar({ value, max = 100, color, label, sublabel }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--navy)', fontFamily: 'var(--mono)' }}>
            {value.toFixed(1)}{sublabel}
          </span>
        </div>
      )}
      <div className="mini-bar" style={{ height: 8 }}>
        <div className="mini-bar-fill" style={{ width: `${pct}%`, background: color || 'var(--teal)' }} />
      </div>
    </div>
  );
}
