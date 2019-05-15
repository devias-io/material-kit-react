export default theme => ({
  root: {},
  refreshButton: {
    margin: -theme.spacing.unit * 2
  },
  chartWrapper: {
    position: 'relative',
    height: '300px'
  },
  stats: {
    marginTop: theme.spacing.unit * 2,
    display: 'flex',
    justifyContent: 'center'
  },
  device: {
    textAlign: 'center',
    padding: theme.spacing.unit
  },
  deviceIcon: {
    color: theme.palette.common.neutral
  }
});
