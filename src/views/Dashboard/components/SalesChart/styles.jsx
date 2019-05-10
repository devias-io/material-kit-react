export default theme => ({
  root: {},
  portletFooter: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  summary: {},
  chartWrapper: {
    marginTop: theme.spacing.unit * 4,
    minWidth: '100%',
    height: '400px',
    maxHeight: '100%'
  },
  legends: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing.unit * 3
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    '& + &': {
      marginLeft: theme.spacing.unit * 2
    }
  },
  legendColor: {
    display: 'inline-block',
    height: '18px',
    width: '18px',
    borderRadius: '3px',
    marginRight: theme.spacing.unit
  }
});
