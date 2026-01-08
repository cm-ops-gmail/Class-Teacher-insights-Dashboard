'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import type { ClassEntry, AppClassEntry } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Clock, Star, Users, UserSearch, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { MultiSelectFilter } from './multi-select-filter';
import { Separator } from '../ui/separator';

type DataEntry = (ClassEntry | AppClassEntry) & { dataSource?: 'fb' | 'app' };


interface TeacherComparisonProps {
  data: DataEntry[];
  allTeachers: string[];
  teacherImages: { [key: string]: string };
}

const parseNumericValue = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

type StatDetail = {
  fb: number;
  app: number;
  total: number;
};

type TeacherStats = {
  name: string;
  classCount: StatDetail;
  totalDuration: StatDetail;
  totalAverageAttendance: StatDetail;
  avgAttendance: StatDetail;
  highestPeakAttendance: StatDetail;
  highestAttendanceClass: DataEntry | null;
  classes: DataEntry[];
  avgDuration: {
    fb: number;
    app: number;
    total: number;
  };
  averageRating: number;
  ratedClassesCount: number;
  ratedClasses: (AppClassEntry & { dataSource: 'app' })[];
  totalRating: number;
  imageUrl?: string;
};

const isAppEntry = (entry: DataEntry): entry is AppClassEntry & {dataSource: 'app'} => 'product' in entry && 'averageClassRating' in entry && entry.dataSource === 'app';
const isFbEntry = (entry: DataEntry): entry is ClassEntry & {dataSource: 'fb'} => 'productType' in entry && entry.dataSource === 'fb';


const calculateTeacherGroupStats = (teacherNames: string[], allData: DataEntry[], teacherImages: { [key: string]: string }): TeacherStats | null => {
  if (!teacherNames || teacherNames.length === 0) return null;

  const teacherClasses = allData.filter(item => teacherNames.includes(item.teacher!));
  
  const initialStat = { fb: 0, app: 0, total: 0 };
  const firstTeacher = teacherNames[0];

  const stats: TeacherStats = {
      name: firstTeacher,
      classCount: { ...initialStat },
      totalDuration: { ...initialStat },
      totalAverageAttendance: { ...initialStat },
      avgAttendance: { ...initialStat },
      highestPeakAttendance: { ...initialStat },
      highestAttendanceClass: null,
      classes: teacherClasses,
      avgDuration: { ...initialStat },
      averageRating: 0,
      ratedClassesCount: 0,
      ratedClasses: [],
      totalRating: 0,
      imageUrl: teacherImages[firstTeacher]
  };

  if (teacherClasses.length === 0) {
    return stats;
  }

  let highestPeak = 0;

  teacherClasses.forEach(item => {
    let peak = 0;
    if (isFbEntry(item)) {
        stats.classCount.fb += 1;
        stats.totalDuration.fb += parseNumericValue(item.totalDuration);
        stats.totalAverageAttendance.fb += parseNumericValue(item.averageAttendance);
        peak = parseNumericValue(item.highestAttendance);
    } else if (isAppEntry(item)) {
        stats.classCount.app += 1;
        stats.totalDuration.app += parseNumericValue(item.classDuration);
        stats.totalAverageAttendance.app += parseNumericValue(item.totalAttendance);
        peak = parseNumericValue(item.totalAttendance);

        const rating = parseNumericValue(item.averageClassRating);
        if (rating > 0) {
          stats.totalRating += rating;
          stats.ratedClassesCount++;
          stats.ratedClasses.push(item);
        }
    }
    
    if (peak > highestPeak) {
      highestPeak = peak;
      stats.highestAttendanceClass = item;
    }
  });

  stats.classCount.total = stats.classCount.fb + stats.classCount.app;
  stats.totalDuration.total = stats.totalDuration.fb + stats.totalDuration.app;
  stats.totalAverageAttendance.total = stats.totalAverageAttendance.fb + stats.totalAverageAttendance.app;
  
  stats.avgAttendance.fb = stats.classCount.fb > 0 ? Math.round(stats.totalAverageAttendance.fb / stats.classCount.fb) : 0;
  stats.avgAttendance.app = stats.classCount.app > 0 ? Math.round(stats.totalAverageAttendance.app / stats.classCount.app) : 0;
  stats.avgAttendance.total = stats.classCount.total > 0 ? Math.round(stats.totalAverageAttendance.total / stats.classCount.total) : 0;

  stats.avgDuration.fb = stats.classCount.fb > 0 ? Math.round(stats.totalDuration.fb / stats.classCount.fb) : 0;
  stats.avgDuration.app = stats.classCount.app > 0 ? Math.round(stats.totalDuration.app / stats.classCount.app) : 0;
  stats.avgDuration.total = stats.classCount.total > 0 ? Math.round(stats.totalDuration.total / stats.classCount.total) : 0;
  
  stats.highestPeakAttendance.total = highestPeak;
  stats.averageRating = stats.ratedClassesCount > 0 ? stats.totalRating / stats.ratedClassesCount : 0;

  return stats;
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

const StatPopover = ({ details, statType }: { details: TeacherStats | null, statType: 'classCount' | 'avgAttendance' | 'highestPeakAttendance' | 'totalDuration' | 'avgDurationApp' | 'avgDurationFb' | 'avgRating' }) => {
    if (!details) return null;

    let content;
    let title;
    
    switch (statType) {
        case 'classCount':
            title = `Classes Taught by ${details.name}`;
            content = (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Fb Classes ({details.classCount.fb})</h3>
                  <ScrollArea className="h-96 mt-4 pr-4">
                    <Table>
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Topic</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {details.classes.filter(isFbEntry).sort((a,b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).map(c => (
                          <TableRow key={c.id}><TableCell><Badge variant="secondary">{c.date}</Badge></TableCell><TableCell className="font-medium max-w-xs truncate">{c.subject}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">APP Classes ({details.classCount.app})</h3>
                  <ScrollArea className="h-96 mt-4 pr-4">
                    <Table>
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Topic</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {details.classes.filter(isAppEntry).sort((a,b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).map(c => (
                          <TableRow key={c.id}><TableCell><Badge variant="secondary">{c.date}</Badge></TableCell><TableCell className="font-medium max-w-xs truncate">{c.classTopic}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            );
            break;
        case 'avgAttendance':
            title = "Average Attendance Calculation"
            content = (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold text-center mb-2">Fb Data</h3>
                    <p>Total Fb Attendance: {details.totalAverageAttendance.fb.toLocaleString()}</p>
                    <p>Total Fb Classes: {details.classCount.fb.toLocaleString()}</p>
                    <p className="font-bold border-t pt-2 mt-2">Avg: {details.avgAttendance.fb.toLocaleString()}</p>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold text-center mb-2">App Data</h3>
                    <p>Total App Attendance: {details.totalAverageAttendance.app.toLocaleString()}</p>
                    <p>Total App Classes: {details.classCount.app.toLocaleString()}</p>
                    <p className="font-bold border-t pt-2 mt-2">Avg: {details.avgAttendance.app.toLocaleString()}</p>
                </div>
              </div>
            );
            break;
        case 'highestPeakAttendance':
            title = "Highest Attendance Class";
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
             title = "Total Duration";
             content = (
              <div className="space-y-4 p-4 text-sm">
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold text-center mb-2">Fb Duration</h3>
                    <p className="font-bold text-lg text-center">{formatDuration(details.totalDuration.fb)}</p>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-semibold text-center mb-2">App Duration</h3>
                    <p className="font-bold text-lg text-center">{formatDuration(details.totalDuration.app)}</p>
                </div>
                 <div className="space-y-2 rounded-lg border bg-muted/50 p-4 mt-4">
                     <h3 className="font-semibold text-center mb-2">Total Combined Duration</h3>
                     <p className="font-bold text-xl text-center">{formatDuration(details.totalDuration.total)}</p>
                 </div>
              </div>
             );
             break;
        case 'avgDurationApp':
            title = `Average App Class Duration for ${details.name}`;
            content = (
                 <div className="space-y-2 rounded-lg border p-4 m-4">
                    <h3 className="font-semibold text-center mb-2">App Data</h3>
                    <p>Total App Duration: {details.totalDuration.app.toLocaleString()} min</p>
                    <p>Total App Classes: {details.classCount.app.toLocaleString()}</p>
                    <p className="font-bold border-t pt-2 mt-2">Avg Duration: {details.avgDuration.app.toLocaleString()} min</p>
                </div>
            );
            break;
        case 'avgDurationFb':
            title = `Average Fb Class Duration for ${details.name}`;
            content = (
                 <div className="space-y-2 rounded-lg border p-4 m-4">
                    <h3 className="font-semibold text-center mb-2">Fb Data</h3>
                    <p>Total Fb Duration: {details.totalDuration.fb.toLocaleString()} min</p>
                    <p>Total Fb Classes: {details.classCount.fb.toLocaleString()}</p>
                    <p className="font-bold border-t pt-2 mt-2">Avg Duration: {details.avgDuration.fb.toLocaleString()} min</p>
                </div>
            );
            break;
        case 'avgRating':
            title = `Average Rating for ${details.name}`;
            content = (
                <div className="p-6">
                    <div className="grid gap-4 py-4 text-sm mb-4 border-b pb-4">
                        <div>Total Rating Sum: <span className="font-bold">{details.totalRating.toFixed(2)}</span></div>
                        <div>Total Rated Classes: <span className="font-bold">{details.ratedClassesCount.toLocaleString()}</span></div>
                        <p className="font-bold border-t pt-2 mt-1 text-base">
                            {details.totalRating.toFixed(2)} / {details.ratedClassesCount.toLocaleString()} = {details.averageRating.toFixed(2)}
                        </p>
                    </div>
                  <p className="text-sm text-muted-foreground">Rating is based on {details.ratedClassesCount} rated classes from APP Dashboard only.</p>
                  <ScrollArea className="h-72 mt-4">
                    <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Class Topic</TableHead>
                              <TableHead className="text-right">Rating</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {details.ratedClasses.sort((a,b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).map(c => (
                              <TableRow key={c.id}>
                                  <TableCell><Badge variant="secondary">{c.date}</Badge></TableCell>
                                  <TableCell className="font-medium max-w-xs truncate">{c.classTopic}</TableCell>
                                  <TableCell className="text-right font-bold">{parseNumericValue(c.averageClassRating).toFixed(2)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
            );
            break;
        default:
            return null;
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5"><Info className="h-4 w-4 text-muted-foreground" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    )
};


export function TeacherComparison({ data, allTeachers, teacherImages }: TeacherComparisonProps) {
  const [teacherGroup1, setTeacherGroup1] = useState<string[]>([]);
  const [teacherGroup2, setTeacherGroup2] = useState<string[]>([]);
  
  const teacherOptions = useMemo(() => allTeachers.map(t => ({ value: t, label: t })), [allTeachers]);

  const teacherGroup1Stats = useMemo(() => calculateTeacherGroupStats(teacherGroup1, data, teacherImages), [teacherGroup1, data, teacherImages]);
  const teacherGroup2Stats = useMemo(() => calculateTeacherGroupStats(teacherGroup2, data, teacherImages), [teacherGroup2, data, teacherImages]);

  const statsToCompare: { label: string; icon: React.ElementType; key: 'classCount' | 'avgAttendance' | 'highestPeakAttendance' | 'totalDuration' | 'avgDurationApp' | 'avgDurationFb' | 'avgRating'; unit?: string; formatter?: (value: number) => string; }[] = [
    { label: "Total Classes", icon: Award, key: "classCount" },
    { label: "Avg. Attendance", icon: Users, key: "avgAttendance" },
    { label: "Highest Peak Attendance", icon: Star, key: "highestPeakAttendance" },
    { label: "Total Duration", icon: Clock, key: "totalDuration", unit: " min" },
    { label: "Avg Duration (App)", icon: Clock, key: "avgDurationApp", unit: " min" },
    { label: "Avg Duration (Fb)", icon: Clock, key: "avgDurationFb", unit: " min" },
    { label: "Average Rating", icon: Star, key: "avgRating", formatter: (v) => v.toFixed(2) },
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
            <Table className="table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Metric</TableHead>
                        <TableHead className="text-center w-1/3 break-words">
                            <div className="flex flex-col items-center gap-2">
                                {teacherGroup1Stats?.imageUrl && (
                                    <Image src={teacherGroup1Stats.imageUrl} alt={teacherGroup1Stats.name} width={64} height={64} className="rounded-full object-cover h-16 w-16" />
                                )}
                                {teacherGroup1Stats?.name || 'Group 1'}
                            </div>
                        </TableHead>
                        <TableHead className="text-center w-1/3 break-words">
                             <div className="flex flex-col items-center gap-2">
                                {teacherGroup2Stats?.imageUrl && (
                                    <Image src={teacherGroup2Stats.imageUrl} alt={teacherGroup2Stats.name} width={64} height={64} className="rounded-full object-cover h-16 w-16" />
                                )}
                                {teacherGroup2Stats?.name || 'Group 2'}
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {statsToCompare.map((stat) => {
                       const stat1 = teacherGroup1Stats ? teacherGroup1Stats[stat.key.startsWith('avgDuration') ? 'avgDuration' : (stat.key as keyof TeacherStats)] : null;
                       const stat2 = teacherGroup2Stats ? teacherGroup2Stats[stat.key.startsWith('avgDuration') ? 'avgDuration' : (stat.key as keyof TeacherStats)] : null;
                       
                       const isDetailedStat = (s: any): s is StatDetail => typeof s === 'object' && s !== null && 'total' in s;
                       
                       let val1, val2;
                       if (stat.key === 'avgDurationApp') {
                           val1 = isDetailedStat(stat1) ? stat1.app : null;
                           val2 = isDetailedStat(stat2) ? stat2.app : null;
                       } else if (stat.key === 'avgDurationFb') {
                            val1 = isDetailedStat(stat1) ? stat1.fb : null;
                            val2 = isDetailedStat(stat2) ? stat2.fb : null;
                       } else if (stat.key === 'avgRating') {
                           val1 = teacherGroup1Stats?.averageRating ?? null;
                           val2 = teacherGroup2Stats?.averageRating ?? null;
                       } else {
                           val1 = isDetailedStat(stat1) ? stat1.total : null;
                           val2 = isDetailedStat(stat2) ? stat2.total : null;
                       }

                       const displayVal1 = val1 !== null ? (stat.formatter ? stat.formatter(val1) : val1.toLocaleString()) : 'N/A';
                       const displayVal2 = val2 !== null ? (stat.formatter ? stat.formatter(val2) : val2.toLocaleString()) : 'N/A';
                       
                       return (
                        <TableRow key={stat.key} className="transition-colors hover:bg-accent/20 group">
                            <TableCell className="font-medium flex items-center gap-2">
                                <stat.icon className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
                                {stat.label}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <span className="font-bold">{displayVal1}{stat.unit && val1 !== null ? stat.unit : ''}</span>
                                    <StatPopover details={teacherGroup1Stats} statType={stat.key} />
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <span className="font-bold">{displayVal2}{stat.unit && val2 !== null ? stat.unit : ''}</span>
                                    <StatPopover details={teacherGroup2Stats} statType={stat.key} />
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
