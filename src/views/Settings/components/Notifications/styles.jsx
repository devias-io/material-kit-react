export default theme => ({
  root: {},
  form: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  group: {
    flexGrow: 1,
    padding: theme.spacing.unit * 2
  },
  groupLabel: {
    paddingLeft: theme.spacing.unit * 2
  },
  field: {
    marginBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 2,
    display: 'flex',
    alignItems: 'center'
  },
  textField: {
    width: '320px',
    maxWidth: '100%',
    marginRight: theme.spacing.unit * 3
  },
  portletFooter: {
    paddingLeft: theme.spacing.unit * 3,
    paddingRight: theme.spacing.unit * 3,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2
  }
});
