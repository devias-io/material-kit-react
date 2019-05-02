export default theme => ({
  root: {
    overflow: 'hidden',
    borderRadius: '5px',
    display: 'inline-flex',
    border: `1px solid ${theme.palette.border}`
  },
  option: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing.unit,
    backgroundColor: theme.palette.common.white
  },
  optionSelected: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main
  },
  divider: {
    width: '1px',
    backgroundColor: theme.palette.divider
  }
});
