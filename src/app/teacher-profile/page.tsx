
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { ClassEntry } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Clock, Star, UserCheck, BookOpen, Users, LogOut, Package, Info, User, X } from 'lucide-react';
import Navbar from '@/components/navbar';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiSelectFilter } from '@/components/dashboard/multi-select-filter';
import { TeacherComparison } from '@/components/dashboard/teacher-comparison';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const parseNumericValue = (
  value: string | number | undefined | null
): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

type CourseBreakdown = {
  [courseName: string]: number;
}

type TeacherStats = {
  name: string;
  classCount: number;
  totalDuration: number;
  totalAverageAttendance: number;
  avgAttendance: number;
  highestPeakAttendance: number;
  classes: ClassEntry[];
  highestAttendanceClass: ClassEntry | null;
  courseBreakdown: CourseBreakdown;
  uniqueCourses: string[];
  uniqueProductTypes: string[];
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

export default function TeacherProfilePage() {
  const [data, setData] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  useEffect(() => {
    const session = localStorage.getItem('dashboard_session');
    if (!session) {
      router.replace('/login');
      return;
    }

    const handleImport = async (url: string) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetUrl: url }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch data from sheet.');
        }

        const sheetData = await response.json();
        setData(sheetData);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description:
            error.message ||
            'Could not import data. Please check the URL and try again.',
        });
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    const initialSheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;
    if (initialSheetUrl) {
      handleImport(initialSheetUrl);
    } else {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description:
          'Google Sheet URL is not configured in environment variables.',
      });
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
  
  const allTeachers = useMemo(() => {
    const teacherSet = new Set<string>();
    data.forEach(item => {
        if(item.teacher) teacherSet.add(item.teacher);
    });
    return Array.from(teacherSet).sort();
  }, [data]);

  const aggregatedStats = useMemo(() => {
    if (selectedTeachers.length === 0) {
      return null;
    }

    const relevantClasses = data.filter(item => selectedTeachers.includes(item.teacher));

    if (relevantClasses.length === 0) return null;

    const stats: TeacherStats = {
      name: selectedTeachers.join(', '),
      classCount: 0,
      totalDuration: 0,
      totalAverageAttendance: 0,
      avgAttendance: 0,
      highestPeakAttendance: 0,
      classes: [],
      highestAttendanceClass: null,
      courseBreakdown: {},
      uniqueCourses: [],
      uniqueProductTypes: [],
    };

    relevantClasses.forEach(item => {
        stats.classCount += 1;
        stats.totalDuration += parseNumericValue(item.totalDuration);
        stats.totalAverageAttendance += parseNumericValue(item.averageAttendance);
        stats.classes.push(item);
        
        if (item.course) {
            stats.courseBreakdown[item.course] = (stats.courseBreakdown[item.course] || 0) + 1;
        }

        const peakAttendance = parseNumericValue(item.highestAttendance);
        if (peakAttendance > stats.highestPeakAttendance) {
            stats.highestPeakAttendance = peakAttendance;
            stats.highestAttendanceClass = item;
        }
    });

    stats.avgAttendance =
        stats.classCount > 0
        ? Math.round(stats.totalAverageAttendance / stats.classCount)
        : 0;
    stats.uniqueCourses = [...new Set(stats.classes.map(c => c.course).filter(Boolean))];
    stats.uniqueProductTypes = [...new Set(stats.classes.map(c => c.productType).filter(Boolean))];

    return stats;
  }, [selectedTeachers, data]);

  const handleLogout = () => {
    localStorage.removeItem('dashboard_session');
    router.replace('/login');
  };
  
  const isAnyTeacherSelected = selectedTeachers.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </Navbar>
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Teacher Profile
          </h1>
          <p className="text-muted-foreground">
            Select teachers to view their combined performance statistics.
          </p>
        </div>

        <div className="flex justify-center mb-8">
            <Card className="w-full max-w-sm border-chart-3/50 hover:border-chart-3 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-center">
                    <CardTitle className="text-sm font-medium text-chart-3 w-full text-center">
                        {isAnyTeacherSelected ? 'Selected Teachers' : 'Total Unique Teachers'}
                    </CardTitle>
                    <Users className="h-4 w-4 text-chart-3" />
                </CardHeader>
                <CardContent className="text-center">
                    <div className="text-2xl font-bold text-chart-3">
                        {isAnyTeacherSelected ? selectedTeachers.length : allTeachers.length}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="flex items-center gap-2 mb-8">
            {isLoading ? (
                <Skeleton className="h-10 w-full md:w-[400px]" />
            ) : (
                <MultiSelectFilter
                    title="Select teachers..."
                    options={allTeachers.map(t => ({ value: t, label: t }))}
                    selectedValues={selectedTeachers}
                    onSelectedValuesChange={setSelectedTeachers}
                    triggerClassName="w-full md:w-[400px]"
                />
            )}
             {isAnyTeacherSelected && (
              <Button
                variant="ghost"
                onClick={() => setSelectedTeachers([])}
                className="h-10 px-2 lg:px-3"
              >
                Clear selection
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
        </div>
        
        {isLoading && selectedTeachers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
        )}
        
        {aggregatedStats && (
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{aggregatedStats.name}</CardTitle>
                        <CardDescription>Aggregated Performance Overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ease-in-out hover:shadow-lg border-chart-1/50 hover:border-chart-1 hover:-translate-y-1">
                                <Award className="h-8 w-8 text-chart-1" />
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground">Total Classes Taught</p>
                                        <p className="text-2xl font-bold">{aggregatedStats.classCount}</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Classes Taught by {aggregatedStats.name}</DialogTitle>
                                            </DialogHeader>
                                            <ScrollArea className="h-96 mt-4">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Topic</TableHead>
                                                            <TableHead>Course</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {aggregatedStats.classes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => (
                                                            <TableRow key={c.id}>
                                                                <TableCell><Badge variant="secondary">{c.date}</Badge></TableCell>
                                                                <TableCell className="font-medium max-w-xs truncate">{c.subject}</TableCell>
                                                                <TableCell>{c.course}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ease-in-out hover:shadow-lg border-chart-2/50 hover:border-chart-2 hover:-translate-y-1">
                                <Users className="h-8 w-8 text-chart-2" />
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground">Combined Avg. Attendance</p>
                                        <p className="text-2xl font-bold">{aggregatedStats.avgAttendance.toLocaleString()}</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Average Attendance Calculation</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    Total Combined Attendance:
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="link" size="sm" className="p-0 h-auto text-sm">{aggregatedStats.totalAverageAttendance.toLocaleString()}</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Total Attendance Breakdown</DialogTitle>
                                                            </DialogHeader>
                                                            <ScrollArea className="h-96 mt-4">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Class Topic</TableHead>
                                                                            <TableHead>Course</TableHead>
                                                                            <TableHead className="text-right">Attendance</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {aggregatedStats.classes.map(item => (
                                                                            <TableRow key={item.id}>
                                                                                <TableCell className="font-medium max-w-xs truncate">{item.subject}</TableCell>
                                                                                <TableCell>{item.course}</TableCell>
                                                                                <TableCell className="text-right">{parseNumericValue(item.averageAttendance).toLocaleString()}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                    <TableFooter>
                                                                        <TableRow>
                                                                            <TableCell colSpan={2} className="font-bold">Total</TableCell>
                                                                            <TableCell className="text-right font-bold">{aggregatedStats.totalAverageAttendance.toLocaleString()}</TableCell>
                                                                        </TableRow>
                                                                    </TableFooter>
                                                                </Table>
                                                            </ScrollArea>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                                <div>
                                                    Total Classes: {aggregatedStats.classCount.toLocaleString()}
                                                </div>
                                                <p className="font-bold border-t pt-2 mt-1">
                                                    {aggregatedStats.totalAverageAttendance.toLocaleString()} / {aggregatedStats.classCount > 0 ? aggregatedStats.classCount.toLocaleString() : 1} = {aggregatedStats.avgAttendance.toLocaleString()}
                                                </p>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ease-in-out hover:shadow-lg border-chart-3/50 hover:border-chart-3 hover:-translate-y-1">
                                <BookOpen className="h-8 w-8 text-chart-3" />
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground">Unique Courses Taught</p>
                                        <p className="text-2xl font-bold">{aggregatedStats.uniqueCourses.length}</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Unique Courses by {aggregatedStats.name}</DialogTitle>
                                            </DialogHeader>
                                            <ScrollArea className="h-72 mt-4">
                                                <div className="flex flex-wrap gap-2 p-1">
                                                    {aggregatedStats.uniqueCourses.map(c => <Badge key={c} variant="secondary" className="text-base">{c}</Badge>)}
                                                </div>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ease-in-out hover:shadow-lg border-chart-6/50 hover:border-chart-6 hover:-translate-y-1">
                                <Package className="h-8 w-8 text-chart-6" />
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground">Unique Product Types</p>
                                        <p className="text-2xl font-bold">{aggregatedStats.uniqueProductTypes.length}</p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Unique Product Types by {aggregatedStats.name}</DialogTitle>
                                            </DialogHeader>
                                            <ScrollArea className="h-72 mt-4">
                                                <div className="flex flex-wrap gap-2 p-1">
                                                    {aggregatedStats.uniqueProductTypes.map(p => <Badge key={p} variant="secondary" className="text-base">{p}</Badge>)}
                                                </div>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border p-4 col-span-1 lg:col-span-1 transition-all duration-300 ease-in-out hover:shadow-lg border-chart-5/50 hover:border-chart-5 hover:-translate-y-1">
                                <Star className="h-8 w-8 text-chart-5" />
                                <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground">Highest Peak Attendance</p>
                                        <p className="text-2xl font-bold">{aggregatedStats.highestPeakAttendance.toLocaleString()}</p>
                                    </div>
                                    {aggregatedStats.highestAttendanceClass && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto max-w-xs">
                                                <div className="space-y-1">
                                                  <h4 className="font-semibold">Highest Attendance Class</h4>
                                                  <p className="text-sm">
                                                      {aggregatedStats.highestAttendanceClass.subject}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                      by {aggregatedStats.highestAttendanceClass.teacher} on {aggregatedStats.highestAttendanceClass.date}
                                                  </p>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ease-in-out hover:shadow-lg border-chart-4/50 hover:border-chart-4 hover:-translate-y-1">
                                <Clock className="h-8 w-8 text-chart-4" />
                                 <div className="flex-1 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground">Total Duration</p>
                                        <p className="text-2xl font-bold">{aggregatedStats.totalDuration.toLocaleString()} min</p>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                             <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="text-sm w-auto" side="top" align="end">
                                            <div className="font-bold">
                                            {formatDuration(aggregatedStats.totalDuration)}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead className="text-right">Classes Taught</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(aggregatedStats.courseBreakdown).sort(([, a], [, b]) => b - a).map(([course, count]) => (
                                        <TableRow key={course}>
                                            <TableCell className="font-medium">{course}</TableCell>
                                            <TableCell className="text-right font-bold">{count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-bold">Total</TableCell>
                                        <TableCell className="text-right font-bold">{aggregatedStats.classCount}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-0">
                        <style>{`
                          .custom-scrollbar::-webkit-scrollbar {
                            width: 12px;
                            height: 12px;
                          }
                          .custom-scrollbar::-webkit-scrollbar-track {
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 6px;
                          }
                          .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: white;
                            border-radius: 6px;
                          }
                          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #e0e0e0;
                          }
                          .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: white rgba(255, 255, 255, 0.1);
                          }
                        `}</style>
                        <div className="h-[500px] overflow-auto custom-scrollbar">
                          <Table className="whitespace-nowrap">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Topic</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead className="text-right">Avg. Attendance</TableHead>
                                <TableHead className="text-right">Peak Attendance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {aggregatedStats.classes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(c => (
                                <TableRow key={c.id}>
                                  <TableCell><Badge variant="secondary">{c.date}</Badge></TableCell>
                                  <TableCell>{c.teacher}</TableCell>
                                  <TableCell className="font-medium max-w-[200px] truncate">{c.subject}</TableCell>
                                  <TableCell>{c.course}</TableCell>
                                  <TableCell className="text-right">{parseNumericValue(c.averageAttendance).toLocaleString()}</TableCell>
                                  <TableCell className="text-right">{parseNumericValue(c.highestAttendance).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                </div>
            </div>
        )}
        
        <Separator />
        
        <TeacherComparison data={data} allTeachers={allTeachers} />

      </main>
      <footer className="border-t">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <div>© 2025 10 MS Content Operations. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Policy Book
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Automation Projects
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Automation Project Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
