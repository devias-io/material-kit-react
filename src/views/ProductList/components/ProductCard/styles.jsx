export default theme => ({
  root: {
    maxWidth: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(2),
    paddingRight: theme.spacing(3),
    paddingLeft: theme.spacing(3)
  },
  imageWrapper: {
    height: '64px',
    width: '64px',
    margin: '0 auto',
    border: '1px solid #EDF0F2',
    borderRadius: '5px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%'
  },
  details: {},
  title: {
    fontSize: '18px',
    lineHeight: '21px',
    textAlign: 'center',
    marginTop: theme.spacing(2)
  },
  description: {
    lineHeight: '16px',
    height: theme.spacing(4),
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: theme.palette.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2)
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing(1)
  },
  updateIcon: {
    color: theme.palette.text.secondary
  },
  updateText: {
    marginLeft: theme.spacing(1),
    color: theme.palette.text.secondary
  },
  downloadsIcon: {
    marginLeft: 'auto',
    color: theme.palette.text.secondary
  },
  downloadsText: {
    marginLeft: theme.spacing(1),
    color: theme.palette.text.secondary
  }
});
