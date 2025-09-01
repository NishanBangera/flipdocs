"use client";

import { useParams, useRouter } from "next/navigation";
import { useFlipbook } from "@/lib/hooks/use-flipbooks";
import { EditFlipbookForm } from "../../../components/forms/edit-flipbook-form";
import { ErrorState, LoadingState } from "../../../components/ui/loading";

export default function EditFlipbookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { data: flipbook, isLoading, error, refetch } = useFlipbook(id ?? "");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Edit Flipbook</h1>
          <p className="text-sm opacity-80">Update details or files for your flipbook.</p>
        </div>
      </div>

      {isLoading && <LoadingState message="Loading flipbook..." />}
      {error && (
        <ErrorState message={error.message || "Failed to load flipbook"} onRetry={() => refetch()} />
      )}
      {!isLoading && !error && flipbook && (
        <div className="rounded-lg border p-4">
          <EditFlipbookForm
            flipbook={{
              id: flipbook.id,
              name: flipbook.name,
              status: flipbook.is_published ? "published" : "unpublished",
              pdf_url: flipbook.pdf_url,
              background_image_url: flipbook.background_image_url,
            }}
            onSuccess={() => router.replace("/manage-flipbooks")}
            onCancel={() => router.push("/manage-flipbooks")}
          />
        </div>
      )}
    </div>
  );
}
