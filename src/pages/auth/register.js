import Head from "next/head";
import { useState } from "react";
import NextLink from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Layout as AuthLayout } from "src/layouts/auth/layout";
import { Visibility, VisibilityOff } from "@material-ui/icons";

const Page = () => {
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const handleTogglePasswordVisibility1 = () => {
    setShowPassword1((prevShowPassword) => !prevShowPassword);
  };

  const handleTogglePasswordVisibility2 = () => {
    setShowPassword2((prevShowPassword) => !prevShowPassword);
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      name: "",
      password: "",
      passwordConfirm: "",
      roles: ["user"],
    },

    validationSchema: Yup.object({
      email: Yup.string().email("Must be a valid email").max(255).required("Email is required"),
      name: Yup.string().max(255).required("Name is required"),
      password: Yup.string().max(255).required("Password is required"),
      passwordConfirm: Yup.string().max(255).required("Confirm password is required"),
    }),

    onSubmit: async (values, { resetForm }) => {
      // setLoadBtn(true);

      var requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        redirect: "follow",
      };

      // Fetch call to submit data
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/signupUser`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          console.log("result ", result);
          // if (result.status === "success") {
          //   setLoadBtn(false);
          //   resetForm();
          //   successMessage(result.message);
          //   setSuccessMsg(true);
          // }
          // if (result.status === "fail") {
          //   warningMessage(result.message);
          //   setLoadBtn(false);
          // }
          // if (result.status === "error") {
          //   dangerMessage(result.data);
          //   setLoadBtn(false);
          // }
        })
        .catch((error) => {
          //   setLoadBtn(false);
          //   dangerMessage(error);
          console.log(" error : ", error);
        });
    },
  });

  return (
    <>
      <Head>
        <title>Register | Devias Kit</title>
      </Head>
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
            maxWidth: 550,
            px: 3,
            py: "100px",
            width: "100%",
          }}
        >
          <div>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="h4">Register</Typography>
              <Typography color="text.secondary" variant="body2">
                Already have an account? &nbsp;
                <Link component={NextLink} href="/auth/login" underline="hover" variant="subtitle2">
                  Log in
                </Link>
              </Typography>
            </Stack>
            <form noValidate onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  error={!!(formik.touched.name && formik.errors.name)}
                  fullWidth
                  helperText={formik.touched.name && formik.errors.name}
                  label="Name"
                  name="name"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.name}
                />
                <TextField
                  error={!!(formik.touched.email && formik.errors.email)}
                  fullWidth
                  helperText={formik.touched.email && formik.errors.email}
                  label="Email Address"
                  name="email"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  type="email"
                  value={formik.values.email}
                />

                <Grid container>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={6}>
                      <TextField
                        error={!!(formik.touched.password && formik.errors.password)}
                        fullWidth
                        helperText={formik.touched.password && formik.errors.password}
                        label="Password"
                        name="password"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        type={showPassword1 ? "text" : "password"}
                        value={formik.values.password}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleTogglePasswordVisibility1}
                                edge="end"
                              >
                                {showPassword1 ? <Visibility /> : <VisibilityOff />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={12} md={6}>
                      <TextField
                        error={!!(formik.touched.passwordConfirm && formik.errors.passwordConfirm)}
                        fullWidth
                        helperText={formik.touched.passwordConfirm && formik.errors.passwordConfirm}
                        label="Confirm Password"
                        name="passwordConfirm"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        type={showPassword2 ? "text" : "password"}
                        value={formik.values.passwordConfirm}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleTogglePasswordVisibility2}
                                edge="end"
                              >
                                {showPassword2 ? <Visibility /> : <VisibilityOff />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Stack>
              {formik.errors.submit && (
                <Typography color="error" sx={{ mt: 3 }} variant="body2">
                  {formik.errors.submit}
                </Typography>
              )}
              <Button fullWidth size="large" sx={{ mt: 3 }} type="submit" variant="contained">
                Login
              </Button>
            </form>
          </div>
        </Box>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default Page;
