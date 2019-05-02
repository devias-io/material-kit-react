export default theme => ({
  root: {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    padding: theme.spacing.unit * 3,
    display: 'flex',
    alignItems: 'center'
  },
  content: {
    flexGrow: 1
  },
  title: {
    fontWeight: 700,
    color: theme.palette.common.white
  },
  details: {
    marginTop: theme.spacing.unit,
    display: 'flex',
    alignItems: 'center'
  },
  amount: {
    color: theme.palette.common.white
  },
  iconWrapper: {},
  icon: {
    color: theme.palette.common.white,
    width: '4rem',
    height: '4rem',
    fontSize: '4rem'
  }
});
