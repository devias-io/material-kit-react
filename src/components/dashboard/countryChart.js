import { Typography } from '@mui/material';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const parseToChart1Object = (obj) => {
  //console.log(Object.entries(obj))
  let chart1Object = []
  if (obj){
    chart1Object.push({name: Capitalize(Object.entries(obj)[3][0]), cases: obj?.cases})
    chart1Object.push({name: Capitalize(Object.entries(obj)[5][0]), deaths: obj?.deaths})
    chart1Object.push({name: Capitalize(Object.entries(obj)[7][0]), recovered: obj?.recovered})
  }

  return chart1Object
}

const Capitalize = str => (
  (str.charAt(0).toUpperCase() + str.slice(1)).match(/[A-Z][a-z]+|[0-9]+/g).join(" ")
)

const parseToChart2Object = (obj) => {
  //console.log(Object.entries(obj))
  let chart2Object = []
  if (obj){
    chart2Object.push({name: Capitalize(Object.entries(obj)[9][0]), active: obj?.active})
    chart2Object.push({name: Capitalize(Object.entries(obj)[10][0]), critical: obj?.critical})
    chart2Object.push({name: Capitalize(Object.entries(obj)[4][0]), todayCases: obj?.todayCases})
    chart2Object.push({name: Capitalize(Object.entries(obj)[6][0]), todayDeaths: obj?.todayDeaths})
  }

  return chart2Object
}

export const CountryChart = ({countryData, picked}) => {
  let chart1Object = {}
  let chart2Object = {}
  chart1Object = parseToChart1Object(countryData)
  chart2Object = parseToChart2Object(countryData)
  console.log(chart1Object)
  console.log(chart2Object)
  console.log(picked)

  return (
    <>
      {picked ? (
        <div style={{width: '100%', height: '500px'}}>
        <ResponsiveContainer width={"100%"} height="50%">
          <BarChart
            width={500}
            height={300}
            data={chart1Object}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barSize={30}
            >
              <CartesianGrid strokeDasharray={"3 3"} />
              <XAxis dataKey="name"   />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cases" fill="blue" />
              <Bar dataKey="deaths" fill="red" />
              <Bar dataKey="recovered" fill="green" />

            </BarChart>
           </ResponsiveContainer>
          <ResponsiveContainer width={"100%"} height="50%">
            <BarChart
              width={500}
              height={300}
              data={chart2Object}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barSize={30}
              >
              <CartesianGrid strokeDasharray={"3 3"} />
              <XAxis dataKey="name"   />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" fill="#dae063" />
              <Bar dataKey="critical" fill="#ad2323" />
              <Bar dataKey="todayCases" fill="#648ee3" />
              <Bar dataKey="todayDeaths" fill="#690101" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        ) : <Typography>No Data</Typography>

      }
    </>
)};
