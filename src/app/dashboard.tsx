
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import type { ClassEntry } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, BookCopy, Activity, Clock, TrendingUp, Users, Info, Columns, X, LogOut, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TopTeachers } from "@/components/dashboard/top-teachers";
import { Separator } from "@/components/ui/separator";
import { MultiSelectFilter } from "@/components/dashboard/multi-select-filter";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeacherPerformanceCharts } from "@/components/dashboard/teacher-performance-charts";
import Navbar from "@/components/navbar";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";


const parseNumericValue = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // Handles formats like "Wednesday, January 1, 2025" and other common ones
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const monthMap: { [key: string]: number } = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

const monthNames = [
  "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"
];

export default function Dashboard() {
  const [data, setData] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [globalFilter, setGlobalFilter] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>();
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>();
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startCalendarMonth, setStartCalendarMonth] = useState(new Date());
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date());
  const [productTypeFilters, setProductTypeFilters] = useState<string[]>([]);
  const [courseFilters, setCourseFilters] = useState<string[]>([]);
  const [teacherFilters, setTeacherFilters] = useState<string[]>([]);
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);
  const [issueTypeFilters, setIssueTypeFilters] = useState<string[]>([]);

  const [columnVisibility, setColumnVisibility] = React.useState<
    Record<string, boolean>
  >(() => {
    const visibility: Record<string, boolean> = {};
    for (const col of allColumns) {
      visibility[col.key] = defaultVisibleColumns.includes(
        col.key as keyof ClassEntry
      );
    }
    return visibility as Record<string, boolean>;
  });


  useEffect(() => {
    const handleImport = async (url: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl: url }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch data from sheet.");
        }

        const sheetData = await response.json();
        setData(sheetData);
        toast({
          title: "Success!",
          description: "Data loaded from your Google Sheet.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description:
            error.message ||
            "Could not import data. Please check the URL and try again.",
        });
        setData([]); // Set data to empty on error
      } finally {
        setIsLoading(false);
      }
    };

    const initialSheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;
    if (initialSheetUrl) {
      handleImport(initialSheetUrl);
    } else {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description:
          "Google Sheet URL is not configured in environment variables.",
      });
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productTypes = useMemo(
    () => [...new Set(data.map((item) => item.productType).filter(Boolean))],
    [data]
  );
  const courses = useMemo(
    () => [...new Set(data.map((item) => item.course).filter(Boolean))],
    [data]
  );
  const teachers = useMemo(
    () => [...new Set(data.map((item) => item.teacher).filter(Boolean))],
    [data]
  );
  const subjects = useMemo(
    () => [...new Set(data.map((item) => item.subject).filter(Boolean))],
    [data]
  );
  const issueTypes = useMemo(
    () => [...new Set(data.map((item) => item.issuesType).filter(Boolean))],
    [data]
  );

  const filteredDataWithoutIssues = useMemo(() => {
    return data.filter(item => {
      // Date Filter
      if (startDate || endDate) {
        const itemDate = parseDateString(item.date);
        if (!itemDate) return false;
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
      }
      
      // Other Filters (excluding issueTypeFilters)
      if (productTypeFilters.length > 0 && !productTypeFilters.includes(item.productType)) {
          return false;
      }
      if (courseFilters.length > 0 && !courseFilters.includes(item.course)) {
          return false;
      }
      if (teacherFilters.length > 0 && !teacherFilters.includes(item.teacher)) {
          return false;
      }
      if (subjectFilters.length > 0 && !subjectFilters.includes(item.subject)) {
          return false;
      }
      if (globalFilter) {
          const lowercasedFilter = globalFilter.toLowerCase();
          return Object.values(item).some(value =>
              String(value).toLowerCase().includes(lowercasedFilter)
          );
      }
      return true;
    });
  }, [data, globalFilter, startDate, endDate, productTypeFilters, courseFilters, teacherFilters, subjectFilters]);

  const filteredData = useMemo(() => {
    return filteredDataWithoutIssues.filter(item => {
      if (issueTypeFilters.length > 0 && !issueTypeFilters.includes(item.issuesType)) {
          return false;
      }
      return true;
    });
  }, [filteredDataWithoutIssues, issueTypeFilters]);


  const summary = useMemo(() => {
    const activeData = filteredData;
    const totalDuration = activeData.reduce((acc, item) => {
      const duration = parseNumericValue(item.totalDuration);
      return acc + duration;
    }, 0);

    const { highestAttendance, topClass } = activeData.reduce(
      (acc, item) => {
        const attendance = parseNumericValue(item.highestAttendance);
        if (attendance > acc.highestAttendance) {
          return { highestAttendance: attendance, topClass: item };
        }
        return acc;
      },
      { highestAttendance: 0, topClass: null as ClassEntry | null }
    );

    const totalAttendance = activeData.reduce((acc, item) => {
        const attendance = parseNumericValue(item.averageAttendance);
        return acc + attendance;
    }, 0);

    const averageAttendance = activeData.length > 0
        ? Math.round(totalAttendance / activeData.length)
        : 0;
        
    const uniqueCourses = [...new Set(activeData.map(item => item.course).filter(Boolean))];
    const uniqueProductTypes = [...new Set(activeData.map(item => item.productType).filter(Boolean))];

    return {
      total: data.length,
      filtered: activeData.length,
      courses: uniqueCourses,
      productTypes: uniqueProductTypes,
      totalDuration: Math.round(totalDuration),
      highestAttendance: highestAttendance,
      topClass: topClass,
      totalAttendance: totalAttendance,
      averageAttendance: averageAttendance,
    }
  }, [filteredData, data.length]);

  const issuePercentage = useMemo(() => {
    const baseData = filteredDataWithoutIssues;
    if (baseData.length === 0 || issueTypeFilters.length === 0) {
      return 0;
    }
    const issueCount = baseData.filter(item => issueTypeFilters.includes(item.issuesType)).length;
    return (issueCount / baseData.length) * 100;
  }, [filteredDataWithoutIssues, issueTypeFilters]);
  
  const clearAllFilters = () => {
    setGlobalFilter("");
    setStartDate(undefined);
    setEndDate(undefined);
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setProductTypeFilters([]);
    setCourseFilters([]);
    setTeacherFilters([]);
    setSubjectFilters([]);
    setIssueTypeFilters([]);
  };

  const applyDateFilter = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowStartCalendar(false);
    setShowEndCalendar(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (date1: Date | undefined, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getMonth() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Select date";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const CalendarPicker = ({ 
    selectedDate, 
    onSelectDate, 
    currentMonth, 
    setCurrentMonth 
  }: { 
    selectedDate: Date | undefined;
    onSelectDate: (date: Date) => void;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
  }) => {
    const days = getDaysInMonth(currentMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const goToPreviousMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    
    const goToNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
      <div className="bg-popover text-popover-foreground rounded-md border shadow-md p-3 w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-7 w-7">
            ←
          </Button>
          <div className="font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-7 w-7">
            →
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => day && onSelectDate(day)}
              disabled={!day}
              className={cn(
                "h-8 w-8 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                !day && "invisible",
                isSameDay(selectedDate, day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {day?.getDate()}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const hasActiveFilters =
    startDate !== undefined ||
    endDate !== undefined ||
    productTypeFilters.length > 0 ||
    courseFilters.length > 0 ||
    teacherFilters.length > 0 ||
    subjectFilters.length > 0 ||
    issueTypeFilters.length > 0;
    
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

  const isFiltered = hasActiveFilters;

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
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Facebook Dashboard
          </h1>
          <p className="text-muted-foreground">
            An interactive view of your Google Sheet data.
          </p>
        </div>

        {hasActiveFilters && (
          <div className="mb-8 rounded-lg border bg-card p-4 shadow-sm">
            {teacherFilters.length > 0 && (
              <div className="mb-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {teacherFilters.join(", ")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Filtered Results
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {(startDate || endDate) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Date Range:</span>
                  <Badge variant="secondary" className="pl-2">
                    {formatDate(startDate)} to {formatDate(endDate)}
                  </Badge>
                </div>
              )}
              {productTypeFilters.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Product Types:</span>
                  {productTypeFilters.map(filter => (
                    <Badge key={filter} variant="secondary" className="pl-2">
                      {filter}
                    </Badge>
                  ))}
                </div>
              )}
              {courseFilters.length > 0 && (
                 <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Courses:</span>
                  {courseFilters.map(filter => (
                    <Badge key={filter} variant="secondary" className="pl-2">
                      {filter}
                    </Badge>
                  ))}
                </div>
              )}
              {subjectFilters.length > 0 && (
                 <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Subjects:</span>
                  {subjectFilters.map(filter => (
                    <Badge key={filter} variant="secondary" className="pl-2">
                      {filter}
                    </Badge>
                  ))}
                </div>
              )}
              {issueTypeFilters.length > 0 && (
                 <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Issue Types:</span>
                  {issueTypeFilters.map(filter => (
                    <Badge key={filter} variant="secondary" className="pl-2">
                      {filter}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Data Analysis of Classes
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-chart-1/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Classes
                </CardTitle>
                <BookCopy className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-chart-1">{summary.filtered}</div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[625px]">
                         <DialogHeader>
                            <DialogTitle>Filtered Classes</DialogTitle>
                         </DialogHeader>
                        <ScrollArea className="h-72 mt-4">
                          <div className="flex flex-col gap-2 text-sm pr-6">
                            {filteredData.map(item => (
                              <div key={item.id} className="flex justify-between items-center gap-4 border-b pb-2">
                                <span className="text-muted-foreground">{item.date}</span>
                                <span className="font-medium text-right truncate">{item.course}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                </div>
                 <p className="text-xs text-muted-foreground">
                  of {summary.total} total
                </p>
              </CardContent>
            </Card>
            <Card className="border-chart-2/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-chart-2">{summary.courses.length}</div>
                  <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto max-w-[300px]" side="top" align="end">
                         <div className="space-y-2">
                            <h4 className="font-medium leading-none">Unique Courses</h4>
                            <p className="text-xs text-muted-foreground">
                                List of unique courses in the current view.
                            </p>
                        </div>
                        <ScrollArea className="h-48 mt-4">
                          <div className="flex flex-col items-start gap-1">
                            {summary.courses.map(course => (
                              <Badge key={course} variant="secondary">{course}</Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                </div>
                 <p className="text-xs text-muted-foreground">
                  in current view
                </p>
              </CardContent>
            </Card>
            <Card className="border-chart-3/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Product Types
                </CardTitle>
                <Activity className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-chart-3">{summary.productTypes.length}</div>
                  <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto" side="top" align="end">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Product Types</h4>
                            <p className="text-xs text-muted-foreground">
                                List of unique product types in the current view.
                            </p>
                        </div>
                        <ScrollArea className="h-48 mt-4">
                          <div className="flex flex-col items-start gap-1">
                            {summary.productTypes.map(pt => (
                              <Badge key={pt} variant="secondary">{pt}</Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                </div>
                 <p className="text-xs text-muted-foreground">
                  in current view
                </p>
              </CardContent>
            </Card>
            <Card className="border-chart-4/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Duration (min)
                </CardTitle>
                <Clock className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-chart-4">{summary.totalDuration.toLocaleString()}</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="text-sm w-auto" side="top" align="end">
                        <div className="font-bold">
                          {formatDuration(summary.totalDuration)}
                        </div>
                      </PopoverContent>
                    </Popover>
                </div>
                 <p className="text-xs text-muted-foreground">
                  in current view
                </p>
              </CardContent>
            </Card>
            <Card className="border-chart-5/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Highest Attendance
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-chart-5" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-chart-5">{summary.highestAttendance.toLocaleString()}</div>
                  {summary.topClass && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="text-sm w-auto" side="top" align="end">
                        <div className="grid gap-1">
                          <div className="font-bold">{summary.topClass.subject}</div>
                          <div className="text-xs text-muted-foreground">{summary.topClass.date}</div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-chart-6/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Attendance
                </CardTitle>
                <Users className="h-4 w-4 text-chart-6" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-chart-6">{summary.averageAttendance.toLocaleString()}</div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Calculation</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4 text-sm">
                          <div className="flex items-center gap-1.5">
                              Total Attendance:
                              <Dialog>
                                  <DialogTrigger asChild>
                                      <Button variant="link" size="sm" className="p-0 h-auto text-sm">{summary.totalAttendance.toLocaleString()}</Button>
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
                                                  {filteredData.map(item => (
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
                                                      <TableCell className="text-right font-bold">{summary.totalAttendance.toLocaleString()}</TableCell>
                                                  </TableRow>
                                              </TableFooter>
                                          </Table>
                                      </ScrollArea>
                                  </DialogContent>
                              </Dialog>
                          </div>
                          <div>
                              Total Classes: {summary.filtered.toLocaleString()}
                          </div>
                          <p className="font-bold border-t pt-2 mt-1">
                              {summary.totalAttendance.toLocaleString()} / {summary.filtered > 0 ? summary.filtered.toLocaleString() : 1} = {summary.averageAttendance.toLocaleString()}
                          </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                 <p className="text-xs text-muted-foreground">
                  in current view
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <Separator className="my-8" />

        <section className="space-y-4">
           <h2 className="text-2xl font-bold tracking-tight">
            Advanced Filtering &amp; Column Selection
          </h2>
          <div className="flex flex-col gap-4">
            {/* Date Filter Row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="grid w-full md:w-auto gap-1.5">
                <Label className="text-sm font-medium">Start Date</Label>
                <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-[240px] justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(tempStartDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      selectedDate={tempStartDate}
                      onSelectDate={setTempStartDate}
                      currentMonth={startCalendarMonth}
                      setCurrentMonth={setStartCalendarMonth}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid w-full md:w-auto gap-1.5">
                <Label className="text-sm font-medium">End Date</Label>
                <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-[240px] justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(tempEndDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      selectedDate={tempEndDate}
                      onSelectDate={setTempEndDate}
                      currentMonth={endCalendarMonth}
                      setCurrentMonth={setEndCalendarMonth}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {(tempStartDate || tempEndDate) && (
                <Button
                  onClick={applyDateFilter}
                  className="h-10 w-full md:w-auto"
                >
                  Apply Date Filter
                </Button>
              )}
               <MultiSelectFilter
                title="Issue Types"
                options={issueTypes.map(type => ({ value: type, label: type }))}
                selectedValues={issueTypeFilters}
                onSelectedValuesChange={setIssueTypeFilters}
                triggerClassName="w-full md:w-auto"
              />
            </div>
            
            {/* Other Filters Row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
              <MultiSelectFilter
                title="Product Types"
                options={productTypes.map(type => ({ value: type, label: type }))}
                selectedValues={productTypeFilters}
                onSelectedValuesChange={setProductTypeFilters}
                triggerClassName="w-full md:w-auto"
              />
              <MultiSelectFilter
                title="Courses"
                options={courses.map(course => ({ value: course, label: course }))}
                selectedValues={courseFilters}
                onSelectedValuesChange={setCourseFilters}
                triggerClassName="w-full md:w-auto"
              />
              <MultiSelectFilter
                title="Teachers"
                options={teachers.map(teacher => ({ value: teacher, label: teacher }))}
                selectedValues={teacherFilters}
                onSelectedValuesChange={setTeacherFilters}
                triggerClassName="w-full md:w-auto"
              />
              <MultiSelectFilter
                title="Subjects"
                options={subjects.map(subject => ({ value: subject, label: subject }))}
                selectedValues={subjectFilters}
                onSelectedValuesChange={setSubjectFilters}
                triggerClassName="w-full md:w-auto"
              />

              {isFiltered && (
                <Button
                  variant="ghost"
                  onClick={clearAllFilters}
                  className="h-10 px-2 lg:px-3"
                >
                  Clear Filters
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}

              <div className="flex-grow" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 ml-auto">
                    <Columns className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[250px]">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-72">
                    {allColumns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        className="capitalize"
                        checked={columnVisibility[column.key]}
                        onCheckedChange={(value) =>
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [column.key]: !!value,
                          }))
                        }
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

        {issueTypeFilters.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Issue Percentage
            </h2>
            <Card className="border-destructive/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Percentage of selected issues
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {issuePercentage.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  of classes in the current view have the selected issue types.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
        
        <Separator className="my-8" />
        
        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Top Teacher Performance
          </h2>
          <TopTeachers data={data} />
        </section>

        <Separator className="my-8" />

        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Detailed Class Data
          </h2>
          <Card className="p-0">
            <CardContent className="p-0">
              <DataTable
                data={filteredData}
                allColumns={allColumns}
                columnVisibility={columnVisibility}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />
        
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Teacher Performance Breakdown
          </h2>
          <TeacherPerformanceCharts data={data} />
        </section>

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

const defaultVisibleColumns: (keyof ClassEntry)[] = [
  "date",
  "scheduledTime",
  "productType",
  "course",
  "subject",
  "teacher",
  "highestAttendance",
  "averageAttendance",
  "totalDuration",
  "issuesType",
];


const allColumns: {key: keyof ClassEntry, header: string, sortable?: boolean}[] = [
  { key: "date", header: "Date", sortable: true },
  { key: "scheduledTime", header: "Scheduled Time", sortable: true },
  { key: "productType", header: "Product Type", sortable: true },
  { key: "course", header: "Course", sortable: true },
  { key: "subject", header: "Subject", sortable: true },
  { key: "teacher", header: "Teacher", sortable: true },
  { key: "highestAttendance", header: "Highest Attendance", sortable: true },
  { key: "averageAttendance", header: "Average Attendance", sortable: true },
  { key: "totalComments", header: "Total Comments", sortable: true },
  { key: "totalDuration", header: "Total Duration (min)", sortable: true },
  { key: "issuesType", header: "Issues Type", sortable: true },
  { key: "entryTime", header: "Entry Time" },
  { key: "slideQAC", header: "Slide QAC" },
  { key: "classStartTime", header: "Class Start Time" },
  { key: "teacher1Gmail", header: "Teacher Gmail" },
  { key: "teacher2", header: "Teacher 2" },
  { key: "teacher2Gmail", header: "Teacher 2 Gmail" },
  { key: "teacher3", header: "Teacher 3" },
  { key: "teacher3Gmail", header: "Teacher 3 Gmail" },
  { key: "issuesDetails", header: "Issues Details" },
  { key: "slideCommunication", header: "Slide Communication" },
  { key: "liveClassIssues", header: "Live Class Issues" },
  { key: "otherTechnicalIssues", header: "Other Technical Issues" },
  { key: "satisfaction", header: "Satisfaction" },
  { key: "topic", header: "Topic" },
];

    
