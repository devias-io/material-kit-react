import React, { useState } from "react";
import { Button, Card, CardActions, CardContent, Grid, TextField } from "@mui/material";

const fieldData = [
  { label: "Username", key: "username" },
  { label: "First Name", key: "firstName" },
  { label: "Last Name", key: "lastName" },
  { label: "Date of birthday", key: "dateOfBirth" },
  { label: "Gender", key: "gender" },
  { label: "Profile picture", key: "profilePicture" },
  { label: "Address", key: "address" },
  { label: "Contact info", key: "contactInfo" },
  { label: "Preferences", key: "preferences" },
  { label: "Registration date", key: "registrationDate" },
  { label: "Account status", key: "accountStatus" },
  { label: "Education", key: "education" },
  { label: "Employment", key: "employment" },
  { label: "Socialmedia links", key: "socialMediaLinks" },
];

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

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {fieldData.map((field) => (
              <Grid key={field.key} item xs={12} sm={3}>
                <TextField
                  label={field.label}
                  fullWidth
                  margin="normal"
                  value={formData[field.key]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                />
              </Grid>
            ))}
          </Grid>
          <CardActions sx={{ justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained">
              Submit
            </Button>
          </CardActions>
        </form>
      </CardContent>
    </Card>
  );
};

export default OverviewForm;
