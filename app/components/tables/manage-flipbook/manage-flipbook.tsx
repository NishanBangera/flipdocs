import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { ArrowsSort, Filter, Flag, Trash, Book2 } from "tabler-icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Define the book data structure
export interface Book {
  name: string;
  slug: string;
  status: "published" | "unpublished";
  createdAt: string; // e.g. "Jan 05 23"
}

export function useBooksColumns(): ColumnDef<Book>[] {
  return [
    {
      accessorKey: "name",
      header: () => (
        <div className="font-medium flex items-center gap-3">
          <span>Book</span>
          <ArrowsSort size={15} className="text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Slug</span>
          <Filter size={15} className="text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.getValue("slug")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Status</span>
          <Filter size={15} className="text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className="font-medium flex items-center gap-3">
          <span>Created At</span>
          <ArrowsSort size={15} className="text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const createdAtStr = row.getValue("createdAt") as string;
        const parsed = dayjs(createdAtStr, "MMM DD YY");
        return (
          <div className="flex flex-col">
            <span className="text-sm">{parsed.fromNow()}</span>
            <span className="text-xs text-muted-foreground">
              {parsed.format("DD MMM YYYY")}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => {
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <span className="sr-only">View Details</span>
              <Book2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <span className="sr-only">Flag</span>
              <Flag className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <span className="sr-only">Share</span>
              <Share className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <span className="sr-only">Delete</span>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export default useBooksColumns;
