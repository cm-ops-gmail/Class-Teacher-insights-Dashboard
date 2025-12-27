'use client';

import React, { useState, useMemo } from 'react';
import type { ClassEntry } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Clock, Star, Users, BookOpen, Package, Info, UserSearch } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MultiSelectFilter } from './multi-select-filter';

interface TeacherComparisonProps {
  data: ClassEntry[];
  allTeachers: string[];
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
  uniqueCourses: string[];
  uniqueProductTypes: string[];
  highestAttendanceClass: ClassEntry | null;
  classes: ClassEntry[];
};

const calculateTeacherGroupStats = (teacherNames: string[], allData: ClassEntry[]): TeacherStats | null => {
  if (!teacherNames || teacherNames.length === 0) return null;

  const teacherClasses = allData.filter(item => teacherNames.includes(item.teacher1));
  if (teacherClasses.length === 0) {
    return {
      name: teacherNames.join(', '),
      classCount: 0,
      totalDuration: 0,
      totalAverageAttendance: 0,
      avgAttendance: 0,
      highestPeakAttendance: 0,
      uniqueCourses: [],
      uniqueProductTypes: [],
      highestAttendanceClass: null,
      classes: [],
    };
  }

  const totalAverageAttendance = teacherClasses.reduce((acc, item) => acc + parseNumericValue(item.averageAttendance), 0);
  const totalDuration = teacherClasses.reduce((acc, item) => acc + parseNumericValue(item.totalDurationMinutes), 0);
  
  let highestPeakAttendance = 0;
  let highestAttendanceClass: ClassEntry | null = null;
  teacherClasses.forEach(item => {
    const peak = parseNumericValue(item.highestAttendance);
    if (peak > highestPeakAttendance) {
      highestPeakAttendance = peak;
      highestAttendanceClass = item;
    }
  });

  return {
    name: teacherNames.join(', '),
    classCount: teacherClasses.length,
    totalDuration,
    totalAverageAttendance,
    avgAttendance: teacherClasses.length > 0 ? Math.round(totalAverageAttendance / teacherClasses.length) : 0,
    highestPeakAttendance,
    uniqueCourses: [...new Set(teacherClasses.map(c => c.course).filter(Boolean))],
    uniqueProductTypes: [...new Set(teacherClasses.map(c => c.productType).filter(Boolean))],
    highestAttendanceClass,
    classes: teacherClasses,
  };
};

const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let result = '';
    if (hours > 0) {
      result += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
      result += `${minutes} min${minutes > 1 ? 's' : ''}`;
    }
    return result.trim() || '0 min';
  };

const StatPopover = ({ details, statType }: { details: TeacherStats | null, statType: keyof TeacherStats | 'avgAttendance' }) => {
    if (!details) return null;

    let content;
    let title;
    let isDialog = false;

    switch (statType) {
        case 'classCount':
            isDialog = true;
            title = `Classes Taught by ${details.name}`;
            content = (
                <ScrollArea className="h-96 mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Topic</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {details.classes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => (
                                <TableRow key={c.id}>
                                    <TableCell><Badge variant="secondary">{c.date}</Badge></TableCell>
                                    <TableCell className="font-medium max-w-[300px] truncate">{c.topic}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">Total</TableCell>
                                <TableCell className="font-bold">{details.classCount}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </ScrollArea>
            );
            break;
        case 'avgAttendance':
            isDialog = true;
            title = "Average Attendance Calculation"
            content = (
                <div className="grid gap-4 py-4 text-sm mt-4">
                    <p>Total Combined Attendance: {details.totalAverageAttendance.toLocaleString()}</p>
                    <p>Total Classes: {details.classCount.toLocaleString()}</p>
                    <p className="font-bold border-t pt-2 mt-1">
                        {details.totalAverageAttendance.toLocaleString()} / {details.classCount > 0 ? details.classCount.toLocaleString() : 1} = {details.avgAttendance.toLocaleString()}
                    </p>
                </div>
            );
            break;
        case 'highestPeakAttendance':
            isDialog = true;
            title = "Highest Attendance Class";
            content = (
                <div className="text-sm p-4 space-y-1">
                    {details.highestAttendanceClass ? (
                        <>
                            <h4 className="font-semibold">{details.name}</h4>
                            <p className="font-bold text-base">{details.highestAttendanceClass.topic}</p>
                            <p className="text-xs text-muted-foreground">{details.highestAttendanceClass.date}</p>
                        </>
                    ) : 'No data available'}
                </div>
            );
            break;
        case 'totalDuration':
             isDialog = true;
             title = "Total Duration";
             content = <div className="font-bold text-lg p-4">{formatDuration(details.totalDuration)}</div>
             break;
        case 'uniqueCourses':
             isDialog = true;
             title = `Unique Courses Taught by ${details.name}`;
             content = (
                 <ScrollArea className="h-72 mt-4">
                    <div className="flex flex-wrap gap-2 p-1">
                        {details.uniqueCourses.map(c => <Badge key={c} variant="secondary" className="text-base">{c}</Badge>)}
                    </div>
                </ScrollArea>
             );
             break;
        case 'uniqueProductTypes':
             isDialog = true;
             title = `Unique Product Types Taught by ${details.name}`;
             content = (
                 <ScrollArea className="h-72 mt-4">
                    <div className="flex flex-wrap gap-2 p-1">
                        {details.uniqueProductTypes.map(p => <Badge key={p} variant="secondary" className="text-base">{p}</Badge>)}
                    </div>
                 </ScrollArea>
             );
             break;
        default:
            return null;
    }

    if (isDialog) {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5"><Info className="h-4 w-4 text-muted-foreground" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5"><Info className="h-4 w-4 text-muted-foreground" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
};


export function TeacherComparison({ data, allTeachers }: TeacherComparisonProps) {
  const [teacherGroup1, setTeacherGroup1] = useState<string[]>([]);
  const [teacherGroup2, setTeacherGroup2] = useState<string[]>([]);
  
  const teacherOptions = useMemo(() => allTeachers.map(t => ({ value: t, label: t })), [allTeachers]);

  const teacherGroup1Stats = useMemo(() => calculateTeacherGroupStats(teacherGroup1, data), [teacherGroup1, data]);
  const teacherGroup2Stats = useMemo(() => calculateTeacherGroupStats(teacherGroup2, data), [teacherGroup2, data]);

  const statsToCompare: { label: string; icon: React.ElementType; key: keyof TeacherStats; unit?: string }[] = [
    { label: "Total Classes", icon: Award, key: "classCount" },
    { label: "Avg. Attendance", icon: Users, key: "avgAttendance" },
    { label: "Highest Peak Attendance", icon: Star, key: "highestPeakAttendance" },
    { label: "Total Duration", icon: Clock, key: "totalDuration", unit: " min" },
    { label: "Unique Courses", icon: BookOpen, key: "uniqueCourses", unit: ""},
    { label: "Unique Product Types", icon: Package, key: "uniqueProductTypes", unit: "" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Comparison</CardTitle>
        <CardDescription>Select two teachers or groups of teachers to compare their performance metrics side-by-side.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelectFilter
                title="Select Group 1..."
                options={teacherOptions.filter(t => !teacherGroup2.includes(t.value))}
                selectedValues={teacherGroup1}
                onSelectedValuesChange={setTeacherGroup1}
                triggerClassName="w-full"
            />
            <MultiSelectFilter
                title="Select Group 2..."
                options={teacherOptions.filter(t => !teacherGroup1.includes(t.value))}
                selectedValues={teacherGroup2}
                onSelectedValuesChange={setTeacherGroup2}
                triggerClassName="w-full"
            />
        </div>

        {teacherGroup1.length > 0 && teacherGroup2.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Metric</TableHead>
                        <TableHead className="text-right">{teacherGroup1Stats?.name || 'Group 1'}</TableHead>
                        <TableHead className="text-right">{teacherGroup2Stats?.name || 'Group 2'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {statsToCompare.map((stat) => {
                       const val1 = teacherGroup1Stats ? teacherGroup1Stats[stat.key] : null;
                       const val2 = teacherGroup2Stats ? teacherGroup2Stats[stat.key] : null;

                       const displayVal1 = Array.isArray(val1) ? val1.length : (val1 as number)?.toLocaleString() ?? 'N/A';
                       const displayVal2 = Array.isArray(val2) ? val2.length : (val2 as number)?.toLocaleString() ?? 'N/A';

                       return (
                        <TableRow key={stat.key} className="transition-colors hover:bg-accent/20">
                            <TableCell className="font-medium flex items-center gap-2">
                                <stat.icon className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-105" />
                                {stat.label}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <span className="font-bold">{displayVal1}{val1 !== null && stat.unit}</span>
                                    <StatPopover details={teacherGroup1Stats} statType={stat.key as any} />
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <span className="font-bold">{displayVal2}{val2 !== null && stat.unit}</span>
                                    <StatPopover details={teacherGroup2Stats} statType={stat.key as any} />
                                </div>
                            </TableCell>
                        </TableRow>
                       )
                   })}
                </TableBody>
            </Table>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12 h-64">
                <UserSearch className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Select Two Groups</h3>
                <p className="text-muted-foreground mt-1">Choose teachers for both groups to start comparing.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
