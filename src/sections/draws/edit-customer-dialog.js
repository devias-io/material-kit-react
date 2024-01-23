import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { set } from 'nprogress';
import { useEffect, useState } from 'react';
import { EditClientUsecase } from 'src/provider/useCases/clients/edit-client.usecase';
import { EditDrawsUsecase } from 'src/provider/useCases/draws/edit-all-draws.useCase';
import { GetAllDrawsUsecase } from 'src/provider/useCases/draws/get-all-draws.usecase';
import * as Yup from 'yup';

export const EditDrawsDialog = (props) => {
  const {
    dialog,
    setDialog,
    data,
    setSnakBarMsg,
    setSnakBarOpen,
    setSnackBarStatus
  } = props;
  const [loadingEdit, setLoadingEdit] = useState(false)

  const handleCancel = () => {
    console.log(data)
    setDialog('close');
  }

  const formik = useFormik({
    initialValues: {
        drawId: '',
        amount: 0,
        secondaryAmount: 0,
        thirdAmount: 0
    },
    validationSchema: Yup.object().shape({
        drawId: Yup.string(),    
        amount: Yup.number().required(),
        secondaryAmount: Yup.number(),
        thirdAmount: Yup.number(),
    }),
    onSubmit: async (values) => {
      setLoadingEdit(true)
      console.log(values)
      const response = await EditDrawsUsecase({
        drawId: data,
        amount: values.amount,
        secondaryAmount: values.secondaryAmount,
        thirdAmount: values.thirdAmount
      })
      if(response.isFailure){
        setSnakBarMsg(response.error)
        setSnackBarStatus('error')
        setSnakBarOpen(true)
        console.error(response.error)
      }
      else{
        setSnakBarMsg('Sorteio atualizado com sucesso')
        setSnackBarStatus('success')
        setSnakBarOpen(true)
      }
      setLoadingEdit(false)
      setDialog('close')
    }
  
  })

  return (
    <Dialog open={dialog == 'edit'} maxWidth='sm' fullWidth='fullWidth' >
      <DialogTitle>{`Editar Sorteio`}</DialogTitle>
      <IconButton 
        aria-label="close"
        onClick={() => setDialog('close')}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}
      >
        <XMarkIcon height={24} />
      </IconButton>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
            <TextField
              margin="dense"
              id="amount"
              label="Preço"
              name='amount'
              type="number"
              fullWidth
              variant="standard"
              error={!!(formik.touched.amount && formik.errors.amount)}
              helperText={formik.touched.amount && formik.errors.amount}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              values={formik.values.amount}
              />
            <TextField
              margin="dense"
              id="secondaryAmount"
              label="Preço Secundário"
              type="number"
              name='secondaryAmount'
              fullWidth
              variant="standard"
              error={!!(formik.touched.secondaryAmount && formik.errors.secondaryAmount)}
              helperText={formik.touched.secondaryAmount && formik.errors.secondaryAmount}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              defaultValue={data.secondaryAmount}
              values={formik.values.secondaryAmount}
            />
            <TextField
              margin="dense"
              id="thirdAmount"
              label="Preço Terciário"
              type="number"
              name='thirdAmount'
              fullWidth
              variant="standard"
              error={!!(formik.touched.thirdAmount && formik.errors.thirdAmount)}
              helperText={formik.touched.thirdAmount && formik.errors.thirdAmount}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              defaultValue={data.thirdAmount}
              values={formik.values.thirdAmount}
            />
          <DialogActions>
            <Button onClick={handleCancel} variant='contained'>Cancelar</Button>
            <LoadingButton
              loading={loadingEdit}
              type='submit'
              variant='outlined'
            >
              Atualizar
            </LoadingButton>
          </DialogActions>
        </DialogContent>
      </form>
    </Dialog>
  )
}