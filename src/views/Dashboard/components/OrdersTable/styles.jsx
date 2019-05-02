export default theme => ({
  root: {},
  portletHeader: {
    minWidth: '600px'
  },
  portletContent: {
    minWidth: '600px'
  },
  sortButton: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  },
  newEntryButton: {
    marginLeft: theme.spacing.unit
  },
  progressWrapper: {
    padding: theme.spacing.unit * 3,
    display: 'flex',
    justifyContent: 'center'
  },
  table: {},
  tableRow: {
    cursor: 'pointer'
  },
  customerCell: {
    fontWeight: 500
  },
  statusWrapper: {
    display: 'flex',
    alignItems: 'center'
  },
  status: {
    marginRight: theme.spacing.unit
  }
});
