// Palette
import palette from 'theme/palette';

// Chart data
export const data = {
  labels: ['1 Aug', '2 Aug', '3 Aug', '4 Aug', '5 Aug', '6 Aug'],
  datasets: [
    {
      label: 'This year',
      backgroundColor: palette.primary.main,
      data: [18000, 5000, 19000, 27000, 29000, 19000, 20000]
    },
    {
      label: 'Last year',
      backgroundColor: palette.common.neutral,
      data: [11000, 20000, 12000, 29000, 30000, 25000, 13000]
    }
  ]
};

// Chart options
export const options = {
  maintainAspectRatio: false,
  legend: { display: false },
  scales: {
    xAxes: [
      {
        maxBarThickness: 20,
        barPercentage: 1,
        categoryPercentage: 0.25,
        ticks: {},
        gridLines: {
          display: false,
          drawBorder: false
        }
      }
    ],
    yAxes: [
      {
        ticks: {
          beginAtZero: true,
          min: 0,
          callback: function(value) {
            const v = value / 1000;

            return v === 0 ? 0 : v + 'K';
          }
        },
        gridLines: {
          color: palette.divider,
          drawBorder: false
        }
      }
    ]
  },
  responsiveAnimationDuration: 1000
};
