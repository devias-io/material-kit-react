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
  // ✅ Log para debug - veja o que está chegando
  console.log('Chart Debug:', { 
    series, 
    options,
    hasData: series?.[0]?.data,
    firstDataPoint: series?.[0]?.data?.[0]
  });

  // ✅ Validação mais rigorosa
  if (!series || !Array.isArray(series) || series.length === 0) {
    console.warn('Chart: series inválida');
    return null;
  }

  // ✅ Sanitiza TODOS os dados de forma profunda
  const sanitizedSeries = series.map(s => {
    if (!s) return { data: [] };
    
    return {
      ...s,
      name: s.name || '',
      data: Array.isArray(s.data) 
        ? s.data.map(val => {
            // Converte tudo para número ou 0
            if (val == null || val === undefined) return 0;
            if (typeof val === 'object' && val.y != null) return { ...val, y: Number(val.y) || 0 };
            return Number(val) || 0;
          })
        : []
    };
  });

  // ✅ Sanitiza options de forma mais profunda
  const sanitizedOptions: ApexOptions = {
    ...options,
    chart: {
      ...options.chart,
      animations: {
        enabled: false // desabilita animações temporariamente
      }
    },
    xaxis: {
      ...options.xaxis,
      categories: Array.isArray(options.xaxis?.categories)
        ? options.xaxis.categories.map(cat => cat != null ? String(cat) : '')
        : []
    },
    // ✅ Garante que labels/formatters não causem erro
    tooltip: {
      ...options.tooltip,
      enabled: false // desabilita tooltip temporariamente
    }
  };

  // ✅ Última validação antes de renderizar
  if (sanitizedSeries.every(s => !s.data || s.data.length === 0)) {
    console.warn('Chart: Nenhuma série tem dados válidos');
    return null;
  }

  return (
    <StyledApexChart
      options={sanitizedOptions}
      series={sanitizedSeries}
      {...props}
    />
  );
};
