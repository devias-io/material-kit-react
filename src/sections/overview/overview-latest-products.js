import PropTypes from "prop-types";
import EllipsisVerticalIcon from "@heroicons/react/24/solid/EllipsisVerticalIcon";
import {
  Box,
  Card,
  CardActions,
  CardHeader,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  SvgIcon,
} from "@mui/material";

export const OverviewLatestProducts = (props) => {
  const { products = [], sx } = props;
  const trophies = [
    "/assets/products/trophy.png",
    "/assets/products/silver.png",
    "/assets/products/bronze.png",
  ];

  return (
    <Card sx={sx}>
      <CardHeader title="Leaderboard" />
      <List>
        {products.map((product, index) => {
          const hasDivider = index < products.length - 1;

          return (
            <ListItem divider={hasDivider} key={index}>
              <ListItemAvatar>
                {index < 3 ? (
                  <Box
                    component="img"
                    src={trophies[index]}
                    alt="top contributor trophy"
                    sx={{
                      borderRadius: 1,
                      height: 48,
                      width: 48,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      borderRadius: 1,
                      height: 48,
                      width: 48,
                    }}
                  />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={`${product.firstName} ${product.lastName}`}
                primaryTypographyProps={{ variant: "subtitle1" }}
                secondary={`Number of posts: ${product.totalCount}`}
                secondaryTypographyProps={{ variant: "body2" }}
              />
              <IconButton edge="end">
                <SvgIcon>
                  <EllipsisVerticalIcon />
                </SvgIcon>
              </IconButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <CardActions sx={{ justifyContent: "flex-end" }}></CardActions>
    </Card>
  );
};

OverviewLatestProducts.propTypes = {
  products: PropTypes.array,
  sx: PropTypes.object,
};
