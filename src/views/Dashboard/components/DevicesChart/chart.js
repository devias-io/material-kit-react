// Palette
import palette from 'theme/palette';

// Chart data
export const data = {
  datasets: [
    {
      data: [63, 15, 22],
      backgroundColor: [
        palette.primary.main,
        palette.danger.main,
        palette.warning.main
      ],
      borderWidth: 0
    }
  ],
  labels: ['Desktop', 'Tablet', 'Mobile']
};

// Chart options
export const options = {
  legend: {
    display: false
  },
  maintainAspectRatio: false,
  cutoutPercentage: 70
};
