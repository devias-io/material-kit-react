export default theme => ({
  root: {
    display: 'flex',
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingTop: theme.spacing.unit * 1.5,
    paddingBottom: theme.spacing.unit * 1.5
  },
  intentIcon: {
    marginRight: theme.spacing.unit,
    display: 'inline-flex',
    '& svg': {
      height: '20px',
      width: '20px'
    }
  },
  success: {
    backgroundColor: theme.palette.success.light,
    '& $intentIcon': {
      color: theme.palette.success.main
    }
  },
  info: {
    backgroundColor: theme.palette.info.light,
    '& $intentIcon': {
      color: theme.palette.info.main
    }
  },
  warning: {
    backgroundColor: theme.palette.warning.light,
    '& $intentIcon': {
      color: theme.palette.warning.main
    }
  },
  danger: {
    backgroundColor: theme.palette.danger.light,
    '& $intentIcon': {
      color: theme.palette.danger.main
    }
  },
  title: {},
  description: {},
  remove: {
    marginLeft: 'auto'
  },
  removeIcon: {
    '& svg': {
      height: '16px',
      width: '16px'
    }
  }
});
