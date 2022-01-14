import React, { useState, useEffect } from "react";
import FormControl from '@mui/material/FormControl';
//import { fetchCountries } from "../../api";
import NativeSelect from '@mui/material/NativeSelect';

const CountryPicker = ({countriesList, handleCountryChange}) => {
  
  return (
    <FormControl > 
      <NativeSelect
        defaultValue=""
        onChange={(e) => handleCountryChange(e.target.value)}
      >
        <option value="">Pick a country</option>
        {countriesList?.map((country, key) => (
          <option key={key} value={country.country}>
            {country.country}
          </option>
        ))}
      </NativeSelect>
    </FormControl>
  );
};

export default CountryPicker;