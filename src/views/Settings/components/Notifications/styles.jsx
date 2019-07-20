export default theme => ({
  root: {},
  form: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  group: {
    flexGrow: 1,
    padding: theme.spacing(2)
  },
  groupLabel: {
    paddingLeft: theme.spacing(2)
  },
  field: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    display: 'flex',
    alignItems: 'center'
  },
  textField: {
    width: '320px',
    maxWidth: '100%',
    marginRight: theme.spacing(3)
  },
  portletFooter: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  }
});
