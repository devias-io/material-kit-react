export default theme => ({
  root: {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    padding: theme.spacing.unit * 3
  },
  content: {
    display: 'flex',
    alignItems: 'center'
  },
  details: {},
  title: {
    fontWeight: 700,
    color: theme.palette.common.white
  },
  value: {
    color: theme.palette.common.white
  },
  iconWrapper: {
    alignItems: 'center',
    backgroundColor: theme.palette.common.white,
    borderRadius: '50%',
    display: 'inline-flex',
    height: '4rem',
    justifyContent: 'center',
    marginLeft: 'auto',
    width: '4rem'
  },
  icon: {
    color: theme.palette.primary.main,
    width: '2rem',
    height: '2rem',
    fontSize: '2rem'
  }
});
