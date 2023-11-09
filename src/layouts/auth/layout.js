import PropTypes from "prop-types";
import NextLink from "next/link";
import { Box, Typography, Unstable_Grid2 as Grid } from "@mui/material";
import { Logo } from "src/components/logo";

// TODO: Change subtitle text

export const Layout = (props) => {
  const { children } = props;

  return (
    <Box component="main">
      <Grid container sx={{ flex: "1 1 auto" }}>
        <Grid xs={12} lg={6}>
          <Box
            component="header"
            sx={{
              left: 0,
              p: 3,
              position: "fixed",
              top: 0,
              width: "100%",
            }}
          >
            <Box
              component={NextLink}
              href="/"
              sx={{
                display: "inline-flex",
                height: 32,
                width: 32,
              }}
            >
              <Logo />
            </Box>
          </Box>
          {children}
        </Grid>
        <Grid
          xs={12}
          lg={6}
          sx={{
            alignItems: "center",
            color: "white",
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#FF5733",
            minHeight: "100vh",
          }}
        >
          <Box sx={{ p: 3 }}>
            <img alt="" src="/assets/login/login.avif" />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

Layout.prototypes = {
  children: PropTypes.node,
};
