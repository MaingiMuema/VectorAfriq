'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

interface LeadChartProps {
  data: {
    labels: string[];
    values: number[];
  };
}

export default function LeadChart({ data }: LeadChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Leads',
        data: data.values,
        fill: true,
        borderColor: '#468AD1',
        backgroundColor: 'rgba(70, 138, 209, 0.1)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-gray-800 font-semibold mb-4">Lead Statistics</h3>
      <Line options={options} data={chartData} />
    </div>
  );
}
