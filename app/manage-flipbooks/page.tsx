"use client";

import { useState, useMemo } from "react";
import { DataTable } from "../components/tables/table-component";
import { createBooksColumns } from "../components/tables/manage-flipbook/manage-flipbook";
import type { FlipbookTableItem } from "../components/tables/manage-flipbook/manage-flipbook";
import { useFlipbooks, useTogglePublish, useDeleteFlipbook } from "@/lib/hooks/use-flipbooks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CreateFlipbookForm } from "../components/forms/create-flipbook-form";
import { ErrorState } from "../components/ui/loading";
import { Plus } from "lucide-react";
import type { Flipbook } from "@/lib/types";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: flipbooks = [], isLoading, error, refetch } = useFlipbooks();
  
  // Get React Query hooks for table actions
  const togglePublish = useTogglePublish();
  const deleteFlipbook = useDeleteFlipbook();

  // Create columns with callback functions
  const columns = useMemo(() => {
    return createBooksColumns(
      (id: string) => togglePublish.mutate(id),
      (id: string) => deleteFlipbook.mutate(id),
      (id: string) => togglePublish.isPending && togglePublish.variables === id,
      (id: string) => deleteFlipbook.isPending && deleteFlipbook.variables === id
    );
  }, [togglePublish, deleteFlipbook]);

  // Transform data for table display
  const tableData = flipbooks.map(transformFlipbookToTableItem);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    // Data will be automatically refetched due to React Query invalidation
  };

  const handleCreateCancel = () => {
    setIsCreateDialogOpen(false);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Manage Flipbooks</h1>
            <p className="text-sm opacity-80">Manage your flipbook collection</p>
          </div>
        </div>
        <ErrorState
          message={error.message || "Failed to load flipbooks"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manage Flipbooks</h1>
          <p className="text-sm opacity-80">Manage your flipbook collection</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Create New Flipbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateFlipbookForm
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border">
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
