"use client";

import { useState, useMemo, useEffect } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import Logo from "@/components/logo";
import type { ClassEntry } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, BookCopy, Activity, Clock, TrendingUp, Users, Info } from "lucide-react";
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

const parseNumericValue = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};


export default function Home() {
  const [data, setData] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [globalFilter, setGlobalFilter] = useState("");
  const [productTypeFilters, setProductTypeFilters] = useState<string[]>([]);
  const [courseFilters, setCourseFilters] = useState<string[]>([]);
  const [teacher1Filters, setTeacher1Filters] = useState<string[]>([]);
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<ClassEntry[]>([]);


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
    () => [...new Set(data.map((item) => item.teacher1).filter(Boolean))],
    [data]
  );
  const subjects = useMemo(
    () => [...new Set(data.map((item) => item.subject).filter(Boolean))],
    [data]
  );

  useEffect(() => {
    const newFilteredData = data.filter(item => {
        if (productTypeFilters.length > 0 && !productTypeFilters.includes(item.productType)) {
            return false;
        }
        if (courseFilters.length > 0 && !courseFilters.includes(item.course)) {
            return false;
        }
        if (teacher1Filters.length > 0 && !teacher1Filters.includes(item.teacher1)) {
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
    setFilteredData(newFilteredData);
  }, [data, globalFilter, productTypeFilters, courseFilters, teacher1Filters, subjectFilters]);


  const summary = useMemo(() => {
    const activeData = filteredData;
    const totalDuration = activeData.reduce((acc, item) => {
      const duration = parseNumericValue(item.totalDurationMinutes);
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
  }, [data.length, filteredData]);
  
  const clearAllFilters = () => {
    setGlobalFilter("");
    setProductTypeFilters([]);
    setCourseFilters([]);
    setTeacher1Filters([]);
    setSubjectFilters([]);
  };

  const hasActiveFilters =
    productTypeFilters.length > 0 ||
    courseFilters.length > 0 ||
    teacher1Filters.length > 0 ||
    subjectFilters.length > 0;
    
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
    return result.trim();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            2025 Class data analysis
          </h1>
          <p className="text-muted-foreground">
            An interactive view of your Google Sheet data.
          </p>
        </div>

        {hasActiveFilters && (
          <div className="mb-8 rounded-lg border bg-card p-4 shadow-sm">
            {teacher1Filters.length > 0 && (
              <div className="mb-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {teacher1Filters.join(", ")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Filtered Results
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
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
                        <div className="font-bold">{summary.topClass.topic}</div>
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
                                                        <TableCell className="font-medium max-w-xs truncate">{item.topic}</TableCell>
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

        <DataTable
          data={filteredData}
          allData={data}
          allColumns={allColumns}
          productTypes={productTypes}
          courses={courses}
          teachers={teachers}
          subjects={subjects}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          productTypeFilters={productTypeFilters}
          setProductTypeFilters={setProductTypeFilters}
          courseFilters={courseFilters}
          setCourseFilters={setCourseFilters}
          teacher1Filters={teacher1Filters}
          setTeacher1Filters={setTeacher1Filters}
          subjectFilters={subjectFilters}
          setSubjectFilters={setSubjectFilters}
          onClearFilters={clearAllFilters}
          onDataUpdate={setData}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

const allColumns = [
  { key: "date", header: "Date", sortable: true },
  { key: "scheduledTime", header: "Scheduled Time", sortable: true },
  { key: "productType", header: "Product Type", sortable: true },
  { key: "course", header: "Course", sortable: true },
  { key: "subject", header: "Subject", sortable: true },
  { key: "topic", header: "Topic", sortable: true },
  { key: "teacher1", header: "Teacher 1", sortable: true },
  { key: "studio", header: "Studio", sortable: true },
  { key: "opsStakeholder", header: "Ops Stakeholder", sortable: true },
  { key: "highestAttendance", header: "Highest Attendance", sortable: true },
  { key: "averageAttendance", header: "Average Attendance", sortable: true },
  { key: "totalComments", header: "Total Comments", sortable: true },
  { key: "totalDurationMinutes", header: "Total Duration (min)", sortable: true },
  { key: "entryTime", header: "Entry Time" },
  { key: "slideQAC", header: "Slide QAC" },
  { key: "classStartTime", header: "Class Start Time" },
  { key: "teacher2", header: "Teacher 2" },
  { key: "teacher3", header: "Teacher 3" },
  { key: "studioCoordinator", header: "Studio Coordinator" },
  { key: "lectureSlide", header: "Lecture Slide" },
  { key: "title", header: "Title" },
  { key: "caption", header: "Caption" },
  { key: "crossPost", header: "Cross Post" },
  { key: "sourcePlatform", header: "Source Platform" },
  { key: "teacherConfirmation", header: "Teacher Confirmation" },
  { key: "zoomLink", header: "Zoom Link" },
  { key: "zoomCredentials", header: "Zoom Credentials" },
  { key: "moderatorLink", header: "Moderator Link" },
  { key: "annotatedSlideLink", header: "Annotated Slide" },
  { key: "classStopTimestamps", header: "Class Stop Timestamps" },
  { key: "startDelayMinutes", header: "Start Delay (min)" },
  { key: "viewCount10Min", header: "Views (10 Min)" },
  { key: "viewCount40_50Min", header: "Views (40-50 Min)" },
  { key: "viewCountBeforeEnd", header: "Views (End)" },
  { key: "classLink", header: "Class LINK" },
  { key: "recordingLink", header: "Recording Link" },
  { key: "classQACFeedback", header: "QAC Feedback" },
  { key: "remarks", header: "Remarks" }
];
