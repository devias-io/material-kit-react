import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { set } from 'nprogress';
import { useEffect, useState } from 'react';
import { EditClientUsecase } from 'src/provider/useCases/clients/edit-client.usecase';
import { GetAllDrawsUsecase } from 'src/provider/useCases/draws/get-all-draws.usecase';
import * as Yup from 'yup';

export const EditCustomerDialog = (props) => {
  const {
    dialog,
    setDialog,
    data,
    setSnakBarMsg,
    setSnakBarOpen
  } = props;
  const [loadingEdit, setLoadingEdit] = useState(false)

  const handleCancel = () => {
    console.log(data)
    setDialog('close');
  }

  const formik = useFormik({
    initialValues: {
      document: '',
      email: ''
    },
    validationSchema: Yup.object().shape({
      document: Yup.string().length(11).required('CPF é obrigatório'),
      email: Yup.string().email('Deve ser um email válido').max(255).required('Email é obrigatório'),
    }),
    onSubmit: async (values) => {
      setLoadingEdit(true)
      const fetchData = {
        document: String(values.document),
        email: values.email
      }
      console.log(data.id, fetchData);
      const response = await EditClientUsecase(data.id, fetchData)
      if(response.isFailure){
        setSnakBarMsg(response.error)
        setSnakBarOpen(true)
        console.error(response.error)
      }
      else{
        setSnakBarMsg('Cliente atualizado com sucesso')
        setSnakBarOpen(true)
      }
      setLoadingEdit(false)
      setDialog('close')
    }
  
  })

  useEffect(() => {
    formik.setValues({
      document: data.document,
      email: data.email
    })
  }, [data])


  return (
    <Dialog open={dialog == 'edit'} maxWidth='sm' fullWidth='fullWidth' >
      <DialogTitle>{`Editar dados de ${data.name}`}</DialogTitle>
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
              id="name"
              label="CPF"
              type="number"
              name='document'
              fullWidth
              variant="standard"
              error={!!(formik.touched.document && formik.errors.document)}
              helperText={formik.touched.document && formik.errors.document}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              defaultValue={data.document}
              values={formik.values.document}
              />
          <TextField
              margin="dense"
              id="name"
              label="Email Address"
              type="email"
              name='email'
              fullWidth
              variant="standard"
              error={!!(formik.touched.email && formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              defaultValue={data.email}
              values={formik.values.email}
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