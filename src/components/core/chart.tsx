'use client';
import dynamic from 'next/dynamic';
import { styled } from '@mui/material/styles';
import { ApexOptions } from 'apexcharts';
import { Component, ReactNode } from 'react';

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

// ✅ Error Boundary para capturar erros do ApexCharts
class ChartErrorBoundary extends Component
  { children: ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // ou <div>Erro ao carregar gráfico</div>
    }
    return this.props.children;
  }
}

// ✅ Função helper para sanitizar profundamente
function deepSanitize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  
  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = deepSanitize(obj[key]);
    }
  }
  return sanitized;
}

export const Chart = ({ options, series, type = 'line', ...props }: ChartProps) => {
  try {
    // ✅ Validação básica
    if (!series || !Array.isArray(series) || series.length === 0) {
      return null;
    }

    // ✅ Sanitiza series de forma segura
    const sanitizedSeries = series.map(s => {
      if (!s || typeof s !== 'object') {
        return { name: '', data: [] };
      }

      const data = Array.isArray(s.data) ? s.data : [];
      
      return {
        name: String(s.name || ''),
        data: data.map(val => {
          if (val === null || val === undefined) return 0;
          if (typeof val === 'number') return isNaN(val) ? 0 : val;
          if (typeof val === 'string') {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
          }
          if (typeof val === 'object' && val !== null) {
            // Para dados tipo {x, y}
            return {
              x: val.x != null ? val.x : 0,
              y: val.y != null ? (typeof val.y === 'number' ? val.y : parseFloat(val.y) || 0) : 0
            };
          }
          return 0;
        })
      };
    });

    // ✅ Sanitiza options - removendo tudo que pode causar toString em undefined
    const sanitizedOptions: ApexOptions = {
      chart: {
        ...options?.chart,
        type: type as any,
        toolbar: { show: false },
        animations: { enabled: false }
      },
      xaxis: {
        ...options?.xaxis,
        categories: Array.isArray(options?.xaxis?.categories)
          ? options.xaxis.categories.map(cat => cat != null ? String(cat) : '')
          : undefined
      },
      yaxis: options?.yaxis ? deepSanitize(options.yaxis) : undefined,
      dataLabels: { enabled: false },
      stroke: options?.stroke || {},
      colors: options?.colors || undefined,
      fill: options?.fill || undefined,
      legend: options?.legend || undefined,
      tooltip: { enabled: false }, // Desabilita tooltip temporariamente
      grid: options?.grid || undefined,
      plotOptions: options?.plotOptions || undefined,
      theme: options?.theme || undefined
    };

    // ✅ Remove propriedades undefined do options
    const cleanOptions = Object.entries(sanitizedOptions).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as ApexOptions);

    return (
      <ChartErrorBoundary>
        <StyledApexChart
          options={cleanOptions}
          series={sanitizedSeries}
          type={type as any}
          {...props}
        />
      </ChartErrorBoundary>
    );
  } catch (error) {
    console.error('Chart render error:', error);
    return null;
  }
};
