import React, { useEffect, useMemo, useState } from 'react';
import './AveriasDashboard.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AveriasDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState<number>(0); // 0 = mes actual, -1 = mes anterior
  const [stats, setStats] = useState<{ total: number; pendientes: number; resueltos: number; promedioHorasResolucion: number | null } | null>(null);
  const [prevStats, setPrevStats] = useState<{ total: number; pendientes: number; resueltos: number; promedioHorasResolucion: number | null } | null>(null);
  const [agg, setAgg] = useState<{ categoria: { key: string; count: number }[]; prioridad: { key: string; count: number }[] } | null>(null);
  const [topClients, setTopClients] = useState<{ clienteId: string; nombre: string; codigo: string; count: number }[] | null>(null);
  const [techStats, setTechStats] = useState<{ tecnico: string; count: number }[] | null>(null);
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [usingRange, setUsingRange] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [{ averiasService }] = await Promise.all([import('../services/averiasService')]);
        if (usingRange && range.from && range.to) {
          const [s, p, a] = await Promise.all([
            averiasService.statsRange(range.from, range.to),
            averiasService.statsRange(range.from, range.to),
            averiasService.aggregationsRange(range.from, range.to),
          ]);
          if (mounted) {
            setStats(s);
            setPrevStats(p);
            setAgg(a);
          }
        } else {
          const [s, p, a, tc, ts] = await Promise.all([
            averiasService.statsMes(offset),
            averiasService.statsMes(offset - 1),
            averiasService.aggregationsMes(offset),
            averiasService.getTopClients(),
            averiasService.getTechnicianStats(),
          ]);
          if (mounted) {
            setStats(s);
            setPrevStats(p);
            setAgg(a);
            setTopClients(tc);
            setTechStats(ts);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [offset, usingRange, range.from, range.to]);

  useEffect(() => {
    const handler = () => {
      // Recarga silenciosa
      setOffset(prev => prev); // trigger effect
    };
    window.addEventListener('averias:updated', handler);
    return () => window.removeEventListener('averias:updated', handler);
  }, []);

  const cssVar = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  };

  const cards = useMemo(() => {
    const total = stats?.total ?? 0;
    const pend = stats?.pendientes ?? 0;
    const res = stats?.resueltos ?? 0;
    const avg = stats?.promedioHorasResolucion ?? null;
    const pTotal = prevStats?.total ?? 0;
    const pPend = prevStats?.pendientes ?? 0;
    const pRes = prevStats?.resueltos ?? 0;
    const pAvg = prevStats?.promedioHorasResolucion ?? null;
    const pct = (cur: number, prev: number) => {
      if (prev === 0) return cur === 0 ? '' : '+100%';
      const v = ((cur - prev) / prev) * 100;
      const sign = v > 0 ? '+' : '';
      return `${sign}${v.toFixed(1)}%`;
    };
    const trend = (cur: number, prev: number, reverse = false) => {
      const up = cur >= prev;
      return reverse ? (!up ? 'up' : 'down') : (up ? 'up' : 'down');
    };
    return [
      { title: 'Tickets del mes', value: String(total), trend: trend(total, pTotal), pct: pct(total, pTotal), color: 'green', icon: 'assignment' },
      { title: 'Pendientes', value: String(pend), trend: trend(pend, pPend, true), pct: pct(pend, pPend), color: 'red', icon: 'pending_actions' },
      { title: 'Resueltos', value: String(res), trend: trend(res, pRes), pct: pct(res, pRes), color: 'blue', icon: 'task_alt' },
      { title: 'Tiempo prom. solución', value: avg !== null ? `${avg} h` : '—', trend: trend(avg ?? 0, pAvg ?? 0, true), pct: pAvg !== null && avg !== null ? pct(avg, pAvg) : '', color: 'yellow', icon: 'schedule' },
    ] as const;
  }, [stats, prevStats]);

  const categoriaData = useMemo(() => {
    const labels = (agg?.categoria ?? []).map(x => x.key);
    const data = (agg?.categoria ?? []).map(x => x.count);

    const createGradient = (ctx: any, chartArea: any) => {
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, 'rgba(79, 172, 254, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 242, 254, 0.9)');
      return gradient;
    };

    return {
      labels,
      datasets: [
        {
          label: 'Tickets por categoría',
          data,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(79, 172, 254, 0.8)';
            return createGradient(ctx, chartArea);
          },
          borderColor: 'rgba(79, 172, 254, 1)',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(0, 242, 254, 1)',
        },
      ],
    };
  }, [agg]);

  const prioridadData = useMemo(() => {
    const labels = (agg?.prioridad ?? []).map(x => x.key);
    const data = (agg?.prioridad ?? []).map(x => x.count);

    const createGradient = (ctx: any, chartArea: any) => {
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, 'rgba(11, 163, 96, 0.8)');
      gradient.addColorStop(1, 'rgba(60, 186, 146, 0.9)');
      return gradient;
    };

    return {
      labels,
      datasets: [
        {
          label: 'Tickets por prioridad',
          data,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(11, 163, 96, 0.8)';
            return createGradient(ctx, chartArea);
          },
          borderColor: 'rgba(60, 186, 146, 1)',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(60, 186, 146, 1)',
        },
      ],
    };
  }, [agg]);

  const technicianData = useMemo(() => {
    const labels = (techStats ?? []).map(x => x.tecnico);
    const data = (techStats ?? []).map(x => x.count);

    const createGradient = (ctx: any, chartArea: any) => {
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, 'rgba(250, 217, 97, 0.8)');
      gradient.addColorStop(1, 'rgba(247, 107, 28, 0.9)');
      return gradient;
    };

    return {
      labels,
      datasets: [
        {
          label: 'Tickets por técnico',
          data,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(250, 217, 97, 0.8)';
            return createGradient(ctx, chartArea);
          },
          borderColor: 'rgba(247, 107, 28, 1)',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(247, 107, 28, 1)',
        },
      ],
    };
  }, [techStats]);

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(45, 55, 72, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(103, 126, 234, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        cornerRadius: 8,
        titleFont: { size: 14, weight: '600' },
        bodyFont: { size: 13 },
      },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: {
          color: cssVar('--av-text', '#1f2937'),
          font: { size: 12, weight: '500' },
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: cssVar('--av-text', '#1f2937'),
          font: { size: 12, weight: '500' },
        },
        grid: {
          color: cssVar('--border-color', 'rgba(0,0,0,0.06)'),
          lineWidth: 1,
        },
        border: { display: false },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
  };

  const exportCSV = () => {
    // Implement CSV export logic here
  };

  const exportPDF = () => {
    // Implement PDF export logic here
  };

  return (
    <div className="av-page">
      <div className="av-toolbar">
        <div className="av-toolbar-title">Resumen del {offset === 0 ? 'mes actual' : 'mes anterior'}</div>
        <div className="av-toolbar-actions">
          <button className={`av-btn ${offset === -1 ? 'active' : ''}`} onClick={() => { setUsingRange(false); setOffset(-1); }}>
            Mes anterior
          </button>
          <button className={`av-btn ${offset === 0 && !usingRange ? 'active' : ''}`} onClick={() => { setUsingRange(false); setOffset(0); }}>
            Mes actual
          </button>
          <div className="av-range">
            <input type="date" value={range.from} onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))} />
            <span>→</span>
            <input type="date" value={range.to} onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))} />
            <button className="av-btn" onClick={() => setUsingRange(true)} disabled={!range.from || !range.to}>Aplicar</button>
            <button className="av-btn" onClick={() => { setUsingRange(false); setRange({ from: '', to: '' }); }}>Limpiar</button>
          </div>
          <button className="av-btn" onClick={() => exportCSV()}>Exportar CSV</button>
          <button className="av-btn" onClick={() => exportPDF()}>Exportar PDF</button>
        </div>
      </div>

      <div className="av-grid-cards">
        {cards.map((c, i) => (
          <div key={i} className="av-card">
            <div className="av-card-head">
              <div className="av-card-eyebrow">EN TIEMPO REAL</div>
              <span className="material-icons av-card-menu">more_horiz</span>
            </div>
            <div className="av-card-title">{c.title}</div>
            <div className="av-card-row">
              <div className="av-card-value">{loading ? '…' : c.value}</div>
              <div className={`av-card-trend ${c.trend}`}>
                <span className="material-icons">{c.trend === 'up' ? 'arrow_upward' : 'arrow_downward'}</span>
                <span>{loading ? '' : c.pct}</span>
              </div>
              <div className={`av-card-icon ${c.color}`}>
                <span className="material-icons">{c.icon}</span>
              </div>
            </div>
            <div className="av-card-sub">Análisis del último periodo</div>
            <div className={`av-card-bar ${c.color}`}></div>
          </div>
        ))}
      </div>

      <div className="av-charts">
        <div className="av-chart-card">
          <div className="av-chart-title">Tickets por categoría</div>
          <div className="av-chart-body">
            {loading ? <div className="av-loading">Cargando…</div> : <Bar data={categoriaData} options={chartOptions} />}
          </div>
        </div>
        <div className="av-chart-card">
          <div className="av-chart-title">Tickets por prioridad</div>
          <div className="av-chart-body">
            {loading ? <div className="av-loading">Cargando…</div> : <Bar data={prioridadData} options={chartOptions} />}
          </div>
        </div>
      </div>

      <div className="av-charts-row">
        <div className="av-chart-card">
          <div className="av-chart-title">Top 5 Clientes con más averías</div>
          <div className="av-chart-body">
            {loading ? <div className="av-loading">Cargando…</div> : (
              <div className="av-table-container">
                <table className="av-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Código</th>
                      <th>Tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients?.map((c, i) => (
                      <tr key={i}>
                        <td>{c.nombre}</td>
                        <td>{c.codigo}</td>
                        <td>{c.count}</td>
                      </tr>
                    ))}
                    {(!topClients || topClients.length === 0) && (
                      <tr><td colSpan={3} style={{ textAlign: 'center' }}>No hay datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="av-chart-card">
          <div className="av-chart-title">Averías por Técnico</div>
          <div className="av-chart-body">
            {loading ? <div className="av-loading">Cargando…</div> : <Bar data={technicianData} options={chartOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AveriasDashboard;
