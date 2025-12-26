"use client";

import { useState, useMemo, useEffect } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import Logo from "@/components/logo";
import type { ClassEntry } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, User, BookCopy, Activity, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [data, setData] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [globalFilter, setGlobalFilter] = useState("");
  const [productTypeFilters, setProductTypeFilters] = useState<string[]>([]);
  const [courseFilters, setCourseFilters] = useState<string[]>([]);
  const [teacher1Filters, setTeacher1Filters] = useState<string[]>([]);
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);


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

  const filteredData = useMemo(() => {
    let filtered = data;

    if (productTypeFilters.length > 0) {
      filtered = filtered.filter((item) =>
        productTypeFilters.includes(item.productType)
      );
    }
    if (courseFilters.length > 0) {
      filtered = filtered.filter((item) =>
        courseFilters.includes(item.course)
      );
    }
    if (teacher1Filters.length > 0) {
      filtered = filtered.filter((item) =>
        teacher1Filters.includes(item.teacher1)
      );
    }
    if (subjectFilters.length > 0) {
      filtered = filtered.filter((item) =>
        subjectFilters.includes(item.subject)
      );
    }


    if (globalFilter) {
      const lowercasedFilter = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(lowercasedFilter)
        );
      });
    }

    return filtered;
  }, [data, globalFilter, productTypeFilters, courseFilters, teacher1Filters, subjectFilters]);

  const summary = useMemo(() => {
    const activeData = filteredData;
    const totalDuration = activeData.reduce((acc, item) => {
      const duration = parseFloat(item.totalDurationMinutes);
      return acc + (isNaN(duration) ? 0 : duration);
    }, 0);

    const highestAttendance = activeData.reduce((max, item) => {
        const attendance = parseInt(item.highestAttendance, 10);
        return isNaN(attendance) ? max : Math.max(max, attendance);
    }, 0);

    const totalAverageAttendance = activeData.reduce((acc, item) => {
        const attendance = parseFloat(item.averageAttendance);
        return acc + (isNaN(attendance) ? 0 : attendance);
    }, 0);

    const averageAttendance = activeData.length > 0
        ? Math.round(totalAverageAttendance / activeData.length)
        : 0;

    return {
      total: data.length,
      filtered: activeData.length,
      courses: new Set(activeData.map(item => item.course).filter(Boolean)).size,
      teachers: new Set(activeData.map(item => item.teacher1).filter(Boolean)).size,
      productTypes: new Set(activeData.map(item => item.productType).filter(Boolean)).size,
      totalDuration: Math.round(totalDuration),
      highestAttendance: highestAttendance,
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
              <div className="text-2xl font-bold">{summary.averageAttendance.toLocaleString()}</div>
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
  { key: "remarks", header: "Remarks" },
];
