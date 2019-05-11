export default theme => ({
  root: {
    padding: theme.spacing.unit * 3,
    display: 'flex',
    alignItems: 'center'
  },
  content: {
    flexGrow: 1
  },
  title: {
    fontWeight: 700,
    color: theme.palette.text.secondary
  },
  details: {
    marginTop: theme.spacing.unit,
    display: 'flex',
    alignItems: 'center'
  },
  progressWrapper: {
    flexGrow: 1,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2
  },
  iconWrapper: {},
  icon: {
    color: theme.palette.common.neutral,
    width: '4rem',
    height: '4rem',
    fontSize: '4rem'
  }
});
