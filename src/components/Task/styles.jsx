export default theme => ({
  root: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.unit * 2,
    paddingLeft: theme.spacing.unit * 3,
    paddingRight: theme.spacing.unit * 3,
    paddingTop: theme.spacing.unit * 2,
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.025)'
    }
  },
  details: {
    borderLeftStyle: 'solid',
    borderLeftWidth: '4px',
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingTop: theme.spacing.unit
  },
  primary: {
    '& $details': {
      borderLeftColor: theme.palette.primary.main
    }
  },
  warning: {
    '& $details': {
      borderLeftColor: theme.palette.warning.main
    }
  },
  danger: {
    '& $details': {
      borderLeftColor: theme.palette.danger.main
    }
  }
});
