"use client";

import { useState, useMemo, useEffect } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import Logo from "@/components/logo";
import type { ClassEntry } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, User, BookCopy, Activity, Clock, TrendingUp, Users, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

    const highestAttendance = activeData.reduce((max, item) => {
        const attendance = parseNumericValue(item.highestAttendance);
        return Math.max(max, attendance);
    }, 0);

    const totalAttendance = activeData.reduce((acc, item) => {
        const attendance = parseNumericValue(item.highestAttendance);
        return acc + attendance;
    }, 0);

    const averageAttendance = activeData.length > 0
        ? Math.round(totalAttendance / activeData.length)
        : 0;

    return {
      total: data.length,
      filtered: activeData.length,
      courses: new Set(activeData.map(item => item.course).filter(Boolean)).size,
      teachers: new Set(activeData.map(item => item.teacher1).filter(Boolean)).size,
      productTypes: new Set(activeData.map(item => item.productType).filter(Boolean)).size,
      totalDuration: Math.round(totalDuration),
      highestAttendance: highestAttendance,
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
            Class Dashboard
          </h1>
          <p className="text-muted-foreground">
            An interactive view of your Google Sheet data.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Classes
              </CardTitle>
              <BookCopy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.filtered}</div>
               <p className="text-xs text-muted-foreground">
                of {summary.total} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Courses
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.courses}</div>
               <p className="text-xs text-muted-foreground">
                in current view
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Teachers
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.teachers}</div>
               <p className="text-xs text-muted-foreground">
                in current view
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Product Types
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.productTypes}</div>
               <p className="text-xs text-muted-foreground">
                in current view
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Duration (min)
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDuration.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">
                in current view
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Highest Attendance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.highestAttendance.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">
                in current view
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Attendance
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{summary.averageAttendance.toLocaleString()}</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="text-sm w-auto" side="top" align="end">
                    <div className="grid gap-2">
                      <div className="font-bold">Calculation</div>
                      <div className="flex items-center gap-1.5">
                        Total Attendance:
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="link" size="sm" className="p-0 h-auto text-sm">{summary.totalAttendance.toLocaleString()}</Button>
                          </PopoverTrigger>
                          <PopoverContent side="bottom" align="center" className="w-64">
                              <div className="space-y-2">
                                  <h4 className="font-medium leading-none">Attendance Summation</h4>
                                  <p className="text-xs text-muted-foreground">
                                      Individual attendance counts being added.
                                  </p>
                              </div>
                              <ScrollArea className="h-48 mt-4">
                                  <div className="text-xs p-2 bg-muted rounded-md break-all">
                                      {filteredData.map(item => parseNumericValue(item.highestAttendance)).join(' + ')}
                                  </div>
                              </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        Total Classes: {summary.filtered.toLocaleString()}
                      </div>
                      <p className="font-bold border-t pt-2 mt-1">
                        {summary.totalAttendance.toLocaleString()} / {summary.filtered > 0 ? summary.filtered.toLocaleString() : 1} = {summary.averageAttendance.toLocaleString()}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
               <p className="text-xs text-muted-foreground">
                in current view
              </p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          data={filteredData}
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
