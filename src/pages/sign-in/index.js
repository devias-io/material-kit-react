import { useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Box, Button, FormHelperText, Grid, Tab, Tabs, TextField, Typography } from "@mui/material";
import { auth, ENABLE_AUTH } from "../../lib/auth";
import { Logo } from "../../components/logo";
import Router from "next/router";
import useLogin from "../../services/auth/useLogin";

const Page = () => {
  const [tab, setTab] = useState("email");
  const { mutate: login } = useLogin();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      submit: null,
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Must be a valid email").max(255).required("Email is required"),
      password: Yup.string().min(6).required("Password is required"),
    }),
    onSubmit: async (values) => {
      const { email, password } = values;
      login({ email, password });
    },
  });

  const handleTabChange = (event, value) => {
    setTab(value);
  };

  const handleSkip = () => {
    // Since skip is requested, we set a fake user as authenticated
    const user = {};

    // Update Auth Context state
    authContext.signIn(user);

    // Persist the skip for AuthProvider initialize call
    globalThis.sessionStorage.setItem("skip-auth", "true");

    // Redirect to home page
    Router.push("/").catch(console.error);
  };

  return (
    <>
      <Head>
        <title>Sign in | Material Kit</title>
      </Head>
      <Box
        component="main"
        sx={{
          display: "flex",
          flex: "1 1 auto",
        }}
      >
        <Grid container sx={{ flex: "1 1 auto" }}>
          <Grid
            item
            xs={12}
            sx={{
              backgroundColor: "neutral.50",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                p: 3,
              }}
            >
              <NextLink href="/" passHref>
                <a>
                  <Logo
                    sx={{
                      height: 42,
                      width: 42,
                    }}
                  />
                </a>
              </NextLink>
            </Box>
            <Box
              sx={{
                flex: "1 1 auto",
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  maxWidth: 500,
                  px: 3,
                  py: "100px",
                  width: "100%",
                }}
              >
                <div>
                  <Typography sx={{ mb: 1 }} variant="h4">
                    Welcome
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }} variant="body2">
                    Sign up on the internal platform
                  </Typography>
                  <Tabs onChange={handleTabChange} sx={{ mb: 3 }} value={tab}>
                    <Tab label="Email" value="email" />
                  </Tabs>
                  {tab === "email" && (
                    <div>
                      <TextField
                        error={Boolean(formik.touched.email && formik.errors.email)}
                        fullWidth
                        helperText={formik.touched.email && formik.errors.email}
                        label="Email Address"
                        name="email"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        type="email"
                        value={formik.values.email}
                        variant="outlined"
                      />
                      <FormHelperText sx={{ mt: 1, mb: 2 }}>
                        Enter a valid email since this is a fully integrated authentication system.
                        Optionally you can skip.
                      </FormHelperText>
                      <TextField
                        error={Boolean(formik.touched.password && formik.errors.password)}
                        fullWidth
                        helperText={formik.touched.password && formik.errors.password}
                        label="Password"
                        name="password"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        type="password"
                        value={formik.values.password}
                        variant="outlined"
                      />

                      {formik.errors.submit && (
                        <Typography color="error" sx={{ mt: 2 }} variant="body2">
                          {formik.errors.submit}
                        </Typography>
                      )}
                      <Button
                        fullWidth
                        size="large"
                        sx={{ mt: 3 }}
                        onClick={() => formik.handleSubmit()}
                        variant="contained"
                      >
                        Sign In
                      </Button>
                      <Button fullWidth size="large" sx={{ mt: 3 }} onClick={handleSkip}>
                        Skip authentication
                      </Button>
                    </div>
                  )}
                </div>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Page;
