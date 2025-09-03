"use client";

import { useState, useMemo } from "react";
import { DataTable } from "../components/tables/table-component";
import { createBooksColumns } from "../components/tables/manage-flipbook/manage-flipbook";
import type { FlipbookTableItem } from "../components/tables/manage-flipbook/manage-flipbook";
import { useFlipbooks, useTogglePublish, useDeleteFlipbook } from "@/lib/hooks/use-flipbooks";
import { Button } from "@/components/ui/button";
import { ErrorState } from "../components/ui/loading";
import { Plus } from "lucide-react";
import type { Flipbook } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Transform backend data to table format
const transformFlipbookToTableItem = (flipbook: Flipbook): FlipbookTableItem => ({
  id: flipbook.id,
  name: flipbook.name,
  slug: flipbook.slug,
  status: flipbook.is_published ? "published" : "unpublished",
  createdAt: flipbook.created_at,
  pdf_url: flipbook.pdf_url,
  background_image_url: flipbook.background_image_url,
});

export default function ManageFlipbooks() {
  const [currentPage, setCurrentPage] = useState(0);
  const { data: flipbooks = [], isLoading, error, refetch } = useFlipbooks();
  console.log("Flipbooks dataaaaaaa:", flipbooks);
  const router = useRouter();
  
  // Get React Query hooks for table actions
  const togglePublish = useTogglePublish();
  const deleteFlipbook = useDeleteFlipbook();

  // Create columns with callback functions
  const columns = useMemo(() => {
    return createBooksColumns(
      (id: string) => togglePublish.mutate(id),
      (id: string) => deleteFlipbook.mutate(id),
      (id: string) => togglePublish.isPending && togglePublish.variables === id,
      (id: string) => deleteFlipbook.isPending && deleteFlipbook.variables === id,
    (fb) => { router.push(`/manage-flipbooks/${fb.id}/edit`); }
    );
  }, [togglePublish, deleteFlipbook, router]);

  // Transform data for table display
  const tableData = flipbooks.map(transformFlipbookToTableItem);
  console.log("Table Dataaaaa:", tableData);
  // Creation and editing now handled on dedicated pages

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-end mb-6">
      <Button asChild className="flex items-center gap-2 cursor-pointer">
            <Link href="/manage-flipbooks/create">
        <Plus size={16} />
        <span className="max-[374px]:hidden">Create New Flipbook</span>
            </Link>
          </Button>
        </div>
        <ErrorState
          message={error.message || "Failed to load flipbooks"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-grow rounded-lg">
  <DataTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
}
