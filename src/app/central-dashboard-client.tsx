
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { ClassEntry, AppClassEntry, CombinedClassEntry } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Clock, Star, Users, TrendingUp, LogOut, Info, Columns, X, Calendar } from 'lucide-react';
import Navbar from '@/components/navbar';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MultiSelectFilter } from "@/components/dashboard/multi-select-filter";
import { DataTable as CombinedDataTable } from "@/components/dashboard/combined-data-table"; 
import { TopTeachers } from "@/components/dashboard/top-teachers";
import { TeacherPerformanceCharts } from "@/components/dashboard/teacher-performance-charts";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const parseNumericValue = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,|\%/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
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

const isAppEntry = (entry: CombinedClassEntry): entry is AppClassEntry & { dataSource: 'app' } => entry.dataSource === 'app';
const isFbEntry = (entry: CombinedClassEntry): entry is ClassEntry & { dataSource: 'fb' } => entry.dataSource === 'fb';

const StatCard = ({ icon: Icon, title, stat, popoverContent, colorClass }: { icon: React.ElementType, title: string, stat: any, popoverContent: React.ReactNode, colorClass: string }) => {
    const total = stat?.total ?? 0;
    return (
        <Card className={`border-${colorClass}/50`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-${colorClass}`} />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className={`text-2xl font-bold text-${colorClass}`}>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5"><Info className="h-4 w-4 text-muted-foreground" /></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                           {popoverContent}
                        </DialogContent>
                    </Dialog>
                </div>
                 <p className="text-xs text-muted-foreground">
                    Fb: {stat?.fb.toLocaleString() ?? 0} | App: {stat?.app.toLocaleString() ?? 0}
                </p>
            </CardContent>
        </Card>
    );
};


export default function CentralDashboard() {
  const [fbData, setFbData] = useState<ClassEntry[]>([]);
  const [appData, setAppData] = useState<AppClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [globalFilter, setGlobalFilter] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [productFilters, setProductFilters] = useState<string[]>([]);
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);
  const [teacherFilters, setTeacherFilters] = useState<string[]>([]);
  const [issueTypeFilters, setIssueTypeFilters] = useState<string[]>([]);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {};
    for (const col of allCombinedColumns) {
      visibility[col.key] = defaultCombinedVisibleColumns.includes(col.key as keyof CombinedClassEntry);
    }
    return visibility;
  });


  useEffect(() => {
    const handleImport = async () => {
      setIsLoading(true);
      try {
        const initialSheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;
        if (!initialSheetUrl) {
          throw new Error("Google Sheet URL is not configured.");
        }

        const [fbResponse, appResponse] = await Promise.all([
          fetch('/api/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetUrl: initialSheetUrl }) }),
          fetch('/api/app-sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetUrl: initialSheetUrl }) })
        ]);

        if (!fbResponse.ok || !appResponse.ok) {
          const fbError = fbResponse.ok ? null : await fbResponse.json();
          const appError = appResponse.ok ? null : await appResponse.json();
          throw new Error(`Failed to fetch data. Fb: ${fbError?.error || 'OK'}, App: ${appError?.error || 'OK'}`);
        }

        const fbSheetData = await fbResponse.json();
        const appSheetData = await appResponse.json();
        
        setFbData(fbSheetData);
        setAppData(appSheetData);
        toast({ title: "Success!", description: "Both Fb and App data loaded." });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Data Loading Error', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    handleImport();
  }, []);

  const combinedData = useMemo(() => {
    const fbMarked = fbData.map(d => ({ ...d, id: `fb-${d.id}`, dataSource: 'fb' as const }));
    const appMarked = appData.map(d => ({ ...d, id: `app-${d.id}`, dataSource: 'app' as const }));
    return [...fbMarked, ...appMarked];
  }, [fbData, appData]);
  
  const products = useMemo(() => [...new Set(combinedData.map((item) => isAppEntry(item) ? item.product : item.productType).filter(Boolean))], [combinedData]);
  const subjects = useMemo(() => [...new Set(combinedData.map((item) => item.subject).filter(Boolean))], [combinedData]);
  const teachers = useMemo(() => [...new Set(combinedData.map((item) => item.teacher).filter(Boolean))], [combinedData]);
  const issueTypes = useMemo(() => [...new Set(combinedData.map((item) => item.issuesType).filter(Boolean))], [combinedData]);


  const filteredData = useMemo(() => {
    return combinedData.filter(item => {
      // Date Filter
      const itemDate = parseDateString(item.date as string);
      if (startDate && (!itemDate || itemDate < startDate)) return false;
      if (endDate && (!itemDate || itemDate > endDate)) return false;
      
      const product = isAppEntry(item) ? item.product : item.productType;
      if (productFilters.length > 0 && !productFilters.includes(product!)) return false;
      if (subjectFilters.length > 0 && !subjectFilters.includes(item.subject!)) return false;
      if (teacherFilters.length > 0 && !teacherFilters.includes(item.teacher!)) return false;
      if (issueTypeFilters.length > 0 && !issueTypeFilters.includes(item.issuesType!)) return false;
      
      if (globalFilter) {
          const lowercasedFilter = globalFilter.toLowerCase();
          return Object.values(item).some(value =>
              String(value).toLowerCase().includes(lowercasedFilter)
          );
      }
      return true;
    });
  }, [combinedData, globalFilter, startDate, endDate, productFilters, subjectFilters, teacherFilters, issueTypeFilters]);

  const summary = useMemo(() => {
    const activeData = filteredData;
    const initialStat = { fb: 0, app: 0, total: 0 };
    
    const classCount = { ...initialStat };
    const totalDuration = { ...initialStat };
    const totalAttendance = { ...initialStat };
    let highestAttendance = { ...initialStat, class: null as CombinedClassEntry | null };
    let totalRating = 0;
    let ratedClassesCount = 0;

    activeData.forEach(item => {
      let peak = 0;
      if (isFbEntry(item)) {
        classCount.fb++;
        totalDuration.fb += parseNumericValue(item.totalDuration);
        totalAttendance.fb += parseNumericValue(item.averageAttendance);
        peak = parseNumericValue(item.highestAttendance);
      } else if (isAppEntry(item)) {
        classCount.app++;
        totalDuration.app += parseNumericValue(item.classDuration);
        totalAttendance.app += parseNumericValue(item.totalAttendance);
        peak = parseNumericValue(item.totalAttendance);

        const rating = parseNumericValue(item.averageClassRating);
        if (rating > 0) {
          totalRating += rating;
          ratedClassesCount++;
        }
      }
      if (peak > highestAttendance.total) {
        highestAttendance = { fb: isFbEntry(item) ? peak : 0, app: isAppEntry(item) ? peak : 0, total: peak, class: item };
      }
    });

    classCount.total = classCount.fb + classCount.app;
    totalDuration.total = totalDuration.fb + totalDuration.app;
    totalAttendance.total = totalAttendance.fb + totalAttendance.app;
    
    const avgAttendance = {
      fb: classCount.fb > 0 ? totalAttendance.fb / classCount.fb : 0,
      app: classCount.app > 0 ? totalAttendance.app / classCount.app : 0,
      total: classCount.total > 0 ? totalAttendance.total / classCount.total : 0,
    };
    
    const avgRating = {
      total: ratedClassesCount > 0 ? totalRating / ratedClassesCount : 0,
      fb: 0,
      app: ratedClassesCount > 0 ? totalRating / ratedClassesCount : 0 // Rating is only from app
    };

    return { classCount, totalDuration, avgAttendance, highestAttendance, avgRating, totalAttendance, ratedClassesCount };
  }, [filteredData]);
  
  const clearAllFilters = () => {
    setGlobalFilter("");
    setStartDate(undefined);
    setEndDate(undefined);
    setProductFilters([]);
    setSubjectFilters([]);
    setTeacherFilters([]);
    setIssueTypeFilters([]);
  };

  const handleLogout = () => {
    localStorage.removeItem("dashboard_session");
    router.replace("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
        </Button>
      </Navbar>
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Central Dashboard</h1>
          <p className="text-muted-foreground">A unified view of your Fb and APP class data.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Overall Performance</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard icon={Award} title="Total Classes" stat={summary.classCount} colorClass="chart-1" popoverContent={
                <DialogHeader><DialogTitle>Total Classes Breakdown</DialogTitle></DialogHeader>
            } />
             <StatCard icon={Clock} title="Total Duration (min)" stat={summary.totalDuration} colorClass="chart-4" popoverContent={
                <>
                  <DialogHeader><DialogTitle>Total Duration Breakdown</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                      <div className="space-y-2 rounded-lg border p-4">
                          <h3 className="font-semibold text-center mb-2">Fb Duration</h3>
                          <p className="font-bold text-lg text-center">{formatDuration(summary.totalDuration.fb)}</p>
                      </div>
                      <div className="space-y-2 rounded-lg border p-4">
                          <h3 className="font-semibold text-center mb-2">App Duration</h3>
                          <p className="font-bold text-lg text-center">{formatDuration(summary.totalDuration.app)}</p>
                      </div>
                  </div>
                  <div className="space-y-2 rounded-lg border bg-muted/50 p-4 mt-4">
                      <h3 className="font-semibold text-center mb-2">Total Combined Duration</h3>
                      <p className="font-bold text-xl text-center">{formatDuration(summary.totalDuration.total)}</p>
                  </div>
                </>
            } />
            <StatCard icon={Users} title="Average Attendance" stat={summary.avgAttendance} colorClass="chart-6" popoverContent={
                 <>
                    <DialogHeader><DialogTitle>Average Attendance Calculation</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                        <div className="space-y-2 rounded-lg border p-4">
                            <h3 className="font-semibold text-center mb-2">Fb Data</h3>
                            <p>Total Fb Attendance: {summary.totalAttendance.fb.toLocaleString()}</p>
                            <p>Total Fb Classes: {summary.classCount.fb.toLocaleString()}</p>
                            <p className="font-bold border-t pt-2 mt-2">Avg: {summary.avgAttendance.fb.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="space-y-2 rounded-lg border p-4">
                            <h3 className="font-semibold text-center mb-2">App Data</h3>
                            <p>Total App Attendance: {summary.totalAttendance.app.toLocaleString()}</p>
                            <p>Total App Classes: {summary.classCount.app.toLocaleString()}</p>
                            <p className="font-bold border-t pt-2 mt-2">Avg: {summary.avgAttendance.app.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                     <div className="space-y-2 rounded-lg border bg-muted/50 p-4 mt-4">
                         <h3 className="font-semibold text-center mb-2">Combined</h3>
                         <p>Total Combined Attendance: {summary.totalAttendance.total.toLocaleString()}</p>
                         <p>Total Combined Classes: {summary.classCount.total.toLocaleString()}</p>
                         <p className="font-bold border-t pt-2 mt-2">
                            Overall Avg: {summary.avgAttendance.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                         </p>
                    </div>
                </>
            } />
            <StatCard icon={TrendingUp} title="Highest Attendance" stat={summary.highestAttendance} colorClass="chart-5" popoverContent={
                <>
                    <DialogHeader><DialogTitle>Highest Attendance Class</DialogTitle></DialogHeader>
                    {summary.highestAttendance.class && 
                      <div className="p-4 text-sm">
                        <p><strong>Topic:</strong> {summary.highestAttendance.class.subject || (summary.highestAttendance.class as AppClassEntry).classTopic}</p>
                        <p><strong>Teacher:</strong> {summary.highestAttendance.class.teacher}</p>
                        <p><strong>Date:</strong> {summary.highestAttendance.class.date}</p>
                        <p><strong>Source:</strong> {summary.highestAttendance.class.dataSource?.toUpperCase()}</p>
                      </div>
                    }
                </>
            } />
             <StatCard icon={Star} title="Average Class Rating" stat={summary.avgRating} colorClass="chart-3" popoverContent={
                <>
                    <DialogHeader><DialogTitle>Average Class Rating</DialogTitle></DialogHeader>
                    <div className="p-4 text-sm">
                        <p>This rating is based on {summary.ratedClassesCount} rated classes from the APP dashboard.</p>
                        <p><strong>Note:</strong> Fb classes do not have ratings.</p>
                    </div>
                </>
            } />
          </div>
        </section>

        <Separator className="my-8" />
        
        <section className="space-y-4">
           <h2 className="text-2xl font-bold tracking-tight">Advanced Filtering &amp; Column Selection</h2>
            <div className="flex flex-col gap-4">
                 <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
                    <MultiSelectFilter title="Products" options={products.map(p => ({ value: p, label: p }))} selectedValues={productFilters} onSelectedValuesChange={setProductFilters} triggerClassName="w-full md:w-auto" />
                    <MultiSelectFilter title="Subjects" options={subjects.map(s => ({ value: s, label: s }))} selectedValues={subjectFilters} onSelectedValuesChange={setSubjectFilters} triggerClassName="w-full md:w-auto" />
                    <MultiSelectFilter title="Teachers" options={teachers.map(t => ({ value: t, label: t }))} selectedValues={teacherFilters} onSelectedValuesChange={setTeacherFilters} triggerClassName="w-full md:w-auto" />
                    <MultiSelectFilter title="Issue Types" options={issueTypes.map(i => ({ value: i, label: i }))} selectedValues={issueTypeFilters} onSelectedValuesChange={setIssueTypeFilters} triggerClassName="w-full md:w-auto" />
                    {(productFilters.length > 0 || subjectFilters.length > 0 || teacherFilters.length > 0 || issueTypeFilters.length > 0) && (
                        <Button variant="ghost" onClick={clearAllFilters} className="h-10 px-2 lg:px-3">
                            Clear Filters <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    <div className="flex-grow" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10 ml-auto"><Columns className="mr-2 h-4 w-4" /> View</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[250px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ScrollArea className="h-72">
                          {allCombinedColumns.map((column) => (
                            <DropdownMenuCheckboxItem
                              key={column.key}
                              className="capitalize"
                              checked={columnVisibility[column.key]}
                              onCheckedChange={(value) => setColumnVisibility((prev) => ({ ...prev, [column.key]: !!value }))}
                            >
                              {column.header}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </section>

        <Separator className="my-8" />
        
        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Top Teacher Performance</h2>
          <TopTeachers data={combinedData} />
        </section>

        <Separator className="my-8" />
        
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Detailed Combined Class Data</h2>
          <Card className="p-0">
            <CardContent className="p-0">
                <CombinedDataTable
                    data={filteredData}
                    allColumns={allCombinedColumns}
                    columnVisibility={columnVisibility}
                    isLoading={isLoading}
                />
            </CardContent>
          </Card>
        </section>
        
        <Separator className="my-8" />
        
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Teacher Performance Breakdown</h2>
          <TeacherPerformanceCharts data={combinedData} />
        </section>

        <Separator className="my-8" />

      </main>
      <footer className="border-t">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <div>© 2025 10 MS Content Operations. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}


const defaultCombinedVisibleColumns: (keyof CombinedClassEntry)[] = [
    "dataSource", "date", "teacher", "subject", "averageAttendance", "totalDuration"
];

const allCombinedColumns: { key: keyof CombinedClassEntry; header: string; sortable?: boolean }[] = [
    { key: 'dataSource', header: 'Source', sortable: true },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'teacher', header: 'Teacher', sortable: true },
    { key: 'subject', header: 'Subject/Topic', sortable: true },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'averageAttendance', header: 'Avg/Total Attendance', sortable: true },
    { key: 'totalDuration', header: 'Duration', sortable: true },
    { key: 'averageClassRating', header: 'Rating', sortable: true },
    { key: 'issuesType', header: 'Issue Type', sortable: true },
];
