import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';

export const registerChartJs = () => {
  Chart.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip
  );
};
