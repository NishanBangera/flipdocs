"use client";

import { useState, useMemo } from "react";
import { DataTable } from "../components/tables/table-component";
import { createBooksColumns } from "../components/tables/manage-flipbook/manage-flipbook";
import type { FlipbookTableItem } from "../components/tables/manage-flipbook/manage-flipbook";
import { useFlipbooks, useTogglePublish, useDeleteFlipbook } from "@/lib/hooks/use-flipbooks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CreateFlipbookForm } from "../components/forms/create-flipbook-form";
import { EditFlipbookForm } from "../components/forms/edit-flipbook-form";
import { ErrorState } from "../components/ui/loading";
import { Plus } from "lucide-react";
import type { Flipbook } from "@/lib/types";
import { DialogTitle } from "@radix-ui/react-dialog";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FlipbookTableItem | null>(null);
  const { data: flipbooks = [], isLoading, error, refetch } = useFlipbooks();
  console.log("Fetched flipbooks12222222:", flipbooks);
  
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
      (fb) => { setEditing(fb); setIsEditDialogOpen(true); }
    );
  }, [togglePublish, deleteFlipbook]);

  // Transform data for table display
  const tableData = flipbooks.map(transformFlipbookToTableItem);
  console.log("Table Dataaaaa:", tableData);
  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    // Data will be automatically refetched due to React Query invalidation
  };

  const handleCreateCancel = () => {
    setIsCreateDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditing(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditing(null);
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
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manage Flipbooks</h1>
          <p className="text-sm opacity-80">Manage your flipbook collection</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer">
              <Plus size={16} />
              Create New Flipbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs sm:max-w-md max-h-[70vh] overflow-y-hidden p-4 gap-2">
            <DialogTitle className="text-base">Create New Flipbook</DialogTitle>
            <CreateFlipbookForm
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-grow rounded-lg">
        <DataTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={(o) => { if(!o){ setEditing(null);} setIsEditDialogOpen(o); }}>
        <DialogContent className="max-w-xs sm:max-w-md max-h-[70vh] overflow-y-hidden p-4 gap-2">
          <DialogTitle className="text-base">Edit Flipbook</DialogTitle>
          {editing && (
            <EditFlipbookForm
              flipbook={editing}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
