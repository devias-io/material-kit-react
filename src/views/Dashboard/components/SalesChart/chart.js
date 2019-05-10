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
  cornerRadius: 20,
  tooltips: {
    backgroundColor: palette.common.white,
    titleFontFamily: 'Roboto',
    titleFontColor: palette.text.primary,
    bodyFontFamily: 'Roboto',
    bodyFontColor: palette.text.secondary,
    footerFontColor: palette.text.secondary
  },
  scales: {
    xAxes: [
      {
        barThickness: 16,
        maxBarThickness: 16,
        barPercentage: 1,
        ticks: {
          fontColor: palette.text.secondary
        },
        gridLines: {
          display: false,
          drawBorder: false
        }
      }
    ],
    yAxes: [
      {
        ticks: {
          fontColor: palette.text.secondary,
          beginAtZero: true,
          min: 0,
          callback: function(value) {
            const v = value / 1000;

            return v === 0 ? 0 : v + 'K';
          }
        },
        gridLines: {
          borderDash: [2],
          borderDashOffset: [2],
          color: palette.divider,
          drawBorder: false,
          zeroLineBorderDash: [2],
          zeroLineBorderDashOffset: [2],
          zeroLineColor: palette.divider
        }
      }
    ]
  },
  responsiveAnimationDuration: 1000
};
