import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useFormik } from "formik";
import * as Yup from "yup";

const OverviewForm = () => {
  const formik = useFormik({
    initialValues: {
      username: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      profilePicture: "",
      address: "",
      contactInfo: "",
      preferences: "",
      registrationDate: "",
      accountStatus: "",
      education: "",
      employment: "",
      socialMediaLinks: "",
    },

    validationSchema: Yup.object({
      username: Yup.string().required("Username is required"),
      firstName: Yup.string().required("First Name is required"),
      lastName: Yup.string().required("Last Name is required"),
      gender: Yup.string().required("Gender is required"),
      dateOfBirth: Yup.string().required("Date of Birth is required"),
      address: Yup.string().required("Address is required"),
      employment: Yup.string().required("Employment is required"),
      education: Yup.string().required("Education is required"),
      preferences: Yup.string().required("Preference is required"),
      socialMediaLinks: Yup.string().required("Social media is required"),
      registrationDate: Yup.string().required("Registration Date is required"),
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
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, requestOptions)
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

  const handleInputChange = (fieldName, value) => {
    // Update the form data
    formik.setFieldValue(fieldName, value);
  };

  const renderInput = (props) => <TextField {...props} fullWidth margin="normal" helperText="" />;
  return (
    <Grid>
      <Box>
        <CardContent xs={12} sm={6} lg={3}>
          <form noValidate onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Username"
                  fullWidth
                  margin="normal"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="First Name"
                  fullWidth
                  margin="normal"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Last Name"
                  fullWidth
                  margin="normal"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Gender"
                  fullWidth
                  margin="normal"
                  select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Date of birth"
                  fullWidth
                  margin="normal"
                  format="MM/dd/yyyy"
                  value={formData.dateOfBirth}
                  onChange={(date) => handleInputChange("dateOfBirth", date)}
                  renderInput={renderInput}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Address"
                  fullWidth
                  margin="normal"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Employment"
                  fullWidth
                  margin="normal"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Education"
                  fullWidth
                  margin="normal"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Preferences"
                  fullWidth
                  margin="normal"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Social media"
                  fullWidth
                  required
                  margin="normal"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Registration date"
                  fullWidth
                  margin="normal"
                  format="MM/dd/yyyy"
                  value={formData.registrationDate}
                  onChange={(date) => handleInputChange("registrationDate", date)}
                  renderInput={renderInput}
                />
              </Grid>
            </Grid>
            <CardActions sx={{ justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </CardActions>
          </form>
        </CardContent>
      </Box>
    </Grid>
  );
};

export default OverviewForm;
