import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash, Pencil, Copy,CircleCheck, CircleX } from "lucide-react";
import { ArrowsSort, Filter } from "tabler-icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { copyToClipboard } from "@/lib/utils/toast";
import type { FlipbookTableItem } from "@/lib/types";

dayjs.extend(relativeTime);

// Export the interface for use in other components
export type { FlipbookTableItem };

// Define column configuration without hooks
export function createBooksColumns(
  togglePublish: (id: string) => void,
  deleteFlipbook: (id: string) => void,
  isToggleLoading: (id: string) => boolean,
  isDeleteLoading: (id: string) => boolean,
  openEdit: (flipbook: FlipbookTableItem) => void
): ColumnDef<FlipbookTableItem>[] {
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
        const flipbook = row.original;
        const isPublished = status === "published";

        const handleTogglePublish = () => {
          togglePublish(flipbook.id);
        };

        return (
          <div
            className={`inline-flex w-28 items-center justify-center gap-2 rounded-full px-2 py-1 text-xs font-medium text-center ${
              isPublished ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={handleTogglePublish}
              disabled={isToggleLoading(flipbook.id)}
              title={isPublished ? "Unpublish" : "Publish"}
            >
              <span className="sr-only">{isPublished ? "Unpublish" : "Publish"}</span>
              {isPublished ? (
                <CircleCheck className="h-3.5 w-3.5" />
              ) : (
                <CircleX className="h-3.5 w-3.5" />
              )}
            </Button>
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
        const parsed = dayjs(createdAtStr);
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
      cell: ({ row }) => {
        const flipbook = row.original;
        const isPublished = flipbook.status === "published";

        const handleDelete = () => {
          if (window.confirm(`Are you sure you want to delete "${flipbook.name}"?`)) {
            deleteFlipbook(flipbook.id);
          }
        };

        // const handleView = () => {
        //   if (flipbook.pdf_url) {
        //     window.open(flipbook.pdf_url, '_blank');
        //   }
        // };

        const handleShare = () => {
          if (isPublished) {
            const shareUrl = `${window.location.origin}/view/${flipbook.slug}`;
            copyToClipboard(shareUrl, 'Share link copied to clipboard!');
          }
        };

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => openEdit(flipbook)}
              title="Edit flipbook"
            >
              <span className="sr-only">Edit</span>
              <Pencil className="h-4 w-4" />
            </Button>
            {/* <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={handleView}
              title="View PDF"
            >
              <span className="sr-only">View PDF</span>
              <BookOpen className="h-4 w-4" />
            </Button> */}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={handleShare}
              disabled={!isPublished}
              title={isPublished ? "Copy share link" : "Publish to share"}
            >
              <span className="sr-only">Share</span>
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 cursor-pointer text-destructive"
              onClick={handleDelete}
              disabled={isDeleteLoading(flipbook.id)}
              title="Delete flipbook"
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
