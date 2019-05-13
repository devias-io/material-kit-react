export default theme => ({
  root: {
    padding: theme.spacing.unit * 3
  },
  content: {
    display: 'flex',
    alignItems: 'center'
  },
  details: {},
  title: {
    color: theme.palette.text.secondary,
    fontWeight: 700
  },
  value: {
    marginTop: theme.spacing.unit
  },
  iconWrapper: {
    alignItems: 'center',
    backgroundColor: theme.palette.primary.main,
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
    marginTop: theme.spacing.unit * 3
  }
});
