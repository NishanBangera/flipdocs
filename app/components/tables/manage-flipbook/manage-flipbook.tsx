"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash, Pencil, Copy, MoreHorizontal } from "lucide-react";
import { ArrowsSort, Filter } from "tabler-icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
        <div className="font-medium flex items-center gap-3 py-1.5">
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
      meta: {
        // Hide slug on very small screens (<375px)
        headerClassName: "max-[374px]:hidden",
        cellClassName: "max-[374px]:hidden",
      },
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
          <>
            {/* Compact: only toggle on screens < md */}
            <div className="md:hidden">
              <Switch
                checked={isPublished}
                onCheckedChange={handleTogglePublish}
                disabled={isToggleLoading(flipbook.id)}
                className={`cursor-pointer ${
                  isPublished
                    ? "data-[state=checked]:bg-green-500"
                    : "data-[state=unchecked]:bg-gray-300"
                }`}
                title={isPublished ? "Unpublish" : "Publish"}
              />
            </div>

            {/* Full status pill on md and up */}
            <div
              className={`hidden md:inline-flex w-44 items-center gap-3 rounded-lg px-4 py-3 border-2 transition-all duration-200 ${
                isPublished
                  ? "bg-[#228b2229] border-[#228b22] text-[#228b22]"
                  : "bg-[#bf763f3e] border-[#c65e0e] text-[#c65e0e]"
              }`}
            >
              <Switch
                checked={isPublished}
                onCheckedChange={handleTogglePublish}
                disabled={isToggleLoading(flipbook.id)}
                className={`cursor-pointer ${
                  isPublished
                    ? "data-[state=checked]:bg-green-500"
                    : "data-[state=unchecked]:bg-gray-300"
                }`}
                title={isPublished ? "Unpublish" : "Publish"}
              />
              <span className="font-semibold text-sm">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </>
        );
      },
    },
    {
      accessorKey: "createdAt",
      meta: {
        // Hide below 1024px (lg breakpoint)
        headerClassName: "hidden lg:table-cell",
        cellClassName: "hidden lg:table-cell",
      },
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
        console.log("flipbook in actions:", flipbook);
        const isPublished = flipbook.status === "published";
  const onConfirmDelete = () => deleteFlipbook(flipbook.id);

        const handleShare = () => {
          if (isPublished) {
            const shareUrl = `${window.location.origin}/view/${flipbook.slug}`;
            copyToClipboard(shareUrl, 'Share link copied to clipboard!');
          }
        };

        return (
          <>
            {/* Below 1024px: show 3-dots menu */}
            <div className="lg:hidden">
              {(() => {
                const [menuOpen, setMenuOpen] = useState(false);
                const [confirmOpen, setConfirmOpen] = useState(false);
                return (
                  <>
                  <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                    title="Open actions"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    disabled={isDeleteLoading(flipbook.id)}
                    onSelect={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      // Open the confirm dialog after closing the menu
                      setConfirmOpen(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(flipbook)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleShare}
                    disabled={!isPublished}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy link
                  </DropdownMenuItem>
                </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Keep dialog mounted outside the menu so it doesn't unmount when menu closes */}
                  <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete flipbook?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete{' '}
                          {'"'}{flipbook.name}{'"'} and remove its data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleteLoading(flipbook.id)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onConfirmDelete}
                          disabled={isDeleteLoading(flipbook.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </>
                );
              })()}
            </div>

            {/* 1024px and above: show inline action icons */}
            <div className="hidden lg:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 text-amber-300/70 hover:text-amber-300"
                onClick={() => openEdit(flipbook)}
                title="Edit flipbook"
              >
                <span className="sr-only">Edit</span>
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 p-0 text-green-600 hover:text-green-600 disabled:cursor-not-allowed`}
                onClick={handleShare}
                disabled={!isPublished}
                title={isPublished ? "Copy share link" : "Publish to share"}
              >
                <span className="sr-only">Share</span>
                <Copy className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive"
                    disabled={isDeleteLoading(flipbook.id)}
                    title="Delete flipbook"
                  >
                    <span className="sr-only">Delete</span>
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete flipbook?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{' '}
                      {'"'}{flipbook.name}{'"'} and remove its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleteLoading(flipbook.id)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onConfirmDelete}
                      disabled={isDeleteLoading(flipbook.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        );
      },
    },
  ];
}
