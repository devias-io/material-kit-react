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
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ChartErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
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
      return null;
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

const sanitizeDataPoint = (val: any) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === 'string') {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : null;
  }
  if (typeof val === 'object') {
    const x = typeof val.x === 'number' ? val.x : parseFloat(val.x);
    const y = typeof val.y === 'number' ? val.y : parseFloat(val.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }
  return null;
};

const sanitizeSeries = (series: any[]) =>
  series
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return { name: '', data: [] as any[] };
      }

      const rawData = Array.isArray(item.data) ? item.data : [];
      const sanitizedData = rawData
        .map((val) => sanitizeDataPoint(val))
        .filter((val) => val !== null);

      return {
        name: String(item.name || ''),
        data: sanitizedData
      };
    })
    .filter(item => Array.isArray(item.data) && item.data.length > 0);

export const Chart = ({ options, series, type = 'line', ...props }: ChartProps) => {
  try {
    // ✅ Validação básica
    if (!series || !Array.isArray(series) || series.length === 0) {
      return null;
    }

    // ✅ Sanitiza series de forma segura
    const sanitizedSeries = sanitizeSeries(series);
    if (sanitizedSeries.length === 0) {
      return null;
    }

    // ✅ Alinha colors com as séries sanitizadas (evita undefined no ApexCharts)
    let alignedColors: string[] | undefined;
    if (Array.isArray(options?.colors) && options.colors.length > 0) {
      // Mapeia cores para as séries que sobreviveram à sanitização
      const originalNames = series.map((s: any) => String(s?.name || ''));
      alignedColors = sanitizedSeries.map((s: any) => {
        const idx = originalNames.indexOf(s.name);
        const color = idx >= 0 ? options!.colors![idx] : undefined;
        return typeof color === 'string' ? color : '#6b7280';
      });
    }

    // ✅ Sanitiza options
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
      colors: alignedColors || undefined,
      fill: options?.fill || undefined,
      legend: options?.legend || undefined,
      tooltip: { enabled: false },
      grid: options?.grid || undefined,
      plotOptions: options?.plotOptions || undefined,
      theme: options?.theme || undefined
    };

    // ✅ Remove propriedades undefined
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
