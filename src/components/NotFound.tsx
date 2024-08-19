import { Box, Typography } from "@mui/material";
import React from "react";

const NotFound: React.FC = () => {
  return (
    <Box sx={{ textAlign: "center", mt: 4 }}>
      <Typography variant="h4">404 - Page Not Found</Typography>
      <Typography variant="body1">
        The page you are looking for does not exist.
      </Typography>
    </Box>
  );
};

export default NotFound;
