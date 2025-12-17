import React, { useEffect, useState } from 'react';
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
import facturaService from '@/services/facturaService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const FacturasChart: React.FC = () => {
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const añoActual = new Date().getFullYear();
                const response = await facturaService.obtenerPagosPorMes(añoActual);

                // The service returns the data directly, not wrapped in a data property
                // It returns an array of { mes: number, nombreMes: string, pagos: [], total: number }
                const data = response || [];

                const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const valuesBanco = new Array(12).fill(0);
                const valuesCaja = new Array(12).fill(0);

                data.forEach((item: any) => {
                    // Adjust index if month is 1-based
                    const monthIndex = item.mes - 1;
                    if (monthIndex >= 0 && monthIndex < 12) {
                        valuesBanco[monthIndex] = item.totalBanco || 0;
                        valuesCaja[monthIndex] = item.totalCaja || 0;
                    }
                });

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Ingresos por Banco',
                            data: valuesBanco,
                            backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green-500
                            borderRadius: 4,
                        },
                        {
                            label: 'Ingresos por Caja',
                            data: valuesCaja,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue-500
                            borderRadius: 4,
                        },
                    ],
                });
            } catch (error) {
                console.error('Error fetching chart data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const options = {
        responsive: true,
        maintainAspectRatio: false, // Important for fitting in container
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#94a3b8' // Slate-400
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('es-DO', { 
                                style: 'currency', 
                                currency: 'DOP' 
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { 
                    color: '#94a3b8',
                    callback: function(value: any) {
                        return new Intl.NumberFormat('es-DO', { 
                            style: 'currency', 
                            currency: 'DOP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(value);
                    }
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Cargando gráfica...</div>;
    if (!chartData) return <div className="h-64 flex items-center justify-center text-slate-400">No hay datos disponibles</div>;

    return (
        <div className="h-80 w-full">
            <Bar options={options} data={chartData} />
        </div>
    );
};

export default FacturasChart;
