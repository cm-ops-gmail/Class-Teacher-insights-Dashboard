'use client';

import React from 'react';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import type { ClassEntry, AppClassEntry } from '@/lib/definitions';
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
import { Award, Clock, Star, Users, LogOut, Package, Info, User, X, BarChart, BookOpen, TrendingUp, Presentation } from 'lucide-react';
import Navbar from '@/components/navbar';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiSelectFilter } from '@/components/dashboard/multi-select-filter';
import { TeacherComparison } from '@/components/dashboard/teacher-comparison';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useYear } from '@/contexts/year-context';
import Footer from '@/components/footer';
import { RecapButton } from '@/components/dashboard/teacher-recap-slideshow';

const parseNumericValue = (
  value: string | number | undefined | null
): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,|\%/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

export type CombinedClassEntry = Partial<ClassEntry> & Partial<AppClassEntry> & { id: string, dataSource: 'fb' | 'app' };

export type CourseBreakdown = {
  [courseName: string]: {
    fb: number;
    app: number;
    total: number;
  };
}

export type StatDetail = {
  fb: number;
  app: number;
  total: number;
};

export type TeacherStats = {
  name: string;
  classCount: StatDetail;
  totalDuration: StatDetail;
  avgDuration: StatDetail;
  totalAverageAttendance: StatDetail;
  avgAttendance: StatDetail;
  highestPeakAttendance: StatDetail;
  classes: CombinedClassEntry[];
  highestAttendanceClass: CombinedClassEntry | null;
  courseBreakdown: CourseBreakdown;
  uniqueCourses: string[];
  uniqueProductTypes: string[];
  averageRating: number;
  ratedClassesCount: number;
  ratedClasses: (AppClassEntry & { dataSource: 'app' })[];
  imageUrl?: string;
};

export const formatDuration = (totalMinutes: number) => {
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

const isAppEntry = (entry: CombinedClassEntry): entry is AppClassEntry & { dataSource: 'app' } => entry.dataSource === 'app';
const isFbEntry = (entry: CombinedClassEntry): entry is ClassEntry & { dataSource: 'fb' } => entry.dataSource === 'fb';

export default function TeacherProfilePage() {
  const [fbData, setFbData] = useState<ClassEntry[]>([]);
  const [appData, setAppData] = useState<AppClassEntry[]>([]);
  const [teacherImages, setTeacherImages] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const { selectedYear } = useYear();

  useEffect(() => {
    const session = localStorage.getItem('dashboard_session');
    if (!session) {
      router.replace('/login');
      return;
    }

    const handleImport = async () => {
      setIsLoading(true);
      const url = selectedYear === '2026' 
          ? process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL_2026
          : process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL_2025;

      if (!url) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: `Google Sheet URL for ${selectedYear} is not configured.`,
        });
        setFbData([]);
        setAppData([]);
        setIsLoading(false);
        return;
      }

      try {
        const [fbResponse, appResponse, imagesResponse] = await Promise.all([
            fetch('/api/sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetUrl: url }),
            }),
            fetch('/api/app-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetUrl: url }),
            }),
             fetch('/api/teacher-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheetUrl: url }),
            }),
        ]);

        if (!fbResponse.ok) {
          const error = await fbResponse.json();
          throw new Error(`Fb-Data: ${error.error || 'Failed to fetch'}`);
        }
        if (!appResponse.ok) {
          const error = await appResponse.json();
          throw new Error(`App-Data: ${error.error || 'Failed to fetch'}`);
        }
         if (!imagesResponse.ok) {
          const error = await imagesResponse.json();
          throw new Error(`Teacher Images: ${error.error || 'Failed to fetch'}`);
        }

        const fbSheetData = await fbResponse.json();
        const appSheetData = await appResponse.json();
        const imagesData = await imagesResponse.json();
        
        setFbData(fbSheetData);
        setAppData(appSheetData);
        setTeacherImages(imagesData);
        toast({
          title: "Success!",
          description: `Data for ${selectedYear} loaded successfully.`,
        });

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'Could not import data. Please check the URL and try again.',
        });
        setFbData([]);
        setAppData([]);
        setTeacherImages({});
      } finally {
        setIsLoading(false);
      }
    };

    handleImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);
  
  const combinedData = useMemo(() => {
    const fbMarked = fbData.map(d => ({ ...d, id: `fb-${d.id}`, dataSource: 'fb' as const }));
    const appMarked = appData.map(d => ({ ...d, id: `app-${d.id}`, dataSource: 'app' as const }));
    return [...fbMarked, ...appMarked];
  }, [fbData, appData]);

  const allTeachers = useMemo(() => {
    const teacherSet = new Set<string>();
    [...fbData, ...appData].forEach(item => {
        if(item.teacher) {
            teacherSet.add(item.teacher);
        }
    });
    return Array.from(teacherSet).sort();
  }, [fbData, appData]);

    const platformTotals = useMemo(() => {
    const totals = {
      classCount: combinedData.length,
      totalDuration: 0,
      totalAverageAttendance: 0,
    };

    combinedData.forEach(item => {
      if (isFbEntry(item)) {
        totals.totalDuration += parseNumericValue(item.totalDuration);
        totals.totalAverageAttendance += parseNumericValue(item.averageAttendance);
      } else if (isAppEntry(item)) {
        totals.totalDuration += parseNumericValue(item.classDuration);
        totals.totalAverageAttendance += parseNumericValue(item.totalAttendance);
      }
    });

    return totals;
  }, [combinedData]);

  const aggregatedStats = useMemo(() => {
    if (selectedTeachers.length === 0) {
      return null;
    }

    const relevantClasses = combinedData.filter(item => selectedTeachers.includes(item.teacher ?? ''));

    if (relevantClasses.length === 0) return null;
    
    const initialStat = { fb: 0, app: 0, total: 0 };
    
    const firstTeacher = selectedTeachers[0];

    const stats: TeacherStats = {
      name: firstTeacher,
      classCount: { ...initialStat },
      totalDuration: { ...initialStat },
      avgDuration: { ...initialStat },
      totalAverageAttendance: { ...initialStat },
      avgAttendance: { ...initialStat },
      highestPeakAttendance: { ...initialStat },
      classes: [],
      highestAttendanceClass: null,
      courseBreakdown: {},
      uniqueCourses: [],
      uniqueProductTypes: [],
      averageRating: 0,
      ratedClassesCount: 0,
      ratedClasses: [],
      imageUrl: teacherImages[firstTeacher]
    };

    let totalRating = 0;
    let highestPeak = 0;

    relevantClasses.forEach(item => {
        stats.classes.push(item);
        
        let peakAttendance = 0;
        let courseName: string | undefined;
        
        if (isFbEntry(item)) {
            stats.classCount.fb += 1;
            stats.totalDuration.fb += parseNumericValue(item.totalDuration);
            stats.totalAverageAttendance.fb += parseNumericValue(item.averageAttendance);
            peakAttendance = parseNumericValue(item.highestAttendance);
            courseName = item.course;
            if (courseName) {
              if (!stats.courseBreakdown[courseName]) {
                stats.courseBreakdown[courseName] = { fb: 0, app: 0, total: 0 };
              }
              stats.courseBreakdown[courseName].fb++;
              stats.courseBreakdown[courseName].total++;
            }
        } else if (isAppEntry(item)) {
            stats.classCount.app += 1;
            stats.totalDuration.app += parseNumericValue(item.classDuration);
            stats.totalAverageAttendance.app += parseNumericValue(item.totalAttendance);
            peakAttendance = parseNumericValue(item.totalAttendance);
            courseName = item.subject;
            
            const rating = parseNumericValue(item.averageClassRating);
            if (rating > 0) {
                totalRating += rating;
                stats.ratedClassesCount++;
                stats.ratedClasses.push(item);
            }
            if (courseName) {
              if (!stats.courseBreakdown[courseName]) {
                stats.courseBreakdown[courseName] = { fb: 0, app: 0, total: 0 };
              }
              stats.courseBreakdown[courseName].app++;
              stats.courseBreakdown[courseName].total++;
            }
        }

        if (peakAttendance > highestPeak) {
            highestPeak = peakAttendance;
            stats.highestAttendanceClass = item;
            stats.highestPeakAttendance.total = peakAttendance;
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
    
    stats.averageRating = stats.ratedClassesCount > 0 ? totalRating / stats.ratedClassesCount : 0;
    
    const allCourses = Object.keys(stats.courseBreakdown);
    stats.uniqueCourses = allCourses;

    const allProductTypes = relevantClasses.map(c => isFbEntry(c) ? c.productType : c.product).filter(Boolean);
    stats.uniqueProductTypes = [...new Set(allProductTypes)];


    return stats;
  }, [selectedTeachers, combinedData, teacherImages]);
  
  const handleLogout = () => {
    localStorage.removeItem('dashboard_session');
    router.replace('/login');
  };
  
  const isAnyTeacherSelected = selectedTeachers.length > 0;

  const StatCard = ({ icon: Icon, title, stat, format, popoverContent, colorClass }: { icon: React.ElementType, title: string, stat: StatDetail | number, format?: (value: number) => string, popoverContent: React.ReactNode, colorClass: string }) => {
    const isDetailed = typeof stat === 'object' && stat !== null;
    const total = isDetailed ? stat.total : stat;
    const formattedTotal = format ? format(total) : total.toLocaleString();

    return (
        <div className={cn(
            "flex items-start gap-4 rounded-lg border p-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1",
            `border-${colorClass}/50 hover:border-${colorClass}`
        )}>
            <Icon className={cn("h-8 w-8 mt-1", `text-${colorClass}`)} />
            <div className="flex-1">
                <p className="text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{formattedTotal}</p>
                {isDetailed && (
                    <p className="text-xs text-muted-foreground">
                        (Fb: {stat.fb.toLocaleString()} | App: {stat.app.toLocaleString()})
                    </p>
                )}
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
                </DialogTrigger>
                {popoverContent}
            </Dialog>
        </div>
    );
};
const ContributionListItem = ({ icon: Icon, title, teacherValue, platformTotal, colorClass }: { icon: React.ElementType, title: string, teacherValue: number, platformTotal: number, colorClass: string }) => {
    const percentage = platformTotal > 0 ? (teacherValue / platformTotal) * 100 : 0;
    
    return (
        <li className="flex items-center gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5", `text-${colorClass}`)} />
                <span className="font-medium">{title}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", `text-${colorClass}`)}>{percentage.toFixed(2)}%</span>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><Info className="h-4 w-4 text-muted-foreground" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Contribution Calculation</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 text-sm">
                            <div>Teacher's Total: <span className="font-bold">{teacherValue.toLocaleString()}</span></div>
                            <div>Platform Total: <span className="font-bold">{platformTotal.toLocaleString()}</span></div>
                            <p className="font-bold border-t pt-2 mt-1 text-base">
                                ({teacherValue.toLocaleString()} / {platformTotal.toLocaleString()}) * 100 = {percentage.toFixed(2)}%
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </li>
    );
};


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
            Select teachers to view their combined performance statistics from Fb and APP dashboards.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({length: 7}).map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
        )}
        
        {aggregatedStats && (
          <div>
            <Card>
                <CardHeader>
                    <div className="grid grid-cols-3 items-start justify-between">
                        <div className="col-span-2">
                            <CardTitle className="text-2xl">{aggregatedStats.name}</CardTitle>
                            <CardDescription>Aggregated Performance Overview</CardDescription>
                            <div className="mt-6">
                                <ul className="space-y-3">
                                    <ContributionListItem
                                        icon={TrendingUp}
                                        title="Contributed to platform's total classes"
                                        teacherValue={aggregatedStats.classCount.total}
                                        platformTotal={platformTotals.classCount}
                                        colorClass="chart-1"
                                    />
                                    <ContributionListItem
                                        icon={Users}
                                        title="Contributed to platform's total avg attendance"
                                        teacherValue={aggregatedStats.totalAverageAttendance.total}
                                        platformTotal={platformTotals.totalAverageAttendance}
                                        colorClass="chart-2"
                                    />
                                    <ContributionListItem
                                        icon={Clock}
                                        title="Contributed to platform's total duration"
                                        teacherValue={aggregatedStats.totalDuration.total}
                                        platformTotal={platformTotals.totalDuration}
                                        colorClass="chart-4"
                                    />
                                </ul>
                            </div>
                        </div>

                        {aggregatedStats.imageUrl && (
                            <div className="relative aspect-square w-48 rounded-lg overflow-hidden shadow-md border-2 border-muted flex-shrink-0 justify-self-end">
                                <Image
                                    src={aggregatedStats.imageUrl}
                                    alt={aggregatedStats.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Separator className="my-0" />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                       <StatCard 
                            icon={Award}
                            title="Total Classes Taught"
                            stat={aggregatedStats.classCount}
                            colorClass="chart-1"
                            popoverContent={
                                <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>Classes Taught by {aggregatedStats.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="font-semibold mb-2">Fb Classes ({aggregatedStats.classCount.fb})</h3>
                                            <ScrollArea className="h-96 mt-4 pr-4">
                                                <Table>
                                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Topic</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {aggregatedStats.classes.filter(isFbEntry).sort((a,b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).map(c => (
                                                            <TableRow key={c.id}><TableCell><Badge variant="secondary">{c.date}</Badge></TableCell><TableCell className="font-medium max-w-xs truncate">{c.subject}</TableCell></TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </ScrollArea>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">APP Classes ({aggregatedStats.classCount.app})</h3>
                                             <ScrollArea className="h-96 mt-4 pr-4">
                                                <Table>
                                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Topic</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {aggregatedStats.classes.filter(isAppEntry).sort((a,b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).map(c => (
                                                            <TableRow key={c.id}><TableCell><Badge variant="secondary">{c.date}</Badge></TableCell><TableCell className="font-medium max-w-xs truncate">{c.classTopic}</TableCell></TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </DialogContent>
                            }
                       />
                        <StatCard
                            icon={Users}
                            title="Combined Avg. Attendance"
                            stat={aggregatedStats.avgAttendance}
                            colorClass="chart-2"
                            popoverContent={
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader><DialogTitle>Average Attendance Calculation</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                                        <div className="space-y-2 rounded-lg border p-4">
                                            <h3 className="font-semibold text-center mb-2">Fb Data</h3>
                                            <p>Total Fb Attendance: {aggregatedStats.totalAverageAttendance.fb.toLocaleString()}</p>
                                            <p>Total Fb Classes: {aggregatedStats.classCount.fb.toLocaleString()}</p>
                                            <p className="font-bold border-t pt-2 mt-2">
                                                Avg: {aggregatedStats.avgAttendance.fb.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="space-y-2 rounded-lg border p-4">
                                            <h3 className="font-semibold text-center mb-2">App Data</h3>
                                            <p>Total App Attendance: {aggregatedStats.totalAverageAttendance.app.toLocaleString()}</p>
                                            <p>Total App Classes: {aggregatedStats.classCount.app.toLocaleString()}</p>
                                            <p className="font-bold border-t pt-2 mt-2">
                                                Avg: {aggregatedStats.avgAttendance.app.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 rounded-lg border bg-muted/50 p-4 mt-4">
                                         <h3 className="font-semibold text-center mb-2">Combined</h3>
                                         <p>Total Combined Attendance: {aggregatedStats.totalAverageAttendance.total.toLocaleString()}</p>
                                         <p>Total Combined Classes: {aggregatedStats.classCount.total.toLocaleString()}</p>
                                         <p className="font-bold border-t pt-2 mt-2">
                                            Overall Avg: {aggregatedStats.avgAttendance.total.toLocaleString()}
                                         </p>
                                    </div>
                                </DialogContent>
                            }
                        />
                        <StatCard 
                            icon={BookOpen}
                            title="Unique Courses Taught"
                            stat={aggregatedStats.uniqueCourses.length}
                            colorClass="chart-3"
                            popoverContent={
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Unique Courses by {aggregatedStats.name}</DialogTitle></DialogHeader>
                                    <ScrollArea className="h-72 mt-4">
                                        <div className="flex flex-wrap gap-2 p-1">
                                            {aggregatedStats.uniqueCourses.map(c => <Badge key={c} variant="secondary" className="text-base">{c}</Badge>)}
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            }
                       />
                        <StatCard
                            icon={Package}
                            title="Unique Product Types"
                            stat={aggregatedStats.uniqueProductTypes.length}
                            colorClass="chart-4"
                            popoverContent={
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Unique Product Types by {aggregatedStats.name}</DialogTitle></DialogHeader>
                                    <ScrollArea className="h-72 mt-4">
                                        <div className="flex flex-wrap gap-2 p-1">
                                            {aggregatedStats.uniqueProductTypes.map(p => <Badge key={p} variant="secondary" className="text-base">{p}</Badge>)}
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            }
                        />
                        <StatCard
                            icon={Star}
                            title="Highest Peak Attendance"
                            stat={aggregatedStats.highestPeakAttendance.total}
                            colorClass="chart-5"
                            popoverContent={
                                 <DialogContent>
                                    <DialogHeader><DialogTitle>Highest Attendance Class</DialogTitle></DialogHeader>
                                    {aggregatedStats.highestAttendanceClass && (
                                        <div className="space-y-1 p-4">
                                            <h4 className="font-semibold text-lg">{aggregatedStats.highestAttendanceClass.subject ?? (aggregatedStats.highestAttendanceClass as AppClassEntry).classTopic}</h4>
                                            <p className="text-sm">
                                                by {aggregatedStats.highestAttendanceClass.teacher}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {aggregatedStats.highestAttendanceClass.date} ({aggregatedStats.highestAttendanceClass.dataSource?.toUpperCase()})
                                            </p>
                                        </div>
                                    )}
                                 </DialogContent>
                            }
                        />
                         <StatCard
                            icon={Clock}
                            title="Total Duration (min)"
                            stat={aggregatedStats.totalDuration}
                            colorClass="chart-6"
                            popoverContent={
                                 <DialogContent className="sm:max-w-md">
                                    <DialogHeader><DialogTitle>Total Duration</DialogTitle></DialogHeader>
                                    <div className="font-bold text-lg p-4">{formatDuration(aggregatedStats.totalDuration.total)}</div>
                                 </DialogContent>
                            }
                        />
                        <StatCard
                            icon={Clock}
                            title="Average Duration (min)"
                            stat={aggregatedStats.avgDuration}
                            format={(val) => val.toLocaleString()}
                            colorClass="chart-2"
                            popoverContent={
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader><DialogTitle>Average Duration Calculation</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                                        <div className="space-y-2 rounded-lg border p-4">
                                            <h3 className="font-semibold text-center mb-2">Fb Data</h3>
                                            <p>Total Fb Duration: {aggregatedStats.totalDuration.fb.toLocaleString()} min</p>
                                            <p>Total Fb Classes: {aggregatedStats.classCount.fb.toLocaleString()}</p>
                                            <p className="font-bold border-t pt-2 mt-2">
                                                Avg: {aggregatedStats.avgDuration.fb.toLocaleString()} min
                                            </p>
                                        </div>
                                        <div className="space-y-2 rounded-lg border p-4">
                                            <h3 className="font-semibold text-center mb-2">App Data</h3>
                                            <p>Total App Duration: {aggregatedStats.totalDuration.app.toLocaleString()} min</p>
                                            <p>Total App Classes: {aggregatedStats.classCount.app.toLocaleString()}</p>
                                            <p className="font-bold border-t pt-2 mt-2">
                                                Avg: {aggregatedStats.avgDuration.app.toLocaleString()} min
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 rounded-lg border bg-muted/50 p-4 mt-4">
                                         <h3 className="font-semibold text-center mb-2">Combined</h3>
                                         <p>Total Combined Duration: {aggregatedStats.totalDuration.total.toLocaleString()} min</p>
                                         <p>Total Combined Classes: {aggregatedStats.classCount.total.toLocaleString()}</p>
                                         <p className="font-bold border-t pt-2 mt-2">
                                            Overall Avg: {aggregatedStats.avgDuration.total.toLocaleString()} min
                                         </p>
                                    </div>
                                </DialogContent>
                            }
                        />
                        <StatCard
                            icon={BarChart}
                            title="Average Rating"
                            stat={aggregatedStats.averageRating}
                            format={(val) => val.toFixed(2)}
                            colorClass="chart-1"
                            popoverContent={
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader><DialogTitle>Average Rating for {aggregatedStats.name}</DialogTitle></DialogHeader>
                                    <p className="text-sm text-muted-foreground px-6">Rating is based on {aggregatedStats.ratedClassesCount} rated classes from APP Dashboard only.</p>
                                    <ScrollArea className="h-96 mt-4">
                                      <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>

                                                <TableHead>Class Topic</TableHead>
                                                <TableHead className="text-right">Rating</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aggregatedStats.ratedClasses.sort((a,b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).map(c => (
                                                <TableRow key={c.id}>
                                                    <TableCell><Badge variant="secondary">{c.date}</Badge></TableCell>
                                                    <TableCell className="font-medium max-w-xs truncate">{c.classTopic}</TableCell>
                                                    <TableCell className="text-right font-bold">{parseNumericValue(c.averageClassRating).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                      </Table>
                                    </ScrollArea>
                                </DialogContent>
                            }
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-center mt-8">
              <RecapButton stats={aggregatedStats} platformTotals={platformTotals} />
            </div>
          </div>
        )}
        
        <Separator />
        
        <TeacherComparison data={combinedData} allTeachers={allTeachers} teacherImages={teacherImages} />

      </main>
      <Footer />
    </div>
  );
}


