"use client";
import SkeletonTable from "../placeholders/skeleton.table.component";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import Pagination from "../sections/pagination/pagination.component";

interface IDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  fontSize?: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onRowSelectionChange?: (selectedCount: number) => void;
  renderExpandedRow?: (row: any) => React.ReactNode;
}

import * as React from "react";

export function DataTable<T>({
  data = [],
  columns,
  currentPage,
  setCurrentPage,
  isLoading = false,
  fontSize = "14px",
  onRowSelectionChange,
  renderExpandedRow,
}: IDataTableProps<T>) {
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const totalItems = data.length;
  console.log("Total Items:", data);
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: currentPage,
        pageSize: itemsPerPage,
      },
    },
    getRowId: (row: any) => row.id,
    enableRowSelection: true,
  });

  const font = `text-[${fontSize}]`;

  const paginate = useCallback(
    (pageNumber: number): void => {
      setCurrentPage && setCurrentPage(pageNumber);
    },
    [setCurrentPage]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setItemsPerPage(newPageSize);
      // Reset to first page when changing page size
      setCurrentPage(0);
    },
    [setCurrentPage]
  );

  // Notify parent of row selection changes
  useEffect(() => {
    if (typeof onRowSelectionChange === "function") {
      const selectedCount = Object.values(rowSelection).filter(Boolean).length;
      onRowSelectionChange(selectedCount);
    }
  }, [rowSelection, onRowSelectionChange]);
  console.log("TableData:", data);

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <>
          <div className="flex-grow h-0 overflow-y-auto">
            <Table className="w-full min-w-full border-0">
              <TableHeader className="bg-secondary-foreground">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-0">
                    {headerGroup.headers.map((header, index) => {
                      const isFirst = index === 0;
                      const isLast = index === headerGroup.headers.length - 1;
                      return (
                        <TableHead
                          key={header.id}
                          style={{
                            width: header.column.columnDef.size || "auto",
                            minWidth:
                              header.column.columnDef.minSize || "100px",
                            maxWidth: header.column.columnDef.maxSize || "none",
                            color: "#fff",
                            borderColor: "transparent",
                          }}
                          className={`border-transparent text-left p-2 ${
                            isFirst ? "rounded-l-sm" : ""
                          } ${isLast ? "rounded-r-sm" : ""}`}
                        >
                          <div className="flex items-center justify-start w-full">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody
                className={`${font} [&>tr]:border-b [&>tr:last-child]:border-0`}
              >
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow
                        data-state={
                          row.getIsExpanded() ? "selected" : undefined
                        }
                        className={`data-[state=selected]:bg-gray-light data-[state=selected]:border-0 hover:bg-[#323232] transition-colors duration-200`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{
                              width: cell.column.columnDef.size || "auto",
                              minWidth:
                                cell.column.columnDef.minSize || "100px",
                              maxWidth: cell.column.columnDef.maxSize || "none",
                            }}
                          >
                            <div className="text-wrap line-clamp-2">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                      {row.getIsExpanded() && renderExpandedRow && (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="p-0">
                            {renderExpandedRow(row)}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow className="h-[24px]">
                    <TableCell colSpan={6}>
                      <p className="text-center text-base">No Results.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="w-full border-t flex items-end justify-end">
            {totalItems > itemsPerPage && (
              <Pagination
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                paginate={paginate}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
