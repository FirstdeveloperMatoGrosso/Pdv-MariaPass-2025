
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DadosGrafico {
  nome: string;
  valor: number;
  periodo: string;
}

interface GraficoVendasProps {
  dados: DadosGrafico[];
  tipo: 'bar' | 'line';
  titulo: string;
  corPrimaria?: string;
}

const chartConfig = {
  valor: {
    label: "Valor",
    color: "hsl(var(--chart-1))",
  },
};

const GraficoVendas: React.FC<GraficoVendasProps> = ({ 
  dados, 
  tipo, 
  titulo, 
  corPrimaria = "#10b981" 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          {tipo === 'bar' ? (
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nome" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="valor" 
                fill={corPrimaria}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nome" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke={corPrimaria}
                strokeWidth={2}
                dot={{ fill: corPrimaria, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default GraficoVendas;
