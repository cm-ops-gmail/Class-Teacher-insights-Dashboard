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
import { Input } from "@/components/ui/input";
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
  Search,
  Columns,
  Edit,
  Loader,
} from "lucide-react";
import type { ClassEntry } from "@/lib/definitions";
import { EditDialog } from "./edit-dialog";
import { useToast } from "@/hooks/use-toast";
import { MultiSelectFilter } from "./multi-select-filter";

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
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  productTypeFilters: string[];
  setProductTypeFilters: (value: string[]) => void;
  courseFilters: string[];
  setCourseFilters: (value: string[]) => void;
  teacher1Filters: string[];
  setTeacher1Filters: (value: string[]) => void;
  onDataUpdate: (data: ClassEntry[]) => void;
  isLoading: boolean;
}

export function DataTable({
  data,
  allColumns,
  productTypes,
  courses,
  teachers,
  globalFilter,
  setGlobalFilter,
  productTypeFilters,
  setProductTypeFilters,
  courseFilters,
  setCourseFilters,
  teacher1Filters,
  setTeacher1Filters,
  onDataUpdate,
  isLoading,
}: DataTableProps) {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [editingRow, setEditingRow] = React.useState<ClassEntry | null>(null);

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

        const numA = parseFloat(String(aValue).replace(/,/g, ''));
        const numB = parseFloat(String(bValue).replace(/,/g, ''));

        let valA, valB;
        if (!isNaN(numA) && !isNaN(numB)) {
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

  const handleSave = (updatedRow: ClassEntry) => {
    const event = new CustomEvent('data-update', { detail: (prevData: ClassEntry[]) =>
      prevData.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    });
    window.dispatchEvent(event);

    onDataUpdate(
      (prevData) => prevData.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    )

    setEditingRow(null);
    toast({
      title: "Success",
      description: "Entry updated successfully.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-10 w-full md:w-[350px]"
          />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <MultiSelectFilter
            title="Product Types"
            options={productTypes.map(type => ({ value: type, label: type }))}
            selectedValues={productTypeFilters}
            onSelectedValuesChange={setProductTypeFilters}
            triggerClassName="w-full md:w-[250px] lg:w-[200px]"
          />
          <MultiSelectFilter
            title="Courses"
            options={courses.map(course => ({ value: course, label: course }))}
            selectedValues={courseFilters}
            onSelectedValuesChange={setCourseFilters}
            triggerClassName="w-full md:w-[250px] lg:w-[200px]"
          />
          <MultiSelectFilter
            title="Teachers"
            options={teachers.map(teacher => ({ value: teacher, label: teacher }))}
            selectedValues={teacher1Filters}
            onSelectedValuesChange={setTeacher1Filters}
            triggerClassName="w-full md:w-[250px] lg:w-[200px]"
          />

          <div className="flex-grow" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingRow(row)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Row</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {editingRow && (
        <EditDialog
          isOpen={!!editingRow}
          setIsOpen={(open) => !open && setEditingRow(null)}
          classEntry={editingRow}
          onSave={handleSave}
          columns={allColumns}
        />
      )}
    </div>
  );
}
