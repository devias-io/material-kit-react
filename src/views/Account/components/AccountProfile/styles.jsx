export default theme => ({
  root: {},
  details: {
    display: 'flex'
  },
  info: {},
  locationText: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  dateText: {
    color: theme.palette.text.secondary
  },
  avatar: {
    marginLeft: 'auto',
    height: '110px',
    width: '110px',
    flexShrink: 0,
    flexGrow: 0
  },
  progressWrapper: {
    marginTop: theme.spacing(2)
  },
  uploadButton: {
    marginRight: theme.spacing(2)
  }
});
