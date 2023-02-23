import { Alert, Snackbar } from "@mui/material";
import React from "react";

const Notification = ({ message = "Note archived", type = "success", duration = 6000 }) => {
  return (
    <Snackbar
      open
      autoHideDuration={duration}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert severity={type} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;
