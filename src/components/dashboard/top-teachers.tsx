
"use client";

import { useMemo } from 'react';
import type { ClassEntry } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Clock, Star, UserCheck, Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

interface TopTeachersProps {
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
  classes: ClassEntry[];
  highestAttendanceClass: ClassEntry | null;
};

export function TopTeachers({ data }: TopTeachersProps) {
  const { topTeachers, teacherDetails } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        topTeachers: {
          byClassCount: [],
          byAverageAttendance: [],
          byHighestAttendance: [],
          byTotalDuration: [],
        },
        teacherDetails: {},
      };
    }

    const teacherStats: { [key: string]: TeacherStats } = {};

    data.forEach(item => {
      const teacherName = item.teacher;
      if (!teacherName) return;

      if (!teacherStats[teacherName]) {
        teacherStats[teacherName] = {
          name: teacherName,
          classCount: 0,
          totalDuration: 0,
          totalAverageAttendance: 0,
          avgAttendance: 0,
          highestPeakAttendance: 0,
          classes: [],
          highestAttendanceClass: null,
        };
      }

      teacherStats[teacherName].classCount += 1;
      teacherStats[teacherName].totalDuration += parseNumericValue(item.totalDuration);
      teacherStats[teacherName].totalAverageAttendance += parseNumericValue(item.averageAttendance);
      teacherStats[teacherName].classes.push(item);
      
      const peakAttendance = parseNumericValue(item.highestAttendance);
      if (peakAttendance > teacherStats[teacherName].highestPeakAttendance) {
        teacherStats[teacherName].highestPeakAttendance = peakAttendance;
        teacherStats[teacherName].highestAttendanceClass = item;
      }
    });

    Object.values(teacherStats).forEach(t => {
      t.avgAttendance = t.classCount > 0 ? Math.round(t.totalAverageAttendance / t.classCount) : 0;
    });

    const statsArray = Object.values(teacherStats);
    
    const byClassCount = [...statsArray].sort((a, b) => b.classCount - a.classCount).slice(0, 5);
    const byAverageAttendance = [...statsArray].sort((a, b) => b.avgAttendance - a.avgAttendance).slice(0, 5);
    const byHighestAttendance = [...statsArray].sort((a, b) => b.highestPeakAttendance - a.highestPeakAttendance).slice(0, 5);
    const byTotalDuration = [...statsArray].sort((a, b) => b.totalDuration - a.totalDuration).slice(0, 5);

    return { 
      topTeachers: { byClassCount, byAverageAttendance, byHighestAttendance, byTotalDuration },
      teacherDetails: teacherStats,
    };
  }, [data]);
  
  if (data.length === 0) {
    return null;
  }
  
  const StatPopover = ({ teacherName, statType, details }: { teacherName: string, statType: string, details: TeacherStats }) => {
    let content;
    switch(statType) {
        case 'classCount':
            content = (
              <ScrollArea className="h-48">
                <div className="flex flex-col gap-2 text-sm pr-4">
                  {details.classes.map(c => (
                    <div key={c.id} className="flex justify-between items-center border-b pb-1">
                      <span className="truncate max-w-[150px]">{c.subject}</span>
                      <Badge variant="secondary">{c.date}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            );
            break;
        case 'avgAttendance':
            content = <p className="text-sm text-muted-foreground">Based on {details.classCount} classes.</p>
            break;
        case 'highestAttendance':
            content = (
                <div className="text-sm">
                    {details.highestAttendanceClass ? (
                        <>
                            <p className="font-bold">{details.highestAttendanceClass.subject}</p>
                            <p className="text-xs text-muted-foreground">{details.highestAttendanceClass.date}</p>
                        </>
                    ) : 'No data'}
                </div>
            );
            break;
        case 'totalDuration':
             content = <p className="text-sm text-muted-foreground">Total from {details.classCount} classes.</p>;
             break;
        default:
            content = null;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-2"><Info className="h-3 w-3" /></Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64">
                <h4 className="font-bold mb-2">{teacherName}</h4>
                {content}
            </PopoverContent>
        </Popover>
    );
  };


  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-chart-1/50 hover:border-chart-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Classes Taught</CardTitle>
          <Award className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {topTeachers.byClassCount.map((teacher, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-chart-1">{teacher.name}</span>
                <div className="flex items-center">
                    <span className="font-bold text-chart-1">{teacher.classCount} classes</span>
                    <StatPopover teacherName={teacher.name} statType="classCount" details={teacherDetails[teacher.name]} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
       <Card className="border-chart-2/50 hover:border-chart-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Average Attendance</CardTitle>
          <UserCheck className="h-4 w-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {topTeachers.byAverageAttendance.map((teacher, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-chart-2">{teacher.name}</span>
                <div className="flex items-center">
                    <span className="font-bold text-chart-2">{teacher.avgAttendance.toLocaleString()}</span>
                    <StatPopover teacherName={teacher.name} statType="avgAttendance" details={teacherDetails[teacher.name]} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-chart-5/50 hover:border-chart-5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Peak Attendance</CardTitle>
          <Star className="h-4 w-4 text-chart-5" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {topTeachers.byHighestAttendance.map((teacher, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-chart-5">{teacher.name}</span>
                <div className="flex items-center">
                    <span className="font-bold text-chart-5">{teacher.highestPeakAttendance.toLocaleString()}</span>
                    <StatPopover teacherName={teacher.name} statType="highestAttendance" details={teacherDetails[teacher.name]} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-chart-4/50 hover:border-chart-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Longest Total Duration</CardTitle>
          <Clock className="h-4 w-4 text-chart-4" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {topTeachers.byTotalDuration.map((teacher, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-chart-4">{teacher.name}</span>
                <div className="flex items-center">
                    <span className="font-bold text-chart-4">{teacher.totalDuration.toLocaleString()} min</span>
                    <StatPopover teacherName={teacher.name} statType="totalDuration" details={teacherDetails[teacher.name]} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
