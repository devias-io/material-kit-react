import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon, Typography
} from '@mui/material';
import { Search as SearchIcon } from '../../icons/search';
import { NavItem } from '../nav-item';

// export const NavItem = (props) => {
//   const { href, icon, title, ...others } = props;
//   const router = useRouter();
//   const active = href ? (router.pathname === href) : false;


export const BoardListToolbar = (props) => (

  <Box {...props}>
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        m: -1
      }}
    >
      <Typography
        sx={{ m: 1 }}
        variant="h4"
      >
        Board
      </Typography>
      <Box sx={{ m: 1 }}>
        <Button
          color="primary"
          variant="contained"
          href='boardwrite'
        >
          글쓰기
        </Button>
      </Box>
    </Box>
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 500 }}>
            <TextField

              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon
                      color="action"
                      fontSize="small"
                    >
                      <SearchIcon />
                    </SvgIcon>
                  </InputAdornment>
                )
              }}
              placeholder="Search board"
              variant="outlined"

            />
            <Button
              color="primary"
              variant="contained"
            >
              글찾기
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  </Box>
);

