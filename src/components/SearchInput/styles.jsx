export default theme => ({
  root: {
    alignItems: 'center',
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.common.neutral}`,
    borderRadius: '4px',
    display: 'flex',
    flexBasis: '420px',
    paddingBottom: theme.spacing(0.5),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(0.5)
  },
  icon: {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  input: {
    flexGrow: 1,
    fontSize: '14px',
    lineHeight: '16px',
    letterSpacing: '-0.05px'
  }
});
