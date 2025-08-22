"use client";

import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function TotalDonations({
  chartSeries,
  labels,
}: {
  chartSeries: number[];
  labels: string[];
}) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
    },
    labels,
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Total Donations" />
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {chartSeries[0]}% Completed
        </Typography>
        <Chart options={options} series={chartSeries} type="donut" height={220} />
      </CardContent>
    </Card>
  );
}