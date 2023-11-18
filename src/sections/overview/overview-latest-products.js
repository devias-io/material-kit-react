import { formatDistanceToNow } from "date-fns";
import PropTypes from "prop-types";
import ArrowRightIcon from "@heroicons/react/24/solid/ArrowRightIcon";
import EllipsisVerticalIcon from "@heroicons/react/24/solid/EllipsisVerticalIcon";
import {
  Box,
  Button,
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
import { getTopContributors } from "../../pages/api/api";
import { useEffect, useState } from "react";

export const OverviewLatestProducts = (props) => {
  const { products = [], sx } = props;
  const [data, setData] = useState([]);

  // const fetchData = async () => {
  //   try {
  //     const data = await getTopContributors();
  //     setData(data);
  //   }
  //   catch (err) {
  //     console.log(err);
  //   }
  // };

  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <Card sx={sx}>
      <CardHeader title="Leaderboard" />
      <List>
        {products.map((product, index) => {
          const hasDivider = index < products.length - 1;

          return (
            <ListItem divider={hasDivider} key={product.id}>
              <ListItemAvatar>
                {product.image ? (
                  <Box
                    component="img"
                    src={product.image}
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
                      backgroundColor: "neutral.200",
                      height: 48,
                      width: 48,
                    }}
                  />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={product.slug}
                primaryTypographyProps={{ variant: "subtitle1" }}
                secondary={`Number of posts ${product.totalCount}`}
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
