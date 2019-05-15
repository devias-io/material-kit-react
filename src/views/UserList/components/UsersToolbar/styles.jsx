export default theme => ({
  root: {},
  row: {
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing.unit
  },
  spacer: {
    flexGrow: 1
  },
  deleteButton: {
    color: theme.palette.danger.main,
    marginRight: theme.spacing.unit
  },
  importButton: {
    marginRight: theme.spacing.unit
  },
  importIcon: {
    marginRight: theme.spacing.unit
  },
  exportButton: {
    marginRight: theme.spacing.unit
  },
  exportIcon: {
    marginRight: theme.spacing.unit
  },
  searchInput: {
    marginRight: theme.spacing.unit
  }
});
