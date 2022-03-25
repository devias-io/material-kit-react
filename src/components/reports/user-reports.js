import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    
  } from '@mui/material';
  import Stack from '@mui/material/Stack';

  import { useEffect } from 'react';
  import axios from 'axios';
  

import { useFormik } from 'formik';
import * as Yup from 'yup';

export const UserReports = (props) => {

  const [id, setId] = useState("");
  console.log(id)
  useEffect (() => {

    console.log("Im here")

    const token = localStorage.getItem('token');
    console.log(token);

    axios.get(
      `https://5952-103-224-35-112.ngrok.io/users/me/`, {headers: {
        'Authorization': `bearer ${token}` 
      }})
        .then(res => { 
        setId(res.data.id)
      
    })

  })
  const [value, setValue] = useState(new Date('2014-08-18T21:11:54'));
    const formik = useFormik({
        initialValues: {
          taskType: '',
          title: '',
          start_time : '',
          stop_time : '',
          description: '',
          
        },
        validationSchema: Yup.object({
            taskType: Yup
            .string()
            .max(255)
            .required(
              'title is required'),
            title: Yup
            .string()
            .max(255)
            .required(
              'title is required'),
            start_time: Yup
            .string()
            .max(255)
            .required(
              'Start Time is required'),
            stop_time: Yup
            .string()
            .max(255)
            .required(
              'Stop Time is required'),
            description: Yup
            .string()
            .max(500)
            .required(
              'description is required'),
          }),  


        onSubmit: values => {
          //console.log(JSON.stringify(values))
          console.log(values)
          axios.post(
            `https://5952-103-224-35-112.ngrok.io/users/${id}/report`,values)
              .then(res => {
              console.log(res);
              console.log(res.data);  
          })
        }
      });

    const states = [
      {
        value: '',
        label: ''
      },
        {
          value: 'learning',
          label: 'Leaning'
        },
        {
          value: 'project',
          label: 'Projects'
        },
        {
          value: 'others',
          label: 'Others'
        }
      ];
    // <form onSubmit={formik.handleSubmit}>
    return (
      <form
        onSubmit={formik.handleSubmit}>
          
        <Card>
          <CardHeader
            title="Profile"
          />
          <Divider />
          <CardContent>
            <Grid
              container
              spacing={3}
            >
            
              <Grid
              item
              md={6}
              xs={12}
            >
               <TextField
                error={Boolean(formik.touched.taskType && formik.errors.taskType)}
                fullWidth
                helperText={formik.touched.taskType && formik.errors.taskType}
                label="Task type"
                name="taskType"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                select
                SelectProps={{ native: true }}
                value={formik.values.taskType}
                variant="outlined"
              >
                {states.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </TextField>
              
                
               
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                error={Boolean(formik.touched.title && formik.errors.title)}
                fullWidth
                helperText={formik.touched.title && formik.errors.title}
                label="title"
                name="title"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.title}
                variant="outlined"
              />
               
            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
             <Stack component="form" noValidate spacing={3}>
             <TextField
             error={Boolean(formik.touched.start_time && formik.errors.start_time)}
             fullWidth
             helperText={formik.touched.start_time && formik.errors.start_time}
              id="datetime-local"
              name="start_time"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}        
                type="datetime-local"
                label="Start time"
                sx={{ width: "100%" }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
    </Stack>

            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
             <Stack component="form" noValidate spacing={3}>
      <TextField
        error={Boolean(formik.touched.stop_time && formik.errors.stop_time)}
        fullWidth
        helperText={formik.touched.stop_time && formik.errors.stop_time}
        id="datetime-local"
        onBlur={formik.handleBlur}
        onChange={formik.handleChange}
        name="stop_time"
        type="datetime-local"
        label="Stop time"
        sx={{ width: "100%" }}
        InputLabelProps={{
          shrink: true,
        }}
      />
    </Stack>

            </Grid>
            </Grid>
            <Grid
                container
                spacing={0}
              item
             
            >
              <Box
                sx={{
                    margin:0,
                    marginTop:3,
                    width: '100%',
                    maxWidth: '100%',
                }}
                >   
                <TextField style={{width:"100%"}}
                        error={Boolean(formik.touched.description && formik.errors.description)}
                        fullWidth
                        helperText={formik.touched.description && formik.errors.description}
                        id="outlined-multiline-static"
                        name="description"
                        label="description"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        value={formik.values.full_name}
                        multiline
                        rows={10}
                        variant="outlined"
                        />
            </Box>
            </Grid>
                
          </CardContent>
          <Divider />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              p: 2
            }}
          >
            <Button
               color="primary"
               disabled={formik.isSubmitting}
               fullWidth
               size="large"
               type="submit"
               variant="contained"
            >
              Save details
            </Button>
          </Box>
        </Card>
      </form>
    );
  };