import { XMarkIcon } from "@heroicons/react/24/outline";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  Input,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useFormik } from "formik";
import { set } from "nprogress";
import { useEffect, useState } from "react";
import { GiveTicketsToClientUsecase } from "src/provider/useCases/clients/give-tickets.usecase";
import { GetAllDrawsUsecase } from "src/provider/useCases/draws/get-all-draws.usecase";
import * as Yup from "yup";

export const GiveTicketDialog = (props) => {
  const { dialog, setDialog, data, setSnakBarMsg, setSnakBarOpen, setSnackBarStatus } = props;

  const [selectedDraw, setSelectedDraw] = useState("");
  const [drawList, setDrawList] = useState([]);
  const [loadingGiveTicket, setLoadingGiveTicket] = useState(false);

  const handleSelectChange = (e) => {
    setSelectedDraw(e.target.value);
    formik.values.draw = e.target.value;
  };

  const handleCancel = () => {
    setSelectedDraw("");
    setDialog("close");
  };

  useEffect(() => {
    const fetch = async () => {
      const drawList = await GetAllDrawsUsecase();
      setDrawList(drawList);
    };
    fetch();

    return () => {};
  }, []);

  const formik = useFormik({
    initialValues: {
      draw: "",
      ticketAmount: 0,
    },
    validationSchema: Yup.object().shape({
      draw: Yup.string().required("Escolher o sorteio é obrigatório"),
      ticketAmount: Yup.number()
        .min(1, "A quantidade mínima de tickets é 1")
        .required("Quantidade de Tickets é obrigatório"),
    }),
    onSubmit: async (values) => {
      setLoadingGiveTicket(true);
      const fetchData = {
        drawId: values.draw,
        amount: values.ticketAmount,
        userId: data.id,
      };
      const response = await GiveTicketsToClientUsecase(fetchData);
      if (response.isFailure) {
        setSnakBarMsg(response.error);
        setSnackBarStatus("error");
        setSnakBarOpen(true);
        console.error(response.error);
      } else {
        setSnakBarMsg(response.value.message);
        setSnackBarStatus("success");
        setSnakBarOpen(true);
      }
      setLoadingGiveTicket(false);
      setDialog("close");
    },
  });

  return (
    <Dialog open={dialog == "giveticket"} maxWidth="sm" fullWidth="fullWidth">
      <DialogTitle>{`Adicionar Tickets para ${data.name}`}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleCancel}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
        }}
      >
        <XMarkIcon height={24} />
      </IconButton>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <TextField
            select
            id="select-draw"
            label="Sorteio"
            name="draw"
            value={selectedDraw}
            error={!!(formik.touched.draw && formik.errors.draw)}
            helperText={formik.touched.draw && formik.errors.draw}
            onChange={handleSelectChange}
            variant="standard"
            fullWidth
          >
            {drawList.map((draw) => (
              <MenuItem value={draw.id}>{draw.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            id="ticket-amount"
            label="Quantidade de Tickets"
            name="ticketAmount"
            variant="standard"
            fullWidth
            margin="normal"
            error={!!(formik.touched.ticketAmount && formik.errors.ticketAmount)}
            helperText={formik.touched.ticketAmount && formik.errors.ticketAmount}
            onChange={formik.handleChange}
            values={formik.values.ticketAmount}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="contained">
            Cancelar
          </Button>
          <LoadingButton loading={loadingGiveTicket} type="submit" variant="outlined">
            Conceder Tickets
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};
