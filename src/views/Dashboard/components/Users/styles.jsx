export default theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    alignItems: 'center',
    display: 'flex'
  },
  title: {
    color: theme.palette.text.secondary,
    fontWeight: 700
  },
  value: {
    marginTop: theme.spacing(1)
  },
  iconWrapper: {
    alignItems: 'center',
    backgroundColor: theme.palette.success.main,
    borderRadius: '50%',
    display: 'inline-flex',
    height: '4rem',
    justifyContent: 'center',
    marginLeft: 'auto',
    width: '4rem'
  },
  icon: {
    color: theme.palette.common.white,
    fontSize: '2rem',
    height: '2rem',
    width: '2rem'
  },
  footer: {
    marginTop: theme.spacing(2),
    display: 'flex',
    alignItems: 'center'
  },
  difference: {
    alignItems: 'center',
    color: theme.palette.success.dark,
    display: 'inline-flex',
    fontWeight: 700
  },
  caption: {
    marginLeft: theme.spacing(1)
  }
});
