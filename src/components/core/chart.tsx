'use client';
import dynamic from 'next/dynamic';
import { styled } from '@mui/material/styles';
import { ApexOptions } from 'apexcharts';

const ApexChart = dynamic(() => import('react-apexcharts'), { 
  ssr: false, 
  loading: () => null 
});

const StyledApexChart = styled(ApexChart)``;

interface ChartProps {
  options: ApexOptions;
  series: any[];
  type?: string;
  height?: string | number;
  width?: string | number;
  [key: string]: any;
}

export const Chart = ({ options, series, ...props }: ChartProps) => {
  // ✅ Validação com warning em desenvolvimento
  if (!series || series.length === 0 || !series[0]?.data) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Chart: Dados inválidos ou vazios', { series });
    }
    return null;
  }

  // ✅ Sanitiza apenas valores null/undefined, mantém 0 legítimos
  const sanitizedSeries = series.map(s => ({
    ...s,
    data: Array.isArray(s.data) 
      ? s.data.map(val => val == null ? 0 : val) // só substitui null/undefined
      : []
  }));

  const sanitizedOptions = {
    ...options,
    xaxis: {
      ...options.xaxis,
      categories: options.xaxis?.categories?.filter(cat => cat != null) || []
    }
  };

  return (
    <StyledApexChart
      options={sanitizedOptions}
      series={sanitizedSeries}
      {...props}
    />
  );
};
