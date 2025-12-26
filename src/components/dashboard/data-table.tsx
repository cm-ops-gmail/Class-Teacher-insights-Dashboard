"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Columns,
  Loader,
  X,
} from "lucide-react";
import type { ClassEntry } from "@/lib/definitions";
import { MultiSelectFilter } from "./multi-select-filter";
import { TopTeachers } from "./top-teachers";

type ColumnDef = {
  key: keyof ClassEntry;
  header: string;
  sortable?: boolean;
};

const defaultVisibleColumns: (keyof ClassEntry)[] = [
  "date",
  "scheduledTime",
  "productType",
  "course",
  "subject",
  "topic",
  "teacher1",
  "highestAttendance",
  "averageAttendance",
  "totalDurationMinutes",
];

type SortConfig = {
  key: keyof ClassEntry;
  direction: "ascending" | "descending";
} | null;

interface DataTableProps {
  data: ClassEntry[];
  allColumns: ColumnDef[];
  productTypes: string[];
  courses: string[];
  teachers: string[];
  subjects: string[];
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  productTypeFilters: string[];
  setProductTypeFilters: (value: string[]) => void;
  courseFilters: string[];
  setCourseFilters: (value: string[]) => void;
  teacher1Filters: string[];
  setTeacher1Filters: (value: string[]) => void;
  subjectFilters: string[];
  setSubjectFilters: (value: string[]) => void;
  onClearFilters: () => void;
  onDataUpdate: (data: ClassEntry[]) => void;
  isLoading: boolean;
}

const parseNumericValue = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};


export function DataTable({
  data,
  allColumns,
  productTypes,
  courses,
  teachers,
  subjects,
  globalFilter,
  setGlobalFilter,
  productTypeFilters,
  setProductTypeFilters,
  courseFilters,
  setCourseFilters,
  teacher1Filters,
  setTeacher1Filters,
  subjectFilters,
  setSubjectFilters,
  onClearFilters,
  onDataUpdate,
  isLoading,
}: DataTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

  const [columnVisibility, setColumnVisibility] = React.useState<
    Record<keyof ClassEntry, boolean>
  >(() => {
    const visibility: Record<string, boolean> = {};
    for (const col of allColumns) {
      visibility[col.key] = defaultVisibleColumns.includes(
        col.key as keyof ClassEntry
      );
    }
    return visibility as Record<keyof ClassEntry, boolean>;
  });

  const visibleColumns = React.useMemo(
    () => allColumns.filter((col) => columnVisibility[col.key]),
    [columnVisibility, allColumns]
  );

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        const numA = parseNumericValue(aValue);
        const numB = parseNumericValue(bValue);
        
        let valA, valB;

        // Check if the original values look like numbers (even as strings)
        // This is a heuristic. We assume if it parses to a non-zero number, it's numeric.
        // And we ensure that we are not trying to sort something like a date string as a number
        const isNumericSort = !isNaN(numA) && !isNaN(numB) && !/d{1,2}-\w{3}-\d{4}/.test(String(aValue)) && !/\d{1,2}:\d{2}/.test(String(aValue));

        if (isNumericSort) {
          valA = numA;
          valB = numB;
        } else {
          valA = String(aValue).toLowerCase();
          valB = String(bValue).toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: keyof ClassEntry) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const isFiltered = globalFilter || productTypeFilters.length > 0 || courseFilters.length > 0 || teacher1Filters.length > 0 || subjectFilters.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
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
            selectedValues={teacher1Filters}
            onSelectedValuesChange={setTeacher1Filters}
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
              onClick={onClearFilters}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="my-8">
        <TopTeachers data={data} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>
                  {col.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => requestSort(col.key as keyof ClassEntry)}
                      className="-ml-4"
                    >
                      {col.header}
                      {sortConfig?.key === col.key ? (
                        sortConfig.direction === "ascending" ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-30" />
                      )}
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                        <Loader className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                </TableRow>
            ) : sortedData.length > 0 ? (
              sortedData.map((row) => (
                <TableRow key={row.id}>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.key} className="max-w-[250px] truncate">
                      {String(row[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
