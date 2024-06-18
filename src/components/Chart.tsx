'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'radar' | 'donut' | 'candlestick';
  options: any;
  series: any;
  height: number;
  width: number;
}

const Chart: React.FC<ChartProps> = ({ type, options, series, height, width }) => {
  return <ApexChart type={type} options={options} series={series} height={height} width={width} />;
};

export default Chart;
