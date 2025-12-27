
"use client";

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
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
  // Sort by performance to get the top 30
  const performanceSorted = [...statsArray].sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number));
  const top30 = performanceSorted.slice(0, 30);
  const others = performanceSorted.slice(30);

  // Now, sort the top 30 alphabetically by name
  const alphaSortedTop30 = top30.sort((a, b) => a.name.localeCompare(b.name));

  const chartData = alphaSortedTop30.map(teacher => ({
    name: teacher.name,
    value: teacher[valueKey] as number,
  }));

  if (others.length > 0) {
    const othersValue = others.reduce((acc, teacher) => acc + (teacher[valueKey] as number), 0);
    // Add "Others" to the end
    chartData.push({ name: 'Others', value: Math.round(othersValue) });
  }
  
  // Assign colors
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
    <div className="grid grid-cols-1 gap-6">
      {chartCards.map(({ title, data }) => (
        <Card key={title} className="flex flex-col">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Top 30 Teachers Distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pl-0 pr-6">
            <ChartContainer
              config={chartConfig(data)}
              className="h-[800px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 10,
                }}
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={120}
                  className="text-xs"
                />
                <XAxis dataKey="value" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="value"
                  radius={5}
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

