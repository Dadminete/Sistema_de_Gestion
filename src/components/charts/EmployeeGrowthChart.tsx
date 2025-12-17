import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './SalesChart.css'; // Reusing SalesChart styles for consistency

ChartJS.register(ArcElement, Tooltip, Legend);

interface EmployeeGrowthChartProps {
    data?: {
        labels: string[];
        data: number[];
    };
}

const EmployeeGrowthChart: React.FC<EmployeeGrowthChartProps> = ({ data: propData }) => {
    const defaultData = {
        labels: ['Activos', 'Inactivos', 'Otros'],
        datasets: [
            {
                data: [100, 0, 0],
                backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b'], // Blue, Red, Amber
                borderColor: ['#fff', '#fff', '#fff'],
                borderWidth: 2,
            },
        ],
    };

    const chartData = propData ? {
        labels: propData.labels,
        datasets: [{
            data: propData.data,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'], // Blue, Emerald, Amber, Red
            borderColor: ['#fff', '#fff', '#fff', '#fff'],
            borderWidth: 2,
        }]
    } : defaultData;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
    };

    return (
        <div className="sales-chart-container">
            <div className="doughnut-chart-wrapper">
                <Doughnut data={chartData} options={options} />
                <div className="chart-center-text">
                    <p>Total</p>
                    <h3>{propData ? propData.data.reduce((a, b) => a + b, 0) : 0}</h3>
                </div>
            </div>
            <div className="sales-chart-footer">
                <p>Distribución del personal</p>
                <a href="/rrhh/empleados">Ver detalles</a>
            </div>
        </div>
    );
};

export default EmployeeGrowthChart;
