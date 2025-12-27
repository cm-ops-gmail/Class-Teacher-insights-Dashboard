"use client";

import { useMemo } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import type { ClassEntry } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

interface TeacherPerformanceChartsProps {
  data: ClassEntry[];
}

const parseNumericValue = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

type TeacherStats = {
  name: string;
  classCount: number;
  totalDuration: number;
  totalAverageAttendance: number;
  avgAttendance: number;
  highestPeakAttendance: number;
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(220 84% 60%)",
  "hsl(20 84% 60%)",
  "hsl(340 84% 60%)",
  "hsl(100 84% 60%)",
  "hsl(280 84% 60%)",
  "hsl(180 84% 60%)",
  "hsl(60 84% 60%)",
  "hsl(300 84% 60%)",
  "hsl(140 84% 60%)",
  "hsl(260 84% 60%)",
];

const processChartData = (
  statsArray: TeacherStats[],
  valueKey: keyof TeacherStats
) => {
  const sorted = [...statsArray].sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number));
  const top15 = sorted.slice(0, 15);
  const others = sorted.slice(15);

  const chartData = top15.map(teacher => ({
    name: teacher.name,
    value: teacher[valueKey] as number,
  }));

  if (others.length > 0) {
    const othersValue = others.reduce((acc, teacher) => acc + (teacher[valueKey] as number), 0);
    chartData.push({ name: 'Others', value: Math.round(othersValue) });
  }

  return chartData.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));
};

export function TeacherPerformanceCharts({ data }: TeacherPerformanceChartsProps) {
  const teacherStats = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const stats: { [key: string]: TeacherStats } = {};

    data.forEach(item => {
      const teacherName = item.teacher1;
      if (!teacherName) return;

      if (!stats[teacherName]) {
        stats[teacherName] = {
          name: teacherName,
          classCount: 0,
          totalDuration: 0,
          totalAverageAttendance: 0,
          avgAttendance: 0,
          highestPeakAttendance: 0,
        };
      }
      
      const currentStats = stats[teacherName];
      currentStats.classCount += 1;
      currentStats.totalDuration += parseNumericValue(item.totalDurationMinutes);
      currentStats.totalAverageAttendance += parseNumericValue(item.averageAttendance);
      
      const peakAttendance = parseNumericValue(item.highestAttendance);
      if (peakAttendance > currentStats.highestPeakAttendance) {
        currentStats.highestPeakAttendance = peakAttendance;
      }
    });

    Object.values(stats).forEach(t => {
      t.avgAttendance = t.classCount > 0 ? Math.round(t.totalAverageAttendance / t.classCount) : 0;
    });

    return Object.values(stats);
  }, [data]);
  
  const chartConfig = (data: any[]) => {
      const config: any = {};
      data.forEach(item => {
          config[item.name] = { label: item.name, color: item.fill };
      });
      return config;
  };

  const classCountData = processChartData(teacherStats, 'classCount');
  const avgAttendanceData = processChartData(teacherStats, 'avgAttendance');
  const highestAttendanceData = processChartData(teacherStats, 'highestPeakAttendance');
  const totalDurationData = processChartData(teacherStats, 'totalDuration');

  if (!data || data.length === 0) {
    return null;
  }
  
  const chartCards = [
    { title: "Classes Taught", data: classCountData },
    { title: "Average Attendance", data: avgAttendanceData },
    { title: "Peak Attendance", data: highestAttendanceData },
    { title: "Total Duration (min)", data: totalDurationData },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {chartCards.map(({ title, data }) => (
        <Card key={title} className="flex flex-col">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Top 15 Teachers Distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center pb-0">
            <ChartContainer
              config={chartConfig(data)}
              className="mx-auto aspect-square w-full max-w-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                   {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
