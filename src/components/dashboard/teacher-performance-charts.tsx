"use client";

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, LabelList } from 'recharts';
import type { ClassEntry, AppClassEntry } from '@/lib/definitions';
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
import { Button } from '../ui/button';
import { Info } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

type DataEntry = ClassEntry | AppClassEntry;

interface TeacherPerformanceChartsProps {
  data: DataEntry[];
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
  lateEntries: number;
};

const isAppEntry = (entry: DataEntry): entry is AppClassEntry => 'product' in entry;


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

  const chartData = top30.map(item => ({
    name: item.name,
    value: item[valueKey] as number,
  }));

  if (others.length > 0) {
    const othersValue = others.reduce((acc, item) => acc + (item[valueKey] as number), 0);
    // Add "Others" to the end
    chartData.push({ name: 'Others', value: Math.round(othersValue) });
  }
  
  // Assign colors
  const finalChartData = chartData.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return { chartData: finalChartData, othersData: others };
};

const CustomTooltipContent = ({ active, payload, label, total, metricLabel }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
    return (
      <div className="rounded-lg border bg-background p-2.5 text-sm shadow-sm">
        <div className="grid grid-cols-1 gap-1.5">
          <p className="font-bold">{label}</p>
          <p>{metricLabel}: <span className="font-bold">{value.toLocaleString()}</span></p>
          <p>Percentage: <span className="font-bold">{percentage}%</span></p>
          <p>Total: <span className="font-bold">{total.toLocaleString()}</span></p>
        </div>
      </div>
    );
  }
  return null;
};


export function TeacherPerformanceCharts({ data }: TeacherPerformanceChartsProps) {
  const { teacherStats, totals } = useMemo(() => {
    if (!data || data.length === 0) {
      return { teacherStats: [], totals: { classCount: 0, avgAttendance: 0, totalDuration: 0, lateEntries: 0 } };
    }

    const stats: { [key: string]: TeacherStats } = {};

    data.forEach(item => {
      const teacherName = item.teacher;
      if (!teacherName) return;

      if (!stats[teacherName]) {
        stats[teacherName] = {
          name: teacherName,
          classCount: 0,
          totalDuration: 0,
          totalAverageAttendance: 0,
          avgAttendance: 0,
          highestPeakAttendance: 0,
          lateEntries: 0,
        };
      }
      
      const currentStats = stats[teacherName];
      currentStats.classCount += 1;

      let scheduledTime;
      let entryTime;

      if (isAppEntry(item)) {
        currentStats.totalDuration += parseNumericValue(item.classDuration);
        currentStats.totalAverageAttendance += parseNumericValue(item.totalAttendance);
        const peakAttendance = parseNumericValue(item.totalAttendance);
        if (peakAttendance > currentStats.highestPeakAttendance) {
            currentStats.highestPeakAttendance = peakAttendance;
        }
        scheduledTime = item.scheduleTime;
        entryTime = item.teacherEntryTime;

      } else {
        currentStats.totalDuration += parseNumericValue(item.totalDuration);
        currentStats.totalAverageAttendance += parseNumericValue(item.averageAttendance);
        const peakAttendance = parseNumericValue(item.highestAttendance);
        if (peakAttendance > currentStats.highestPeakAttendance) {
          currentStats.highestPeakAttendance = peakAttendance;
        }
        scheduledTime = (item as ClassEntry).scheduledTime;
        entryTime = (item as ClassEntry).entryTime;
      }

      if (scheduledTime && entryTime) {
          const scheduleDate = new Date(`1/1/2000 ${scheduledTime}`);
          const entryDate = new Date(`1/1/2000 ${entryTime}`);

          if (isNaN(scheduleDate.getTime()) || isNaN(entryDate.getTime())) return;

          const diffMinutes = (scheduleDate.getTime() - entryDate.getTime()) / (1000 * 60);
          if (diffMinutes < 30) {
              currentStats.lateEntries += 1;
          }
      }
    });

    Object.values(stats).forEach(t => {
      t.avgAttendance = t.classCount > 0 ? Math.round(t.totalAverageAttendance / t.classCount) : 0;
    });

    const statsArray = Object.values(stats);
    
    const totals = {
      classCount: statsArray.reduce((acc, t) => acc + t.classCount, 0),
      avgAttendance: statsArray.reduce((acc, t) => acc + t.avgAttendance, 0),
      totalDuration: statsArray.reduce((acc, t) => acc + t.totalDuration, 0),
      lateEntries: statsArray.reduce((acc, t) => acc + t.lateEntries, 0),
    };


    return { teacherStats: statsArray, totals };
  }, [data]);

  const chartConfig = (data: any[]) => {
      const config: any = {};
      data.forEach(item => {
          config[item.name] = { label: item.name, color: item.fill };
      });
      return config;
  };

  const { chartData: classCountData, othersData: classCountOthers } = processChartData(teacherStats, 'classCount');
  const { chartData: avgAttendanceData, othersData: avgAttendanceOthers } = processChartData(teacherStats, 'avgAttendance');
  const { chartData: totalDurationData, othersData: totalDurationOthers } = processChartData(teacherStats, 'totalDuration');
  const { chartData: lateEntriesData, othersData: lateEntriesOthers } = processChartData(teacherStats, 'lateEntries');

  if (!data || data.length === 0) {
    return null;
  }
  
  const allChartCards = [
    { title: "Classes Taught by Teacher", data: classCountData, total: totals.classCount, metricLabel: 'Classes', othersData: classCountOthers, valueKey: 'classCount' as keyof TeacherStats },
    { title: "Average Attendance by Teacher", data: avgAttendanceData, total: totals.avgAttendance, metricLabel: 'Avg. Attendance', othersData: avgAttendanceOthers, valueKey: 'avgAttendance' as keyof TeacherStats },
    { title: "Total Duration (min) by Teacher", data: totalDurationData, total: totals.totalDuration, metricLabel: 'Duration (min)', othersData: totalDurationOthers, valueKey: 'totalDuration' as keyof TeacherStats },
    { title: "Most Late Entries by Teacher", data: lateEntriesData, total: totals.lateEntries, metricLabel: 'Late Entries', othersData: lateEntriesOthers, valueKey: 'lateEntries' as keyof TeacherStats },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {allChartCards.map(({ title, data, total, metricLabel, othersData, valueKey }) => {
        const top30Value = data.filter(d => d.name !== 'Others').reduce((acc, d) => acc + d.value, 0);
        const othersValue = data.find(d => d.name === 'Others')?.value ?? 0;
        const top30Percent = total > 0 ? ((top30Value / total) * 100).toFixed(1) : 0;
        const othersPercent = total > 0 ? ((othersValue / total) * 100).toFixed(1) : 0;
        
        return (
          <Card key={title} className="flex flex-col">
            <CardHeader>
              <CardTitle>{title} ({total.toLocaleString()})</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>Top 30 contribute {top30Percent}% of the total.</span>
                {othersData.length > 0 && (
                   <div className="flex items-center gap-1">
                        <span>Others contribute {othersPercent}%.</span>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5"><Info className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Teachers in "Others"</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-96 mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Teacher</TableHead>
                                                <TableHead className="text-right">{metricLabel}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {othersData.sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number)).map(teacher => (
                                                <TableRow key={teacher.name}>
                                                    <TableCell className="font-medium">{teacher.name}</TableCell>
                                                    <TableCell className="text-right">{(teacher[valueKey] as number).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                   </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pl-0 pr-6">
              <ChartContainer
                config={chartConfig(data)}
                className="h-[1200px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={data}
                  layout="vertical"
                  margin={{
                    left: 10,
                    right: 30,
                  }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={150}
                    className="text-xs"
                    interval={0}
                  />
                  <XAxis dataKey="value" type="number" hide />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<CustomTooltipContent total={total} metricLabel={metricLabel} />}
                  />
                  <Bar
                    dataKey="value"
                    radius={5}
                    barSize={20}
                  >
                     <LabelList
                        dataKey="value"
                        position="right"
                        offset={8}
                        className="fill-foreground text-xs"
                        formatter={(value: number) => value.toLocaleString()}
                      />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
