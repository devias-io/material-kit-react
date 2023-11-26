import React, { useState } from "react";
import { Input, IconButton, Avatar, makeStyles } from "@material-ui/core";
import { CameraAlt as CameraIcon } from "@material-ui/icons";
import { Grid } from "@mui/material";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    justifyContent: "left",
  },
  profileBorder: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "50%",
    width: "100px",
    height: "100px",
    margin: "auto",
  },
  profileInput: {
    display: "none",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  cameraIcon: {
    position: "absolute",
    bottom: "0",
    right: "0",
    borderRadius: "50%",
  },
}));

function ProfilePictureUpload() {
  const classes = useStyles();
  const [selectedImage, setSelectedImage] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  return (
    <Grid className={classes.container}>
      <Grid className={classes.profileBorder}>
        <Input
          id="profileInput"
          name="profileInput"
          type="file"
          className={classes.profileInput}
          onChange={handleChange}
        />
        <Avatar className={classes.avatar} alt="User Avatar" src={selectedImage} />
        <IconButton className={classes.cameraIcon} component="label" htmlFor="profileInput">
          <CameraIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}

export default ProfilePictureUpload;
