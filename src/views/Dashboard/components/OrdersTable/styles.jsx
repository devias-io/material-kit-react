export default theme => ({
  root: {},
  portletContent: {
    minWidth: '600px'
  },
  newEntryButton: {
    marginLeft: theme.spacing.unit
  },
  progressWrapper: {
    padding: theme.spacing.unit * 3,
    display: 'flex',
    justifyContent: 'center'
  },
  tableRow: {
    cursor: 'pointer'
  },
  customerCell: {
    maxWidth: '200px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
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
