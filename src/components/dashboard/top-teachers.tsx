
"use client";

import { useMemo } from 'react';
import type { ClassEntry, AppClassEntry } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Clock, Star, UserCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type DataEntry = (ClassEntry | AppClassEntry) & { dataSource?: 'fb' | 'app' };

interface TopTeachersProps {
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
  classes: DataEntry[];
  highestAttendanceClass: DataEntry | null;
  appClassCount: number;
  fbClassCount: number;
  appTotalAverageAttendance: number;
  fbTotalAverageAttendance: number;
};

const isAppEntry = (entry: DataEntry): entry is AppClassEntry & {dataSource: 'app'} => entry.dataSource === 'app';
const isFbEntry = (entry: DataEntry): entry is ClassEntry & {dataSource: 'fb'} => entry.dataSource === 'fb';

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
          appClassCount: 0,
          fbClassCount: 0,
          appTotalAverageAttendance: 0,
          fbTotalAverageAttendance: 0,
        };
      }
      
      const currentTeacherStats = teacherStats[teacherName];
      currentTeacherStats.classCount += 1;
      currentTeacherStats.classes.push(item);
      
      let peakAttendance = 0;

      if (isAppEntry(item)) {
        currentTeacherStats.appClassCount += 1;
        currentTeacherStats.totalDuration += parseNumericValue(item.classDuration);
        const attendance = parseNumericValue(item.totalAttendance);
        currentTeacherStats.totalAverageAttendance += attendance;
        currentTeacherStats.appTotalAverageAttendance += attendance;
        peakAttendance = attendance;

      } else if (isFbEntry(item)) {
        currentTeacherStats.fbClassCount += 1;
        currentTeacherStats.totalDuration += parseNumericValue(item.totalDuration);
        const attendance = parseNumericValue(item.averageAttendance);
        currentTeacherStats.totalAverageAttendance += attendance;
        currentTeacherStats.fbTotalAverageAttendance += attendance;
        peakAttendance = parseNumericValue(item.highestAttendance);
      }
      
      if (peakAttendance > currentTeacherStats.highestPeakAttendance) {
        currentTeacherStats.highestPeakAttendance = peakAttendance;
        currentTeacherStats.highestAttendanceClass = item;
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
  
  const StatDialog = ({ teacherName, statType, details }: { teacherName: string, statType: string, details: TeacherStats }) => {
    let content;
    let title;

    switch(statType) {
        case 'classCount':
            title = `Classes Taught by ${teacherName}`;
            content = (
                <div className="text-sm">
                  <p>Total Classes: <span className='font-bold'>{details.classCount}</span></p>
                  <p>Fb Classes: <span className='font-bold'>{details.fbClassCount}</span></p>
                  <p>App Classes: <span className='font-bold'>{details.appClassCount}</span></p>
                  <h4 className="font-semibold mt-4 mb-2">Class List</h4>
                  <ScrollArea className="h-72 pr-4 border rounded-md">
                    <Table>
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Topic</TableHead><TableHead>Source</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {details.classes.sort((a,b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).map(c => (
                          <TableRow key={c.id}>
                            <TableCell><Badge variant="secondary">{c.date}</Badge></TableCell>
                            <TableCell className="font-medium max-w-xs truncate">{c.subject ?? (c as AppClassEntry).classTopic}</TableCell>
                            <TableCell><Badge variant={c.dataSource === 'app' ? 'default' : 'secondary'}>{c.dataSource?.toUpperCase()}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
            );
            break;
        case 'avgAttendance':
            title = `Average Attendance for ${teacherName}`;
            const fbAvg = details.fbClassCount > 0 ? (details.fbTotalAverageAttendance / details.fbClassCount) : 0;
            const appAvg = details.appClassCount > 0 ? (details.appTotalAverageAttendance / details.appClassCount) : 0;
            content = (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold text-center mb-2">Fb Data</h3>
                    <p>Total Attendance: {details.fbTotalAverageAttendance.toLocaleString()}</p>
                    <p>Total Classes: {details.fbClassCount.toLocaleString()}</p>
                    <p className="font-bold border-t pt-2 mt-2">Avg: {fbAvg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold text-center mb-2">App Data</h3>
                    <p>Total Attendance: {details.appTotalAverageAttendance.toLocaleString()}</p>
                    <p>Total Classes: {details.appClassCount.toLocaleString()}</p>
                    <p className="font-bold border-t pt-2 mt-2">Avg: {appAvg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                 <div className="md:col-span-2 space-y-2 rounded-lg border bg-muted/50 p-4 mt-4">
                     <h3 className="font-semibold text-center mb-2">Combined</h3>
                     <p>Total Attendance: {details.totalAverageAttendance.toLocaleString()}</p>
                     <p>Total Classes: {details.classCount.toLocaleString()}</p>
                     <p className="font-bold border-t pt-2 mt-2">Overall Avg: {details.avgAttendance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                 </div>
              </div>
            );
            break;
        case 'highestAttendance':
            title = `Highest Attendance Class for ${teacherName}`;
            content = (
                <div className="text-sm p-4 space-y-1">
                    {details.highestAttendanceClass ? (
                        <>
                            <h4 className="font-semibold">{details.highestAttendanceClass.teacher}</h4>
                            <p className="font-bold text-base">{isFbEntry(details.highestAttendanceClass) ? details.highestAttendanceClass.subject : (details.highestAttendanceClass as AppClassEntry).classTopic}</p>
                            <p className="text-xs text-muted-foreground">{details.highestAttendanceClass.date} ({details.highestAttendanceClass.dataSource?.toUpperCase()})</p>
                        </>
                    ) : 'No data available'}
                </div>
            );
            break;
        case 'totalDuration':
             title = `Total Duration for ${teacherName}`;
             content = <p className="text-sm text-muted-foreground p-4">Based on {details.classCount} classes from both platforms.</p>;
             break;
        default:
            content = null;
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-2"><Info className="h-3 w-3" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
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
                    <StatDialog teacherName={teacher.name} statType="classCount" details={teacherDetails[teacher.name]} />
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
                    <StatDialog teacherName={teacher.name} statType="avgAttendance" details={teacherDetails[teacher.name]} />
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
                    <StatDialog teacherName={teacher.name} statType="highestAttendance" details={teacherDetails[teacher.name]} />
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
                    <StatDialog teacherName={teacher.name} statType="totalDuration" details={teacherDetails[teacher.name]} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
