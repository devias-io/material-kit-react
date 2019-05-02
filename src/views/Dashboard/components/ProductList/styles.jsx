export default theme => ({
  root: {},
  portletContent: {
    paddingTop: '0'
  },
  portletFooter: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  product: {
    paddingBottom: theme.spacing.unit * 3,
    paddingTop: theme.spacing.unit * 3,
    display: 'flex',
    alignItems: 'center',
    '&:not(:first-of-type)': {
      borderTop: `1px solid ${theme.palette.divider}`
    }
  },
  productImageWrapper: {
    borderRadius: '5px',
    overflow: 'hidden',
    height: '64px',
    width: '64px'
  },
  productImage: {
    width: '100%',
    height: 'auto'
  },
  productDetails: {
    marginLeft: theme.spacing.unit * 2,
    flexGrow: 1
  },
  productTitle: {},
  productTimestamp: {
    marginTop: theme.spacing.unit,
    color: theme.palette.text.secondary
  }
});
