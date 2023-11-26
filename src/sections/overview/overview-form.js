import React, { useState } from "react";
import { Button, Card, CardActions, CardContent, Grid, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";

const OverviewForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    dateOfBirth: null,
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
  });

  const handleInputChange = (fieldName, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Form Data:", formData);
  };
  const renderInput = (props) => <TextField {...props} fullWidth margin="normal" helperText="" />;

  return (
    <Grid>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
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
      </Card>
    </Grid>
  );
};

export default OverviewForm;
