import { Box, Modal } from "@mui/material";
import React from "react";

const OpenModal = () => {
  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={{ width: 300, bgcolor: "background.paper", p: 3 }}>
          {/* Modal content goes here */}
          <h2 id="modal-title">Modal Title</h2>
          <p id="modal-description">Modal Content</p>
          <Button onClick={handleClose}>Close Modal</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default OpenModal;
