import React from 'react';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { TextField, Button, Typography, Box, Container, Grid, Select, FormControl, InputLabel, MenuItem, TextareaAutosize, Input } from '@mui/material';
import { Field, Formik } from 'formik';
import { createProduct } from 'src/api/functions/products';
import { Link } from 'react-router-dom';

const Page = () => {

    const initialValues = {
        titleEN: '',
        titleFR: '',
        titleAR: '',
        descriptionEN: '',
        descriptionFR: '',
        descriptionAR: '',
        price: '',
        image: null,
        categories: '',
    };

    const types = [
        { label: 'salon', value: 'salon' },
        { label: 'living room', value: 'living-room' },
        { label: 'lamp', value: 'lamp' },
    ];

    const handleSubmit = async () => {

        console.log("*******", initialValues);

        try {

            const res = await createProduct(initialValues);

            if (res.data) {
                console.log(res.data);
            }

        } catch (error) {
            console.log(error);
        }

    };


    return (
        <Container>
            <Box sx={{ marginTop: 4 }}>
                <Typography variant="h4" component="h1" align="center" gutterBottom>
                    Add New Product
                </Typography>
                <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                    {(formikProps) => (
                        <form onSubmit={formikProps.handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Title (EN)"
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                        required
                                        name="titleEN"
                                        value={formikProps.values.titleEN}
                                        onChange={formikProps.handleChange}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Price"
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                        type="number"
                                        name="price"
                                        value={formikProps.values.price}
                                        onChange={formikProps.handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextareaAutosize
                                        minRows={3}
                                        placeholder="Description (EN)"
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                                        name="descriptionEN"
                                        value={formikProps.values.descriptionEN}
                                        onChange={formikProps.handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sx={{ marginTop: 2 }}>
                                    <InputLabel>Image</InputLabel>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        fullWidth
                                        margin="normal"
                                        name="image"
                                        onChange={(event) => {
                                            formikProps.setFieldValue('image', event.currentTarget.files[0]);
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{ marginTop: 2 }}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="categories-label">Categories</InputLabel>
                                        <Select
                                            labelId="categories-label"
                                            label="Categories"
                                            name="categories"
                                            value={formikProps.values.categories}
                                            onChange={formikProps.handleChange}
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            {types.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        sx={{ marginTop: 2 }}
                                    >
                                        Save
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    {/* <Link href="/"> */}
                                    <Button
                                        type="reset"
                                        fullWidth
                                        sx={{ marginTop: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                    {/* </Link> */}
                                </Grid>
                            </Grid>
                        </form>
                    )}
                </Formik>
            </Box>
        </Container>
    );
};

Page.getLayout = (page) => (
    <DashboardLayout>
        {page}
    </DashboardLayout>
);

export default Page;
