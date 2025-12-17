import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './RevenueChart.css'; // Reusing RevenueChart styles for consistency

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PayrollChartProps {
    data?: {
        label: string;
        payroll: number;
        commissions: number;
    }[];
}

const PayrollChart: React.FC<PayrollChartProps> = ({ data }) => {
    const chartData = {
        labels: data && data.length > 0 ? data.map(d => d.label) : [],
        datasets: [
            {
                label: 'Nómina Base',
                data: data && data.length > 0 ? data.map(d => d.payroll) : [],
                backgroundColor: '#a855f7', // Purple
                borderRadius: 4,
            },
            {
                label: 'Comisiones',
                data: data && data.length > 0 ? data.map(d => d.commissions) : [],
                backgroundColor: '#d8b4fe', // Light Purple
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                align: 'center' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    color: '#94a3b8' // Slate 400
                },
            },
            title: {
                display: false,
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#94a3b8' // Slate 400
                }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: {
                    color: '#94a3b8', // Slate 400
                    callback: function (value: any) {
                        return '$' + value / 1000 + 'k';
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                }
            },
        },
    };

    return (
        <div className="chart-container">
            <Bar options={options} data={chartData} />
        </div>
    );
};

export default PayrollChart;
