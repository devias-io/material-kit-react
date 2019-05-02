export default theme => ({
  root: {},
  portletFooter: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  details: {
    minWidth: '700px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing.unit * 4
  },
  summary: {},
  legends: {},
  legend: {
    display: 'flex',
    alignItems: 'center',
    '& + &': {
      marginTop: theme.spacing.unit
    }
  },
  legendColor: {
    display: 'inline-block',
    height: '18px',
    width: '18px',
    borderRadius: '3px',
    marginRight: theme.spacing.unit
  },
  chart: {
    height: '400px',
    padding: theme.spacing.unit * 3
  }
});
