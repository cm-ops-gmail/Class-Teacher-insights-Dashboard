
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
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Loader,
} from "lucide-react";
import type { ClassEntry } from "@/lib/definitions";

type ColumnDef = {
  key: keyof ClassEntry;
  header: string;
  sortable?: boolean;
};

type SortConfig = {
  key: keyof ClassEntry;
  direction: "ascending" | "descending";
} | null;

interface DataTableProps {
  data: ClassEntry[];
  allColumns: ColumnDef[];
  columnVisibility: Record<keyof ClassEntry, boolean>;
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
  columnVisibility,
  isLoading,
}: DataTableProps) {
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

  return (
    <div className="relative">
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
      <div className="h-[500px] w-full overflow-auto rounded-md border custom-scrollbar">
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
                    <TableCell key={col.key} className="whitespace-nowrap">
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
