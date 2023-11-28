import { Alert, AlertColor } from "@mui/material";

export function ExceptionAlert(
  message: string,
  severity: AlertColor,
): JSX.Element {
  return (
    <Alert severity={severity}>
        {message}
    </Alert>
  );
}