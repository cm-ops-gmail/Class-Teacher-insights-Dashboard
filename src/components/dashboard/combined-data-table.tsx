
"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ChevronsUpDown, Loader } from "lucide-react";
import type { CombinedClassEntry } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";

type ColumnDef = {
  key: keyof CombinedClassEntry;
  header: string;
  sortable?: boolean;
};

type SortConfig = {
  key: keyof CombinedClassEntry;
  direction: "ascending" | "descending";
} | null;

interface DataTableProps {
  data: CombinedClassEntry[];
  allColumns: ColumnDef[];
  columnVisibility: Record<string, boolean>;
  isLoading: boolean;
}

const parseNumericValue = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  const stringValue = String(value).trim();
  if (stringValue === '' || stringValue === '-') return 0;
  const cleanedValue = stringValue.replace(/,|\%/g, '');
  const numberValue = parseFloat(cleanedValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

const isAppEntry = (entry: CombinedClassEntry): boolean => entry.dataSource === 'app';

export function DataTable({ data, allColumns, columnVisibility, isLoading }: DataTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

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
        
        let valA: any, valB: any;

        const isNumericSort = !isNaN(numA) && !isNaN(numB) && !/d{1,2}-\w{3}-\d{4}/.test(String(aValue)) && !/\d{1,2}:\d{2}/.test(String(aValue));

        if (isNumericSort) {
          valA = numA;
          valB = numB;
        } else {
          valA = String(aValue).toLowerCase();
          valB = String(bValue).toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: keyof CombinedClassEntry) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  
  const getDisplayValue = (row: CombinedClassEntry, key: keyof CombinedClassEntry) => {
    switch (key) {
      case 'dataSource':
        return <Badge variant={row.dataSource === 'app' ? 'default' : 'secondary'}>{row.dataSource?.toUpperCase()}</Badge>;
      case 'subject':
        return isAppEntry(row) ? row.classTopic : row.subject;
      case 'product':
         return isAppEntry(row) ? row.product : row.productType;
      case 'averageAttendance':
        return parseNumericValue(isAppEntry(row) ? row.totalAttendance : row.averageAttendance).toLocaleString();
      case 'totalDuration':
         return parseNumericValue(isAppEntry(row) ? row.classDuration : row.totalDuration).toLocaleString();
      default:
        return String(row[key as keyof CombinedClassEntry] ?? '');
    }
  }

  return (
    <div className="relative">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: white; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e0e0e0; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: white rgba(255, 255, 255, 0.1); }
      `}</style>
      <div className="h-[500px] w-full overflow-auto rounded-md border custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>
                  {col.sortable ? (
                    <Button variant="ghost" onClick={() => requestSort(col.key)} className="-ml-4">
                      {col.header}
                      {sortConfig?.key === col.key ? (
                        sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
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
                <TableRow><TableCell colSpan={visibleColumns.length} className="h-24 text-center"><Loader className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
            ) : sortedData.length > 0 ? (
              sortedData.map((row) => (
                <TableRow key={row.id}>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.key} className="whitespace-nowrap">
                      {getDisplayValue(row, col.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={visibleColumns.length} className="h-24 text-center">No results found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
